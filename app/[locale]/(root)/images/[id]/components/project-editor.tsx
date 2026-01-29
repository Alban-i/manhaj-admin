'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Trash2, Save, Loader2, Sparkles, Plus, X, DollarSign, ImagePlus } from 'lucide-react';
import {
  ImageProjectWithRelations,
  ImagePresetWithCreator,
  ImageProjectFormData,
  TextConfig,
  DEFAULT_TEXT_CONFIG,
  SIZE_PRESETS,
  FONT_FAMILIES,
  AIGenerationModel,
  AI_MODEL_OPTIONS,
  ReferenceImageRow,
} from '@/types/image-generator';
import createImageProject from '@/actions/image-generator/projects/create-project';
import updateImageProject from '@/actions/image-generator/projects/update-project';
import deleteImageProject from '@/actions/image-generator/projects/delete-project';
import generateBackground from '@/actions/image-generator/projects/generate-background';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Slider } from '@/components/ui/slider';
import ImagePreview from './image-preview';

interface ProjectEditorProps {
  project: ImageProjectWithRelations | null;
  presets: ImagePresetWithCreator[];
  isNew: boolean;
}

const ProjectEditor: React.FC<ProjectEditorProps> = ({ project, presets, isNew }) => {
  const t = useTranslations('imageGenerator');
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state
  const [name, setName] = useState(project?.name ?? '');
  const [aiModel, setAiModel] = useState<AIGenerationModel>('nano-banana');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
    project?.background_image_url ?? null
  );
  const [presetId, setPresetId] = useState<string | null>(project?.preset_id ?? null);
  const [generationPrompt, setGenerationPrompt] = useState(project?.generation_prompt ?? '');
  const [styleReferenceUrl, setStyleReferenceUrl] = useState(project?.style_reference_url ?? '');
  const [width, setWidth] = useState(project?.width ?? 1200);
  const [height, setHeight] = useState(project?.height ?? 630);
  const [sizePreset, setSizePreset] = useState<string>('custom');
  const [textContent, setTextContent] = useState(project?.text_content ?? '');

  // Reference images state - flexible rows with descriptions
  const [referenceImages, setReferenceImages] = useState<ReferenceImageRow[]>([]);
  const [uploadingRowId, setUploadingRowId] = useState<string | null>(null);

  // File input refs - stored by row id
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Text config state
  const existingTextConfig = project?.text_config as unknown as TextConfig | undefined;
  const [textConfig, setTextConfig] = useState<TextConfig>({
    ...DEFAULT_TEXT_CONFIG,
    ...existingTextConfig,
  });

  // Get selected model config
  const selectedModelConfig = AI_MODEL_OPTIONS.find((m) => m.value === aiModel);
  const supportsReferenceImages = selectedModelConfig?.supportsReferenceImages ?? false;
  const maxReferenceImages = selectedModelConfig?.maxReferenceImages ?? 0;

  // Calculate total reference images count (only rows with actual images)
  const totalReferenceImages = referenceImages.filter((row) => row.base64).length;

  // Initialize size preset based on current dimensions
  useEffect(() => {
    const matchingPreset = SIZE_PRESETS.find(
      (p) => p.width === width && p.height === height
    );
    if (matchingPreset) {
      setSizePreset(matchingPreset.name);
    } else {
      setSizePreset('custom');
    }
  }, []);

  // Clear reference images when switching to a model that doesn't support them
  useEffect(() => {
    if (!supportsReferenceImages) {
      setReferenceImages([]);
    }
  }, [supportsReferenceImages]);

  // Apply preset settings when a preset is selected
  const handlePresetChange = (value: string) => {
    if (value === 'none') {
      setPresetId(null);
      return;
    }

    setPresetId(value);
    const selectedPreset = presets.find((p) => p.id === value);
    if (selectedPreset) {
      setWidth(selectedPreset.width);
      setHeight(selectedPreset.height);
      setGenerationPrompt(selectedPreset.prompt_template);
      setStyleReferenceUrl(selectedPreset.style_reference_url ?? '');

      // Apply text config from preset
      const presetTextConfig = selectedPreset.text_config as unknown as TextConfig | undefined;
      if (presetTextConfig) {
        setTextConfig({ ...DEFAULT_TEXT_CONFIG, ...presetTextConfig });
      }

      // Update size preset dropdown
      const matchingSize = SIZE_PRESETS.find(
        (p) => p.width === selectedPreset.width && p.height === selectedPreset.height
      );
      setSizePreset(matchingSize?.name ?? 'custom');
    }
  };

  const handleSizePresetChange = (value: string) => {
    setSizePreset(value);
    if (value !== 'custom') {
      const preset = SIZE_PRESETS.find((p) => p.name === value);
      if (preset) {
        setWidth(preset.width);
        setHeight(preset.height);
      }
    }
  };

  // Handle file upload for a reference image row
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    rowId: string
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploadingRowId(rowId);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1]; // Remove data:image/...;base64, prefix

        setReferenceImages((prev) =>
          prev.map((row) =>
            row.id === rowId
              ? { ...row, url: result, base64, mimeType: file.type }
              : row
          )
        );

        setUploadingRowId(null);
      };

      reader.onerror = () => {
        toast.error('Failed to read file');
        setUploadingRowId(null);
      };

      reader.readAsDataURL(file);
    } catch {
      toast.error('Failed to upload image');
      setUploadingRowId(null);
    }

    // Reset the input
    event.target.value = '';
  };

  // Add a new reference image row
  const addReferenceImageRow = () => {
    if (referenceImages.length >= maxReferenceImages) {
      toast.error(t('maxImagesReached'));
      return;
    }

    const newRow: ReferenceImageRow = {
      id: crypto.randomUUID(),
      url: '',
      description: '',
    };
    setReferenceImages((prev) => [...prev, newRow]);
  };

  // Remove a reference image row
  const removeReferenceImageRow = (rowId: string) => {
    setReferenceImages((prev) => prev.filter((row) => row.id !== rowId));
    fileInputRefs.current.delete(rowId);
  };

  // Update description for a row
  const updateRowDescription = (rowId: string, description: string) => {
    setReferenceImages((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, description } : row
      )
    );
  };

  // Clear image from a row (keep description)
  const clearRowImage = (rowId: string) => {
    setReferenceImages((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? { ...row, url: '', base64: undefined, mimeType: undefined }
          : row
      )
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t('nameRequired'));
      return;
    }

    setIsSaving(true);

    const formData: ImageProjectFormData = {
      name: name.trim(),
      preset_id: presetId,
      width,
      height,
      generation_prompt: generationPrompt.trim() || null,
      style_reference_url: styleReferenceUrl.trim() || null,
      text_content: textContent,
      text_config: textConfig,
    };

    try {
      if (isNew) {
        const result = await createImageProject(formData);
        if (result.success && result.data) {
          toast.success(t('projectCreated'));
          router.push(`/images/${result.data.id}`);
        } else {
          toast.error(result.error || t('errorCreating'));
        }
      } else if (project) {
        const result = await updateImageProject(project.id, formData);
        if (result.success) {
          toast.success(t('projectUpdated'));
        } else {
          toast.error(result.error || t('errorUpdating'));
        }
      }
    } catch {
      toast.error(t('somethingWentWrong'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    setIsDeleting(true);
    try {
      const result = await deleteImageProject(project.id);
      if (result.success) {
        toast.success(t('projectDeleted'));
        router.push('/images');
      } else {
        toast.error(result.error || t('errorDeleting'));
      }
    } catch {
      toast.error(t('somethingWentWrong'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateBackground = async () => {
    if (!project) {
      toast.error(t('saveProjectFirst'));
      return;
    }

    if (!generationPrompt.trim()) {
      toast.error(t('generationPromptRequired'));
      return;
    }

    setIsGenerating(true);
    try {
      // Prepare reference images data for API (only rows with images)
      const refImagesData = supportsReferenceImages
        ? referenceImages
            .filter((row) => row.base64 && row.mimeType && row.description.trim())
            .map((row) => ({
              base64: row.base64!,
              mimeType: row.mimeType!,
              description: row.description.trim(),
            }))
        : undefined;

      const result = await generateBackground({
        projectId: project.id,
        prompt: generationPrompt,
        model: aiModel,
        width,
        height,
        referenceImages: refImagesData && refImagesData.length > 0 ? refImagesData : undefined,
      });

      if (result.success && result.imageUrl) {
        setBackgroundImageUrl(result.imageUrl);
        toast.success(t('backgroundGenerated'));
      } else {
        toast.error(result.error || t('errorGenerating'));
      }
    } catch {
      toast.error(t('somethingWentWrong'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Render a single reference image row
  const renderReferenceImageRow = (row: ReferenceImageRow, index: number) => {
    const isUploading = uploadingRowId === row.id;
    const hasImage = !!row.base64;

    return (
      <div key={row.id} className="flex gap-3 items-start">
        {/* Image upload area */}
        <div className="relative shrink-0">
          {hasImage ? (
            <div className="relative w-20 h-20 rounded-md overflow-hidden border bg-muted">
              <img
                src={row.url}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => clearRowImage(row.id)}
                className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRefs.current.get(row.id)?.click()}
              disabled={isUploading}
              className="w-20 h-20 rounded-md border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          )}
          {/* Hidden file input */}
          <input
            ref={(el) => {
              if (el) {
                fileInputRefs.current.set(row.id, el);
              }
            }}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, row.id)}
          />
        </div>

        {/* Description textarea */}
        <div className="flex-1 space-y-1">
          <Textarea
            value={row.description}
            onChange={(e) => updateRowDescription(row.id, e.target.value)}
            placeholder={t('descriptionPlaceholder')}
            rows={2}
            className="text-sm resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {t('imageNumber', { number: index + 1 })}
            </span>
            <button
              type="button"
              onClick={() => removeReferenceImageRow(row.id)}
              className="text-xs text-destructive hover:text-destructive/80"
            >
              {t('removeRow')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 pb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {isNew ? t('newProject') : t('editProject')}
        </h2>
        <div className="flex items-center gap-2">
          {!isNew && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('deleteProjectWarning')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    {t('delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isNew ? t('create') : t('save')}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Row 1: Project Settings + Dimensions side by side */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('projectSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('projectName')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('projectNamePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('usePreset')}</Label>
                <Select
                  value={presetId ?? 'none'}
                  onValueChange={handlePresetChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectPreset')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('customSettings')}</SelectItem>
                    {presets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dimensions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('sizePreset')}</Label>
                <Select value={sizePreset} onValueChange={handleSizePresetChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_PRESETS.map((preset) => (
                      <SelectItem key={preset.name} value={preset.name}>
                        {preset.name} ({preset.width}x{preset.height})
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">{t('custom')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">{t('width')}</Label>
                  <Input
                    id="width"
                    type="number"
                    value={width}
                    onChange={(e) => {
                      setWidth(Number(e.target.value));
                      setSizePreset('custom');
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">{t('height')}</Label>
                  <Input
                    id="height"
                    type="number"
                    value={height}
                    onChange={(e) => {
                      setHeight(Number(e.target.value));
                      setSizePreset('custom');
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Generation Config - Full Width */}
        <Card>
            <CardHeader>
              <CardTitle>{t('generationConfig')}</CardTitle>
              <CardDescription>{t('generationConfigDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="generationPrompt">{t('generationPrompt')}</Label>
                <Textarea
                  id="generationPrompt"
                  value={generationPrompt}
                  onChange={(e) => setGenerationPrompt(e.target.value)}
                  placeholder={t('generationPromptPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('modelSelection')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AI_MODEL_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 cursor-pointer rounded-md border-2 px-3 py-2 transition-colors ${
                        aiModel === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                      onClick={() => setAiModel(option.value)}
                    >
                      <Checkbox
                        checked={aiModel === option.value}
                        className="pointer-events-none"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{t(option.labelKey)}</span>
                        <span className="text-xs text-muted-foreground">
                          {t(option.descriptionKey)}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reference Images Section - Only shown for Gemini models */}
              {supportsReferenceImages && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label className="text-base">{t('referenceImages')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('referenceImagesDescription')} ({totalReferenceImages}/{maxReferenceImages})
                    </p>
                  </div>

                  {/* Reference image rows */}
                  <div className="space-y-4">
                    {referenceImages.map((row, index) => renderReferenceImageRow(row, index))}
                  </div>

                  {/* Add row button */}
                  {referenceImages.length < maxReferenceImages && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addReferenceImageRow}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('addRow')}
                    </Button>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  {t('estimatedCost', { cost: selectedModelConfig?.estimatedCost?.toFixed(2) ?? '0.00' })}
                </p>
                <Button
                  onClick={handleGenerateBackground}
                  disabled={isGenerating || isNew || !generationPrompt.trim()}
                  className="w-full"
                  variant="secondary"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {isGenerating ? t('generating') : t('generateBackground')}
                </Button>
              </div>

              {isNew && (
                <p className="text-sm text-muted-foreground">{t('saveToGenerate')}</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="styleReferenceUrl">{t('styleReferenceUrl')}</Label>
                <Input
                  id="styleReferenceUrl"
                  value={styleReferenceUrl}
                  onChange={(e) => setStyleReferenceUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

        {/* Row 3: Preview - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle>{t('preview')}</CardTitle>
            <CardDescription>
              {width}x{height}px
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImagePreview
              width={width}
              height={height}
              textContent={textContent}
              textConfig={textConfig}
              backgroundImageUrl={backgroundImageUrl}
            />
          </CardContent>
        </Card>

        {/* Row 4: Text Overlay - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle>{t('textOverlay')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="textContent">{t('textContent')}</Label>
              <Textarea
                id="textContent"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder={t('textContentPlaceholder')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>{t('fontFamily')}</Label>
                <Select
                  value={textConfig.fontFamily}
                  onValueChange={(value) =>
                    setTextConfig({ ...textConfig, fontFamily: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('position')}</Label>
                <Select
                  value={textConfig.position}
                  onValueChange={(value) =>
                    setTextConfig({ ...textConfig, position: value as TextConfig['position'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">{t('positionTop')}</SelectItem>
                    <SelectItem value="center">{t('positionCenter')}</SelectItem>
                    <SelectItem value="bottom">{t('positionBottom')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('alignment')}</Label>
                <Select
                  value={textConfig.alignment}
                  onValueChange={(value) =>
                    setTextConfig({ ...textConfig, alignment: value as TextConfig['alignment'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">{t('alignLeft')}</SelectItem>
                    <SelectItem value="center">{t('alignCenter')}</SelectItem>
                    <SelectItem value="right">{t('alignRight')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('fontSize')}: {textConfig.fontSize}px</Label>
                <Slider
                  value={[textConfig.fontSize]}
                  onValueChange={([value]) =>
                    setTextConfig({ ...textConfig, fontSize: value })
                  }
                  min={12}
                  max={120}
                  step={1}
                  className="mt-3"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('textColor')}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={textConfig.color}
                    onChange={(e) =>
                      setTextConfig({ ...textConfig, color: e.target.value })
                    }
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={textConfig.color}
                    onChange={(e) =>
                      setTextConfig({ ...textConfig, color: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('backgroundColor')}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={textConfig.bgColor}
                    onChange={(e) =>
                      setTextConfig({ ...textConfig, bgColor: e.target.value })
                    }
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={textConfig.bgColor}
                    onChange={(e) =>
                      setTextConfig({ ...textConfig, bgColor: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('backgroundOpacity')}: {Math.round(textConfig.bgOpacity * 100)}%</Label>
                <Slider
                  value={[textConfig.bgOpacity * 100]}
                  onValueChange={([value]) =>
                    setTextConfig({ ...textConfig, bgOpacity: value / 100 })
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="mt-3"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectEditor;
