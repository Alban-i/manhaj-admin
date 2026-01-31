'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { Trash2, Save, Loader2, Sparkles, Plus, X, DollarSign, ImagePlus, History, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ImageProjectWithRelations,
  ImagePresetWithCreator,
  ImageProjectFormData,
  SIZE_PRESETS,
  AIGenerationModel,
  AI_MODEL_OPTIONS,
  ReferenceImageRow,
  PersonGeneration,
  ImageSize,
  REFERENCE_IMAGE_SNIPPETS,
} from '@/types/image-generator';
import createImageProject from '@/actions/image-generator/projects/create-project';
import updateImageProject from '@/actions/image-generator/projects/update-project';
import deleteImageProject from '@/actions/image-generator/projects/delete-project';
import saveGeneratedImage from '@/actions/image-generator/projects/save-generated-image';
import getProjectGenerations, { ProjectGeneration } from '@/actions/image-generator/projects/get-project-generations';
import selectGeneration from '@/actions/image-generator/projects/select-generation';
import { generateImage, uploadToSupabaseStorage, getAspectRatio } from '@/lib/image-generation';
import { createClient } from '@/providers/supabase/client';
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
import ImagePreview from './image-preview';
import ImageOptimizationModal, { SaveOptions } from '@/components/image-optimization-modal';
import { optimizeBase64Image, getImageDimensions } from '@/lib/optimize-image';

interface ProjectEditorProps {
  project: ImageProjectWithRelations | null;
  presets: ImagePresetWithCreator[];
  isNew: boolean;
}

/**
 * Generate a slug from a prompt by taking the first few words
 */
const generateSlugFromPrompt = (prompt: string): string => {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .split(/\s+/)                  // Split by whitespace
    .slice(0, 4)                   // Take first 4 words
    .join('-');                    // Join with hyphens
};

