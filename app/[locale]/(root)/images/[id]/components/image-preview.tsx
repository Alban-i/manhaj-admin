'use client';

interface ImagePreviewProps {
  width: number;
  height: number;
  backgroundImageUrl: string | null;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  width,
  height,
  backgroundImageUrl,
}) => {
  // Calculate aspect ratio for preview scaling
  const aspectRatio = width / height;

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
          className="absolute inset-0"
          style={{
            backgroundImage: backgroundImageUrl
              ? `url(${backgroundImageUrl})`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Dimension indicator */}
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {width}×{height}
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
