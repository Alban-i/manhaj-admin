'use client';

import { useState, useEffect } from 'react';
import { ImagePlus, Trash } from 'lucide-react';
import { Button } from './ui/button';
import { useTranslations } from 'next-intl';
import { MediaLibraryModal } from './media/media-library-modal';
import { MediaWithProfile } from '@/actions/media/get-media';

interface ImageMetadata {
  width: number;
  height: number;
  size: number | null;
  format: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface ImagePreviewProps {
  url: string;
  onRemove: () => void;
  disabled?: boolean;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  url,
  onRemove,
  disabled,
}) => {
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);

  useEffect(() => {
    // Fetch file size and format via HEAD request
    const fetchMetadata = async () => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        const contentLength = response.headers.get('content-length');
        const contentType = response.headers.get('content-type');

        // Extract format from content-type (e.g., "image/png" -> "PNG")
        const format = contentType
          ? contentType.split('/')[1]?.split(';')[0]?.toUpperCase() || null
          : null;

        return {
          size: contentLength ? parseInt(contentLength, 10) : null,
          format,
        };
      } catch {
        return { size: null, format: null };
      }
    };

    fetchMetadata().then(({ size, format }) => {
      setMetadata((prev) => (prev ? { ...prev, size, format } : null));
    });
  }, [url]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setMetadata((prev) => ({
      width: img.naturalWidth,
      height: img.naturalHeight,
      size: prev?.size ?? null,
      format: prev?.format ?? null,
    }));
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative max-w-[400px] rounded-md overflow-hidden">
        <div className="z-10 absolute top-2 right-2">
          <Button
            variant="destructive"
            size="icon"
            type="button"
            onClick={onRemove}
            disabled={disabled}
          >
            <Trash className="size-4" />
          </Button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Image"
          className="w-full h-auto rounded-md"
          style={{ maxHeight: '400px', objectFit: 'contain' }}
          onLoad={handleImageLoad}
        />
      </div>
      {metadata && (
        <div className="text-xs text-muted-foreground">
          {metadata.width} × {metadata.height} px
          {metadata.size && ` • ${formatFileSize(metadata.size)}`}
          {metadata.format && ` • ${metadata.format}`}
        </div>
      )}
    </div>
  );
};

interface ImageUploadProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
  value: string[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  disabled,
  onChange,
  onRemove,
  value,
}) => {
  const t = useTranslations('articles');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleMediaSelect = (media: MediaWithProfile) => {
    onChange(media.url);
    setIsModalOpen(false);
  };

  return (
    <div className="mb-4 flex flex-col items-center gap-4">
      {value.map((url) => (
        <ImagePreview
          key={url}
          url={url}
          onRemove={() => onRemove(url)}
          disabled={disabled}
        />
      ))}

      <Button
        type="button"
        disabled={disabled}
        variant="secondary"
        onClick={() => setIsModalOpen(true)}
      >
        <ImagePlus className="h-4 w-4" />
        {t('addImage')}
      </Button>

      <MediaLibraryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleMediaSelect}
        mediaType="image"
        title={t('selectImage')}
      />
    </div>
  );
};

export default ImageUpload;
