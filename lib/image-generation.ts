// Supabase Storage upload result
export interface SupabaseStorageUploadResult {
  url: string;
  filePath: string;
  fileName: string;
  fileSize: number;
}

// Upload image to Supabase Storage (media bucket)
export async function uploadToSupabaseStorage(
  base64: string,
  mimeType: string,
  accessToken: string
): Promise<SupabaseStorageUploadResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error('Supabase URL not configured');
  }

  // Convert base64 to blob
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  // Generate path: image/{year}/{month}/{timestamp}_ai-generated.{ext}
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now();
  const ext = mimeType.split('/')[1] || 'png';
  const fileName = `${timestamp}_ai-generated.${ext}`;
  const filePath = `image/${year}/${month}/${fileName}`;

  // Upload to Supabase Storage with user's session token
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/media/${filePath}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': mimeType,
      },
      body: blob,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { message?: string }).message || 'Failed to upload to Supabase Storage'
    );
  }

  const url = `${supabaseUrl}/storage/v1/object/public/media/${filePath}`;
  const fileSize = byteArray.length;

  return { url, filePath, fileName, fileSize };
}

// Available models for image generation
export const IMAGE_GENERATION_MODELS = {
  'nano-banana': 'imagen-4.0-fast-generate-001',
  'nano-banana-pro': 'imagen-4.0-generate-001',
  'gemini-flash': 'gemini-2.0-flash-preview-image-generation',
  'gemini-pro': 'gemini-2.0-flash-preview-image-generation',
} as const;

export type ImageGenerationModel = keyof typeof IMAGE_GENERATION_MODELS;

export const modelSupportsReferenceImages = (model: ImageGenerationModel): boolean => {
  return model === 'gemini-flash' || model === 'gemini-pro';
};

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

interface GenerateImageResult {
  success: true;
  base64: string;
  mimeType: string;
}

interface GenerateImageError {
  success: false;
  error: string;
}

export type GenerateImageResponse = GenerateImageResult | GenerateImageError;

interface ReferenceImageData {
  base64: string;
  mimeType: string;
  description: string;
}

// Person generation options for Imagen
type PersonGeneration = 'dont_allow' | 'allow_adult' | 'allow_all';

// Image size options for Gemini
type ImageSize = '1K' | '2K' | '4K';

interface GenerateImageOptions {
  prompt: string;
  model?: ImageGenerationModel;
  aspectRatio?: AspectRatio | string;
  referenceImages?: ReferenceImageData[];
  // Imagen-specific options
  personGeneration?: PersonGeneration;
  enhancePrompt?: boolean;
  seed?: number;
  // Gemini-specific options
  imageSize?: ImageSize;
}

export function getAspectRatio(width: number, height: number): AspectRatio {
  const ratio = width / height;
  if (Math.abs(ratio - 1) < 0.1) return '1:1';
  if (Math.abs(ratio - 16 / 9) < 0.15) return '16:9';
  if (Math.abs(ratio - 9 / 16) < 0.15) return '9:16';
  if (Math.abs(ratio - 4 / 3) < 0.15) return '4:3';
  if (Math.abs(ratio - 3 / 4) < 0.15) return '3:4';
  return ratio > 1 ? '16:9' : '9:16';
}

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse>;

export async function generateImage(
  prompt: string,
  model?: ImageGenerationModel,
  width?: number,
  height?: number
): Promise<GenerateImageResponse>;

export async function generateImage(
  promptOrOptions: string | GenerateImageOptions,
  model: ImageGenerationModel = 'nano-banana',
  width: number = 1200,
  height: number = 630
): Promise<GenerateImageResponse> {
  let options: GenerateImageOptions;

  if (typeof promptOrOptions === 'string') {
    options = {
      prompt: promptOrOptions,
      model,
      aspectRatio: getAspectRatio(width, height),
    };
  } else {
    options = promptOrOptions;
  }

  const {
    prompt,
    model: selectedModel = 'nano-banana',
    aspectRatio = '16:9',
    referenceImages,
    personGeneration,
    enhancePrompt,
    seed,
    imageSize,
  } = options;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Supabase configuration missing' };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        prompt,
        model: selectedModel,
        aspectRatio,
        referenceImages,
        // Imagen-specific options
        personGeneration,
        enhancePrompt,
        seed,
        // Resolution options (Imagen: 1K/2K, Gemini: 1K/2K/4K)
        imageSize,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Edge function failed' };
    }

    return await response.json();
  } catch (error) {
    console.error('Image generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
