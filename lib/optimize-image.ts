import imageCompression from 'browser-image-compression';

export interface OptimizationOptions {
  maxDimension: number;
  quality: 'low' | 'medium' | 'high' | 'maximum';
  format: 'webp' | 'jpeg' | 'png';
}

export interface OptimizationResult {
  file: File;
  originalSize: number;
  optimizedSize: number;
  wasOptimized: boolean;
}

export interface Base64OptimizationResult {
  base64: string;
  mimeType: string;
  size: number;
  originalSize: number;
  wasOptimized: boolean;
}

const QUALITY_TO_SIZE_MB: Record<OptimizationOptions['quality'], number> = {
  low: 0.1,
  medium: 0.3,
  high: 0.5,
  maximum: 2,
};

const FORMAT_TO_MIME: Record<OptimizationOptions['format'], string> = {
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

/**
 * Check if a file should be optimized
 * Skip GIFs (preserve animation) and small files (<200KB)
 */
export function shouldOptimize(file: File): boolean {
  // Skip if not an image
  if (!file.type.startsWith('image/')) {
    return false;
  }

  // Skip GIFs to preserve animation
  if (file.type === 'image/gif') {
    return false;
  }

  // Skip small files (less than 200KB)
  if (file.size < 200 * 1024) {
    return false;
  }

  return true;
}

/**
 * Optimize an image file for upload
 * Default: max 2400px, ~500KB target, WebP format
 */
export async function optimizeImage(
  file: File,
  options: Partial<OptimizationOptions> = {}
): Promise<OptimizationResult> {
  const originalSize = file.size;

  // If shouldn't optimize, return as-is
  if (!shouldOptimize(file)) {
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      wasOptimized: false,
    };
  }

  const finalOptions: OptimizationOptions = {
    maxDimension: options.maxDimension ?? 2400,
    quality: options.quality ?? 'high',
    format: options.format ?? 'webp',
  };

  try {
    const optimized = await imageCompression(file, {
      maxWidthOrHeight: finalOptions.maxDimension,
      maxSizeMB: QUALITY_TO_SIZE_MB[finalOptions.quality],
      fileType: FORMAT_TO_MIME[finalOptions.format] as 'image/webp' | 'image/jpeg' | 'image/png',
      useWebWorker: true,
    });

    // Create a new file with proper extension
    const extension = finalOptions.format;
    const originalName = file.name.replace(/\.[^.]+$/, '');
    const newFile = new File(
      [optimized],
      `${originalName}.${extension}`,
      { type: FORMAT_TO_MIME[finalOptions.format] }
    );

    return {
      file: newFile,
      originalSize,
      optimizedSize: newFile.size,
      wasOptimized: true,
    };
  } catch (error) {
    console.error('Image optimization failed:', error);
    // Return original file on error
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      wasOptimized: false,
    };
  }
}

/**
 * Optimize a base64-encoded image
 * Used for AI-generated images
 */
export async function optimizeBase64Image(
  base64: string,
  mimeType: string,
  options: OptimizationOptions
): Promise<Base64OptimizationResult> {
  // Convert base64 to File
  const blob = await fetch(`data:${mimeType};base64,${base64}`).then((r) => r.blob());
  const originalSize = blob.size;
  const file = new File([blob], 'image.png', { type: mimeType });

  // Skip optimization if maximum quality and original format
  if (options.quality === 'maximum' && options.format === 'png') {
    return {
      base64,
      mimeType,
      size: originalSize,
      originalSize,
      wasOptimized: false,
    };
  }

  try {
    const optimized = await imageCompression(file, {
      maxWidthOrHeight: options.maxDimension,
      maxSizeMB: QUALITY_TO_SIZE_MB[options.quality],
      fileType: FORMAT_TO_MIME[options.format] as 'image/webp' | 'image/jpeg' | 'image/png',
      useWebWorker: true,
    });

    // Convert back to base64
    const arrayBuffer = await optimized.arrayBuffer();
    const optimizedBase64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    return {
      base64: optimizedBase64,
      mimeType: FORMAT_TO_MIME[options.format],
      size: optimized.size,
      originalSize,
      wasOptimized: true,
    };
  } catch (error) {
    console.error('Base64 image optimization failed:', error);
    // Return original on error
    return {
      base64,
      mimeType,
      size: originalSize,
      originalSize,
      wasOptimized: false,
    };
  }
}

/**
 * Get image dimensions from a File or base64 string
 */
export async function getImageDimensions(
  source: File | string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    if (typeof source === 'string') {
      // Base64 or URL
      img.src = source.startsWith('data:') ? source : `data:image/png;base64,${source}`;
    } else {
      // File
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Calculate estimated output size based on options
 * This is a rough estimate for UI purposes
 */
export function estimateOutputSize(
  originalSize: number,
  originalDimensions: { width: number; height: number },
  options: OptimizationOptions
): number {
  const targetSizeMB = QUALITY_TO_SIZE_MB[options.quality];
  const targetSizeBytes = targetSizeMB * 1024 * 1024;

  // Calculate dimension reduction factor
  const maxDim = Math.max(originalDimensions.width, originalDimensions.height);
  const dimensionFactor = maxDim > options.maxDimension
    ? (options.maxDimension / maxDim) ** 2
    : 1;

  // Estimate based on both dimension reduction and quality target
  const dimensionBasedSize = originalSize * dimensionFactor;

  // Take the smaller of the two estimates
  return Math.min(dimensionBasedSize, targetSizeBytes);
}
