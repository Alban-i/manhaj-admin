'use client';

import React from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { MediaWithProfile } from '@/actions/media/get-media';
import { cn } from '@/lib/utils';

interface ImageGridItemProps {
  media: MediaWithProfile;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onSelect: () => void;
}

export const ImageGridItem: React.FC<ImageGridItemProps> = ({
  media,
  isSelected = false,
  isHighlighted = false,
  onSelect,
}) => {
  return (
    <div
      className={cn(
        'relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:opacity-90',
        isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-muted-foreground/30',
        isHighlighted && 'ring-2 ring-green-500 ring-offset-2'
      )}
      onClick={onSelect}
    >
      <Image
        src={media.url}
        alt={media.original_name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
      />

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-4 w-4" />
        </div>
      )}

      {/* Filename overlay on hover */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 hover:opacity-100 transition-opacity">
        <p className="text-white text-xs truncate" title={media.original_name}>
          {media.original_name}
        </p>
      </div>
    </div>
  );
};
