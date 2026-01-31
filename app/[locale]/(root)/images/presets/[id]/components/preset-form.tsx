'use client';

import { useState } from 'react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Trash2, Save, Loader2 } from 'lucide-react';
import {
  ImagePresetWithCreator,
  ImagePresetFormData,
  SIZE_PRESETS,
} from '@/types/image-generator';
import createImagePreset from '@/actions/image-generator/presets/create-preset';
import updateImagePreset from '@/actions/image-generator/presets/update-preset';
import deleteImagePreset from '@/actions/image-generator/presets/delete-preset';
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
interface PresetFormProps {
  preset: ImagePresetWithCreator | null;
  isNew: boolean;
}

const PresetForm: React.FC<PresetFormProps> = ({ preset, isNew }) => {
  const t = useTranslations('imageGenerator');
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [name, setName] = useState(preset?.name ?? '');
  const [promptTemplate, setPromptTemplate] = useState(preset?.prompt_template ?? '');
  const [styleReferenceUrl, setStyleReferenceUrl] = useState(preset?.style_reference_url ?? '');
  const [width, setWidth] = useState(preset?.width ?? 1200);
  const [height, setHeight] = useState(preset?.height ?? 630);
  const [sizePreset, setSizePreset] = useState<string>('custom');

  // Initialize size preset based on current dimensions
  useState(() => {
    const matchingPreset = SIZE_PRESETS.find(
      (p) => p.width === width && p.height === height
    );
    if (matchingPreset) {
      setSizePreset(matchingPreset.name);
    }
  });

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

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t('nameRequired'));
      return;
    }
    if (!promptTemplate.trim()) {
      toast.error(t('promptRequired'));
      return;
    }

    setIsSaving(true);

    const formData: ImagePresetFormData = {
      name: name.trim(),
      prompt_template: promptTemplate.trim(),
      style_reference_url: styleReferenceUrl.trim() || null,
      width,
      height,
    };

    try {
      if (isNew) {
        const result = await createImagePreset(formData);
        if (result.success && result.data) {
          toast.success(t('presetCreated'));
          router.push(`/images/presets/${result.data.id}`);
        } else {
          toast.error(result.error || t('errorCreating'));
        }
      } else if (preset) {
        const result = await updateImagePreset(preset.id, formData);
        if (result.success) {
          toast.success(t('presetUpdated'));
        } else {
          toast.error(result.error || t('errorUpdating'));
        }
      }
    } catch (error) {
      toast.error(t('somethingWentWrong'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!preset) return;

    setIsDeleting(true);
    try {
      const result = await deleteImagePreset(preset.id);
      if (result.success) {
        toast.success(t('presetDeleted'));
        router.push('/images/presets');
      } else {
        toast.error(result.error || t('errorDeleting'));
      }
    } catch (error) {
      toast.error(t('somethingWentWrong'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="px-4 pb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {isNew ? t('newPreset') : t('editPreset')}
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
                    {t('deletePresetWarning')}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('presetNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="promptTemplate">{t('promptTemplate')}</Label>
              <Textarea
                id="promptTemplate"
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
                placeholder={t('promptTemplatePlaceholder')}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {t('promptTemplateHint')}
              </p>
            </div>

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
    </div>
  );
};

export default PresetForm;
