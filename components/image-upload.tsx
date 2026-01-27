'use client';

import { ImagePlus, Trash } from 'lucide-react';

import { CldImage, CldUploadWidget } from 'next-cloudinary';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { useTranslations } from 'next-intl';

interface ImageUploadProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
  value: string[];
}

interface UploadResult {
  info?:
    | {
        secure_url: string;
      }
    | string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  disabled,
  onChange,
  onRemove,
  value,
}) => {
  const t = useTranslations('articles');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  function onUpload(result: UploadResult) {
    if (typeof result.info === 'object' && result.info?.secure_url) {
      onChange(result.info.secure_url);
    } else {
      console.error('Upload failed or secure_url is missing');
    }
  }

  if (!isMounted) return null;

  return (
    <div className="mb-4 flex flex-col items-center gap-4 ">
      {value.map((url) => (
        <div
          key={url}
          className="relative w-[200px] h-[200px] rounded-md overflow-hidden"
        >
          <div className="z-10 absolute top-2 right-2">
            <Button
              variant="destructive"
              size="icon"
              type="button"
              onClick={() => onRemove(url)}
            >
              <Trash className="size-4" />
            </Button>
          </div>
          <CldImage width="200" height="200" src={url} alt="Product Image" />
        </div>
      ))}

      <CldUploadWidget onSuccess={onUpload} uploadPreset="markazshaafii">
        {({ open }) => {
          const onClick = () => {
            open();
          };
          return (
            <Button
              type="button"
              disabled={disabled}
              variant="secondary"
              onClick={onClick}
            >
              <ImagePlus className="h-4 w-4" />
              {t('addImage')}
            </Button>
          );
        }}
      </CldUploadWidget>
    </div>
  );
};

export default ImageUpload;
