import Image from 'next/image';

interface LoadImageProps {
  url: string | null;
  size: number;
  alt: string;
}

const LoadImage: React.FC<LoadImageProps> = ({ url, size, alt }) => {
  return url ? (
    <div
      style={{
        height: `${size}px`,
        width: `${size}px`,
      }}
      className="relative"
    >
      <Image
        fill
        src={url}
        alt={alt}
        className="rounded-lg object-cover"
        sizes={`${size}px`}
      />
    </div>
  ) : (
    <div
      style={{
        height: `${size}px`,
        width: `${size}px`,
      }}
      className="bg-secondary rounded-lg"
    />
  );
};

export default LoadImage;
