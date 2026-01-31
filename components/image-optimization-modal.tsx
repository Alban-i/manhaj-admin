'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  OptimizationOptions,
  estimateOutputSize,
  formatFileSize,
} from '@/lib/optimize-image';

export interface MediaMetadata {
  altText: string;
  slug: string;
  description: string;
}

export interface SaveOptions extends OptimizationOptions {
  metadata: MediaMetadata;
}

interface ImageOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (options: SaveOptions) => void;
  isSaving: boolean;
  originalSize: number;
  originalDimensions: { width: number; height: number };
  defaultAltText?: string;
  defaultDescription?: string;
  defaultSlug?: string;
}

const MAX_DIMENSION_OPTIONS = [
  { value: 1200, label: '1200px' },
  { value: 1600, label: '1600px' },
  { value: 2400, label: '2400px' },
  { value: 0, label: 'original' },
];

const QUALITY_OPTIONS: { value: OptimizationOptions['quality']; labelKey: string; sizeHint: string }[] = [
  { value: 'low', labelKey: 'qualityLow', sizeHint: '~100KB' },
  { value: 'medium', labelKey: 'qualityMedium', sizeHint: '~300KB' },
  { value: 'high', labelKey: 'qualityHigh', sizeHint: '~500KB' },
  { value: 'maximum', labelKey: 'qualityMaximum', sizeHint: '' },
];

const FORMAT_OPTIONS: { value: OptimizationOptions['format']; label: string; recommended?: boolean }[] = [
  { value: 'webp', label: 'WebP', recommended: true },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
];

export const ImageOptimizationModal: React.FC<ImageOptimizationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isSaving,
  originalSize,
  originalDimensions,
  defaultAltText = '',
  defaultDescription = '',
  defaultSlug = '',
}) => {
  const t = useTranslations('imageGenerator');

  const [maxDimension, setMaxDimension] = useState<number>(2400);
  const [quality, setQuality] = useState<OptimizationOptions['quality']>('medium');
  const [format, setFormat] = useState<OptimizationOptions['format']>('webp');
  const [estimatedSize, setEstimatedSize] = useState<number>(0);

  // Metadata fields
  const [altText, setAltText] = useState(defaultAltText);
  const [slug, setSlug] = useState(defaultSlug);
  const [description, setDescription] = useState(defaultDescription);

  // Reset metadata when modal opens with new defaults
  useEffect(() => {
    if (isOpen) {
      setAltText(defaultAltText);
      setDescription(defaultDescription);
      setSlug(defaultSlug);
    }
  }, [isOpen, defaultAltText, defaultDescription, defaultSlug]);

  // Calculate estimated size when options change
  useEffect(() => {
    const actualMaxDimension = maxDimension === 0
      ? Math.max(originalDimensions.width, originalDimensions.height)
      : maxDimension;

    const estimated = estimateOutputSize(
      originalSize,
      originalDimensions,
      { maxDimension: actualMaxDimension, quality, format }
    );
    setEstimatedSize(estimated);
  }, [maxDimension, quality, format, originalSize, originalDimensions]);

  const handleSave = () => {
    const actualMaxDimension = maxDimension === 0
      ? Math.max(originalDimensions.width, originalDimensions.height)
      : maxDimension;

    onSave({
      maxDimension: actualMaxDimension,
      quality,
      format,
      metadata: {
        altText: altText.trim(),
        slug: slug.trim(),
        description: description.trim(),
      },
    });
  };

  // Calculate estimated dimensions
  const getEstimatedDimensions = () => {
    if (maxDimension === 0) {
      return `${originalDimensions.width}x${originalDimensions.height}`;
    }

    const maxOriginal = Math.max(originalDimensions.width, originalDimensions.height);
    if (maxOriginal <= maxDimension) {
      return `${originalDimensions.width}x${originalDimensions.height}`;
    }

    const scale = maxDimension / maxOriginal;
    const newWidth = Math.round(originalDimensions.width * scale);
    const newHeight = Math.round(originalDimensions.height * scale);
    return `${newWidth}x${newHeight}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('saveToMediaTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Max Dimension */}
          <div className="space-y-3">
            <Label>{t('maxDimension')}</Label>
            <RadioGroup
              value={maxDimension.toString()}
              onValueChange={(v) => setMaxDimension(parseInt(v))}
              className="flex flex-wrap gap-2"
            >
              {MAX_DIMENSION_OPTIONS.map((option) => {
                const maxOriginal = Math.max(originalDimensions.width, originalDimensions.height);
                const willNotResize = option.value !== 0 && option.value >= maxOriginal;

                return (
                  <div key={option.value} className="flex items-center">
                    <RadioGroupItem
                      value={option.value.toString()}
                      id={`dim-${option.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`dim-${option.value}`}
                      className="flex items-center justify-center px-3 py-2 border rounded-md cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted transition-colors"
                    >
                      {option.value === 0 ? t('original') : option.label}
                      {willNotResize && (
                        <span className="text-xs text-muted-foreground ml-1">({t('noResize')})</span>
                      )}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Quality */}
          <div className="space-y-3">
            <Label>{t('quality')}</Label>
            <RadioGroup
              value={quality}
              onValueChange={(v) => setQuality(v as OptimizationOptions['quality'])}
              className="grid grid-cols-2 gap-2"
            >
              {QUALITY_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center">
                  <RadioGroupItem
                    value={option.value}
                    id={`quality-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`quality-${option.value}`}
                    className="flex flex-col items-center justify-center w-full px-3 py-2 border rounded-md cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted transition-colors"
                  >
                    <span>{t(option.labelKey)}</span>
                    {option.sizeHint && (
                      <span className="text-xs text-muted-foreground">{option.sizeHint}</span>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Format */}
          <div className="space-y-3">
            <Label>{t('format')}</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as OptimizationOptions['format'])}
              className="flex gap-2"
            >
              {FORMAT_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center">
                  <RadioGroupItem
                    value={option.value}
                    id={`format-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`format-${option.value}`}
                    className="flex items-center justify-center px-3 py-2 border rounded-md cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted transition-colors"
                  >
                    {option.label}
                    {option.recommended && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({t('recommended')})
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Media Metadata */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-base font-medium">{t('mediaMetadata')}</Label>

            <div className="space-y-2">
              <Label htmlFor="altText">{t('altText')}</Label>
              <Textarea
                id="altText"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder={t('altTextPlaceholder')}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">{t('slugLabel')}</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder={t('slugPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('descriptionLabel')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          {/* Size Info */}
          <div className="pt-4 border-t space-y-1 text-sm">
            <p className="text-muted-foreground">
              {t('original')}: {originalDimensions.width}x{originalDimensions.height} • {formatFileSize(originalSize)}
            </p>
            <p className="font-medium">
              {t('estimated')}: {getEstimatedDimensions()} • ~{formatFileSize(estimatedSize)}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('saving')}
              </>
            ) : (
              t('saveToMedia')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageOptimizationModal;