const ProjectEditor: React.FC<ProjectEditorProps> = ({ project, presets, isNew }) => {
  const t = useTranslations('imageGenerator');
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state
  const [name, setName] = useState(project?.name ?? '');
  const [aiModel, setAiModel] = useState<AIGenerationModel>(
    (project?.ai_model as AIGenerationModel) ?? 'nano-banana'
  );
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
    project?.background_image_url ?? null
  );
  const [presetId, setPresetId] = useState<string | null>(project?.preset_id ?? null);
  const DEFAULT_GENERATION_PROMPT = `[Your subject description].

Composition: Center the main subject in the middle of the frame.
Leave generous empty space (at least 20%) on all sides around the subject.
The image must work when cropped to different aspect ratios (16:9, 4:3, 2:1).
Avoid placing important elements near the edges.`;

  const [generationPrompt, setGenerationPrompt] = useState(
    project?.generation_prompt ?? (isNew ? DEFAULT_GENERATION_PROMPT : '')
  );
  const [styleReferenceUrl, setStyleReferenceUrl] = useState(project?.style_reference_url ?? '');
  const [width, setWidth] = useState(project?.width ?? 1600);
  const [height, setHeight] = useState(project?.height ?? 900);
  const [sizePreset, setSizePreset] = useState<string>('custom');

  // Reference images state - flexible rows with descriptions
  const [referenceImages, setReferenceImages] = useState<ReferenceImageRow[]>(
    (project?.reference_images as unknown as ReferenceImageRow[]) ?? []
  );
  const [uploadingRowId, setUploadingRowId] = useState<string | null>(null);

  // Generation history state
  const [generations, setGenerations] = useState<ProjectGeneration[]>([]);
  const [isSelectingGeneration, setIsSelectingGeneration] = useState<string | null>(null);

  // Pending image state (for unsaved AI-generated images)
  interface PendingImage {
    base64: string;
    mimeType: string;
    prompt: string;
    model: string;
    dimensions: { width: number; height: number };
  }
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  const [isSavingToMedia, setIsSavingToMedia] = useState(false);
  const [savedMediaSlug, setSavedMediaSlug] = useState<string | null>(null);

  // File input refs - stored by row id
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Generation parameters state (persisted to DB)
  const [aspectRatio, setAspectRatio] = useState<string | null>(
    project?.aspect_ratio ?? (isNew ? '16:9' : null)
  );
  const [personGeneration, setPersonGeneration] = useState<PersonGeneration>(
    (project?.person_generation as PersonGeneration) ?? 'dont_allow'
  );
  const [enhancePrompt, setEnhancePrompt] = useState(project?.enhance_prompt ?? true);
  const [seed, setSeed] = useState<number | null>(project?.seed ?? null);
  const [imageSize, setImageSize] = useState<ImageSize>(
    (project?.image_size as ImageSize) ?? '2K'
  );

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

  // Reset imageSize when switching to a model that doesn't support the current size
  useEffect(() => {
    const availableSizes = selectedModelConfig?.imageSizeOptions ?? [];
    if (availableSizes.length > 0 && !availableSizes.includes(imageSize)) {
      // Default to the highest available size, or '2K' if available, otherwise first option
      const newSize = availableSizes.includes('2K')
        ? '2K'
        : availableSizes[availableSizes.length - 1];
      setImageSize(newSize);
    }
  }, [aiModel, selectedModelConfig?.imageSizeOptions]);

  // Load generation history on mount
  useEffect(() => {
    if (project?.id) {
      loadGenerations();
    }
  }, [project?.id]);

  const loadGenerations = async () => {
    if (!project?.id) return;
    const { data } = await getProjectGenerations(project.id);
    setGenerations(data || []);
  };

  // Initialize savedMediaSlug from the selected generation when generations load
  useEffect(() => {
    const selectedGeneration = generations.find(g => g.is_selected);
    if (selectedGeneration?.media?.slug) {
      setSavedMediaSlug(selectedGeneration.media.slug);
    }
  }, [generations]);

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
      // Generation parameters
      aspect_ratio: aspectRatio,
      person_generation: personGeneration,
      enhance_prompt: enhancePrompt,
      seed,
      image_size: imageSize,
      ai_model: aiModel,
      reference_images: referenceImages,
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

  const handleSelectGeneration = async (generationId: string) => {
    if (!project?.id) return;

    setIsSelectingGeneration(generationId);
    try {
      const result = await selectGeneration(project.id, generationId);
      if (result.success && result.imageUrl) {
        setBackgroundImageUrl(result.imageUrl);

        // Update savedMediaSlug from the selected generation
        const selectedGen = generations.find(g => g.id === generationId);
        if (selectedGen?.media?.slug) {
          setSavedMediaSlug(selectedGen.media.slug);
        }

        await loadGenerations();
      } else {
        toast.error(result.error || t('somethingWentWrong'));
      }
    } catch {
      toast.error(t('somethingWentWrong'));
    } finally {
      setIsSelectingGeneration(null);
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

    // Warn if there's an unsaved image
    if (pendingImage) {
      const confirmed = window.confirm(t('unsavedImageWarning'));
      if (!confirmed) return;
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

      // Call Edge Function directly from browser (bypasses Vercel limits)
      const result = await generateImage({
        prompt: generationPrompt,
        model: aiModel,
        aspectRatio: aspectRatio || getAspectRatio(width, height),
        referenceImages: refImagesData && refImagesData.length > 0 ? refImagesData : undefined,
        // Imagen-specific options
        personGeneration,
        enhancePrompt,
        seed: seed ?? undefined,
        // Gemini-specific options
        imageSize,
      });

      if (!result.success) {
        toast.error(result.error || t('errorGenerating'));
        return;
      }

      // Get image dimensions for optimization modal
      const dataUrl = `data:${result.mimeType};base64,${result.base64}`;
      const dimensions = await getImageDimensions(dataUrl);

      // Store result in state instead of auto-saving
      setPendingImage({
        base64: result.base64,
        mimeType: result.mimeType,
        prompt: generationPrompt,
        model: aiModel,
        dimensions,
      });

      // Clear savedMediaSlug since we now have a new pending image
      setSavedMediaSlug(null);

      // Update preview with base64 data URL
      setBackgroundImageUrl(dataUrl);
      toast.success(t('imageGenerated'));
    } catch (error) {
      console.error('Error generating background:', error);
      toast.error(error instanceof Error ? error.message : t('somethingWentWrong'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToMedia = async (options: SaveOptions) => {
    if (!pendingImage || !project) return;

    setIsSavingToMedia(true);

    try {
      // Optimize the image based on selected options
      let imageBase64 = pendingImage.base64;
      let imageMimeType = pendingImage.mimeType;
      let imageSize = 0;

      // Only optimize if not maximum quality with original format
      if (options.quality !== 'maximum' || options.format !== 'png') {
        const optimized = await optimizeBase64Image(
          pendingImage.base64,
          pendingImage.mimeType,
          options
        );
        imageBase64 = optimized.base64;
        imageMimeType = optimized.mimeType;
        imageSize = optimized.size;
      } else {
        // Calculate original size for non-optimized image
        const blob = await fetch(`data:${pendingImage.mimeType};base64,${pendingImage.base64}`).then(r => r.blob());
        imageSize = blob.size;
      }

      // Get user session for authenticated upload
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error(t('sessionExpired'));
        return;
      }

      // Upload to Supabase Storage with session token
      const uploadResult = await uploadToSupabaseStorage(
        imageBase64,
        imageMimeType,
        session.access_token
      );

      // Save to database (creates media record + links to project)
      const saveResult = await saveGeneratedImage({
        projectId: project.id,
        imageUrl: uploadResult.url,
        filePath: uploadResult.filePath,
        fileName: uploadResult.fileName,
        fileSize: imageSize || uploadResult.fileSize,
        mimeType: imageMimeType,
        prompt: pendingImage.prompt,
        model: pendingImage.model,
        // Pass metadata from modal
        altText: options.metadata.altText || undefined,
        slug: options.metadata.slug || undefined,
        description: options.metadata.description || undefined,
      });

      if (!saveResult.success) {
        toast.error(saveResult.error || t('errorSaving'));
        return;
      }

      // Update background to the permanent URL
      setBackgroundImageUrl(uploadResult.url);

      // Store the saved media slug for "View in Media" button
      if (saveResult.mediaSlug) {
        setSavedMediaSlug(saveResult.mediaSlug);
      }

      // Clear pending state
      setPendingImage(null);
      setShowOptimizationModal(false);

      // Refresh generations
      await loadGenerations();
      toast.success(t('imageSavedToMedia'));
    } catch (error) {
      console.error('Error saving to media:', error);
      toast.error(error instanceof Error ? error.message : t('somethingWentWrong'));
    } finally {
      setIsSavingToMedia(false);
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
          {/* Snippet buttons */}
          <div className="flex flex-wrap gap-1 mb-1">
            {REFERENCE_IMAGE_SNIPPETS.map((snippet) => (
              <button
                key={snippet.id}
                type="button"
                onClick={() => updateRowDescription(row.id, row.description + snippet.text)}
                className="text-xs px-2 py-0.5 rounded-full bg-muted hover:bg-muted-foreground/20 text-muted-foreground transition-colors"
              >
                {t(snippet.labelKey)}
              </button>
            ))}
          </div>
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

              {/* Model-Specific Options Section */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                {/* Aspect Ratio - All models */}
                <div className="space-y-2">
                  <Label>{t('aspectRatio')}</Label>
                  <Select
                    value={aspectRatio ?? 'auto'}
                    onValueChange={(v) => setAspectRatio(v === 'auto' ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">{t('autoFromDimensions')}</SelectItem>
                      {selectedModelConfig?.aspectRatioOptions.map((ratio) => (
                        <SelectItem key={ratio} value={ratio}>{ratio}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Person Generation - Imagen only */}
                {selectedModelConfig?.supportsPersonGeneration && (
                  <div className="space-y-2">
                    <Label>{t('personGeneration')}</Label>
                    <Select value={personGeneration} onValueChange={(v) => setPersonGeneration(v as PersonGeneration)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dont_allow">{t('dontAllowPeople')}</SelectItem>
                        <SelectItem value="allow_adult">{t('allowAdults')}</SelectItem>
                        <SelectItem value="allow_all">{t('allowAll')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Image Size - Gemini only */}
                {selectedModelConfig?.supportsImageSize && selectedModelConfig.imageSizeOptions.length > 0 && (
                  <div className="space-y-2">
                    <Label>{t('outputResolution')}</Label>
                    <Select value={imageSize} onValueChange={(v) => setImageSize(v as ImageSize)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedModelConfig.imageSizeOptions.map((size) => (
                          <SelectItem key={size} value={size}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Enhance Prompt - Imagen only */}
                {selectedModelConfig?.supportsEnhancePrompt && (
                  <div className="space-y-1 col-span-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="enhancePrompt"
                        checked={enhancePrompt}
                        onCheckedChange={(checked) => setEnhancePrompt(checked === true)}
                      />
                      <Label htmlFor="enhancePrompt" className="cursor-pointer">
                        {t('enhancePrompt')}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">
                      {t('enhancePromptDescription')}
                    </p>
                  </div>
                )}
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

              {/* Generation History */}
              {generations.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">{t('generationHistory')}</Label>
                    <span className="text-xs text-muted-foreground">
                      ({generations.length})
                    </span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {generations.map((gen) => (
                      <button
                        key={gen.id}
                        type="button"
                        onClick={() => handleSelectGeneration(gen.id)}
                        disabled={isSelectingGeneration === gen.id}
                        className={cn(
                          'shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all relative',
                          gen.is_selected
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-transparent hover:border-muted-foreground/30',
                          isSelectingGeneration === gen.id && 'opacity-50'
                        )}
                      >
                        {gen.media?.url && (
                          <img
                            src={gen.media.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                        {isSelectingGeneration === gen.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('preview')}</CardTitle>
              <CardDescription>
                {width}x{height}px
                {pendingImage && (
                  <span className="ml-2 text-amber-600">({t('unsaved')})</span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {pendingImage && (
                <Button
                  onClick={() => setShowOptimizationModal(true)}
                  disabled={isSavingToMedia}
                  size="sm"
                >
                  {isSavingToMedia ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {t('saveToMedia')}
                </Button>
              )}
              {savedMediaSlug && !pendingImage && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/media/images/${savedMediaSlug}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('viewInMedia')}
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ImagePreview
              width={width}
              height={height}
              backgroundImageUrl={backgroundImageUrl}
            />
            {pendingImage && (
              <p className="text-sm text-amber-600 mt-3">
                {t('unsavedImageNote')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Optimization Modal */}
      {pendingImage && (
        <ImageOptimizationModal
          isOpen={showOptimizationModal}
          onClose={() => setShowOptimizationModal(false)}
          onSave={handleSaveToMedia}
          isSaving={isSavingToMedia}
          originalSize={
            // Calculate size from base64
            Math.ceil(pendingImage.base64.length * 0.75)
          }
          originalDimensions={pendingImage.dimensions}
          defaultAltText={pendingImage.prompt.substring(0, 200)}
          defaultDescription={`AI generated with ${pendingImage.model}`}
          defaultSlug={generateSlugFromPrompt(pendingImage.prompt)}
        />
      )}
    </div>
  );
};

export default ProjectEditor;
