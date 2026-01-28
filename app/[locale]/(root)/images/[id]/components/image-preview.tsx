'use client';

import { useMemo } from 'react';
import { TextConfig } from '@/types/image-generator';

interface ImagePreviewProps {
  width: number;
  height: number;
  textContent: string;
  textConfig: TextConfig;
  backgroundImageUrl: string | null;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  width,
  height,
  textContent,
  textConfig,
  backgroundImageUrl,
}) => {
  // Calculate aspect ratio for preview scaling
  const aspectRatio = width / height;

  // Get position styles based on text position
  const positionStyles = useMemo(() => {
    switch (textConfig.position) {
      case 'top':
        return { alignItems: 'flex-start', paddingTop: '10%' };
      case 'bottom':
        return { alignItems: 'flex-end', paddingBottom: '10%' };
      case 'center':
      default:
        return { alignItems: 'center' };
    }
  }, [textConfig.position]);

  // Get text alignment
  const textAlignStyles = useMemo(() => {
    return {
      textAlign: textConfig.alignment as 'left' | 'center' | 'right',
      justifyContent:
        textConfig.alignment === 'left'
          ? 'flex-start'
          : textConfig.alignment === 'right'
          ? 'flex-end'
          : 'center',
    };
  }, [textConfig.alignment]);

  // Calculate background color with opacity
  const bgColorWithOpacity = useMemo(() => {
    const hex = textConfig.bgColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${textConfig.bgOpacity})`;
  }, [textConfig.bgColor, textConfig.bgOpacity]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border bg-muted">
      {/* Aspect ratio container */}
      <div
        style={{
          paddingBottom: `${(1 / aspectRatio) * 100}%`,
        }}
        className="relative"
      >
        {/* Preview canvas */}
        <div
          className="absolute inset-0 flex flex-col"
          style={{
            ...positionStyles,
            backgroundImage: backgroundImageUrl
              ? `url(${backgroundImageUrl})`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Text overlay */}
          {textContent && (
            <div
              className="px-4 sm:px-8 w-full flex"
              style={{
                ...textAlignStyles,
              }}
            >
              <div
                className="px-4 py-3 sm:px-6 sm:py-4 max-w-[90%]"
                style={{
                  backgroundColor: bgColorWithOpacity,
                  borderRadius: '8px',
                }}
              >
                <p
                  style={{
                    fontFamily: textConfig.fontFamily,
                    fontSize: `clamp(12px, ${textConfig.fontSize / 16}vw, ${textConfig.fontSize}px)`,
                    color: textConfig.color,
                    lineHeight: 1.3,
                    margin: 0,
                    textAlign: textConfig.alignment,
                    wordBreak: 'break-word',
                  }}
                >
                  {textContent}
                </p>
              </div>
            </div>
          )}

          {/* Placeholder when no text */}
          {!textContent && (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/60 text-sm">Enter text to preview</p>
            </div>
          )}
        </div>

        {/* Dimension indicator */}
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {width}×{height}
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
