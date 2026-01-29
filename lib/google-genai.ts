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

interface GenerateImageOptions {
  prompt: string;
  model?: ImageGenerationModel;
  aspectRatio?: AspectRatio;
  referenceImages?: ReferenceImageData[];
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
