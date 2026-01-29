import { generateImage as aiGenerateImage } from 'ai';
import { createVertex } from '@ai-sdk/google-vertex';

// Create Vertex AI client with service account credentials
const getVertex = () => {
  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!project || !clientEmail || !privateKey) {
    throw new Error(
      'Google Vertex AI credentials not configured. Required: GOOGLE_VERTEX_PROJECT, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY'
    );
  }

  return createVertex({
    project,
    location,
    googleAuthOptions: {
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      },
    },
  });
};

// Available models for image generation
export const IMAGE_GENERATION_MODELS = {
  'nano-banana': 'imagen-4.0-fast-generate-001',
  'nano-banana-pro': 'imagen-4.0-generate-001',
  'gemini-flash': 'gemini-2.0-flash-exp-image-generation',
  'gemini-pro': 'gemini-2.0-flash-exp-image-generation',
} as const;

export type ImageGenerationModel = keyof typeof IMAGE_GENERATION_MODELS;

// Check if a model supports reference images
// Note: Reference images with Gemini require a different API approach (text generation with image output)
// For now, only Imagen models are fully supported via Vertex AI
export const modelSupportsReferenceImages = (model: ImageGenerationModel): boolean => {
  return model === 'gemini-flash' || model === 'gemini-pro';
};

// Supported aspect ratios for Imagen models
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

/**
 * Convert width/height to the closest supported aspect ratio
 */
export function getAspectRatio(width: number, height: number): AspectRatio {
  const ratio = width / height;

  // Check for common aspect ratios with some tolerance
  if (Math.abs(ratio - 1) < 0.1) return '1:1';
  if (Math.abs(ratio - 16 / 9) < 0.15) return '16:9';
  if (Math.abs(ratio - 9 / 16) < 0.15) return '9:16';
  if (Math.abs(ratio - 4 / 3) < 0.15) return '4:3';
  if (Math.abs(ratio - 3 / 4) < 0.15) return '3:4';

  // Default based on orientation
  return ratio > 1 ? '16:9' : '9:16';
}

/**
 * Generate an image using Google Vertex AI (Imagen models)
 */
async function generateWithImagen(
  prompt: string,
  modelId: string,
  aspectRatio: AspectRatio
): Promise<GenerateImageResponse> {
  try {
    const vertex = getVertex();

    const result = await aiGenerateImage({
      model: vertex.image(modelId),
      prompt,
      aspectRatio,
      providerOptions: {
        vertex: {
          personGeneration: 'dont_allow',
        },
      },
    });

    const image = result.images[0];
    if (!image) {
      return { success: false, error: 'No image generated' };
    }

    return {
      success: true,
      base64: image.base64,
      mimeType: 'mimeType' in image ? (image.mimeType as string) : 'image/png',
    };
  } catch (error) {
    console.error('Imagen API error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Friendly error messages
    if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403')) {
      return {
        success: false,
        error: 'Service account lacks Vertex AI permissions. Grant "Vertex AI User" role.',
      };
    }
    if (errorMessage.includes('NOT_FOUND') || errorMessage.includes('404')) {
      return {
        success: false,
        error: 'Model not found. Ensure Vertex AI API is enabled in your Google Cloud project.',
      };
    }
    if (errorMessage.includes('INVALID_ARGUMENT')) {
      return {
        success: false,
        error: 'Invalid prompt or parameters. Check prompt content and length.',
      };
    }
    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
      return { success: false, error: 'API quota exceeded. Try again later.' };
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Generate an image using Google's Vertex AI
 * @param options - Generation options including prompt, model, aspectRatio, and reference images
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse>;

/**
 * Generate an image using Google's Vertex AI
 * @param prompt - The text prompt describing the image to generate
 * @param model - The model to use
 * @param width - Desired image width (converted to aspect ratio)
 * @param height - Desired image height (converted to aspect ratio)
 * @deprecated Use the options object signature instead
 */
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
  // Normalize arguments
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

  const modelId = IMAGE_GENERATION_MODELS[selectedModel];
  const isGeminiModel = modelSupportsReferenceImages(selectedModel);

  // Gemini models with reference images are not yet supported via AI SDK
  // They require a different approach using text generation with image output
  if (isGeminiModel && referenceImages && referenceImages.length > 0) {
    return {
      success: false,
      error:
        'Reference images with Gemini models are not yet supported. Use Imagen models (nano-banana or nano-banana-pro) for text-to-image generation.',
    };
  }

  // For Gemini models without reference images, fall back to Imagen
  if (isGeminiModel) {
    console.warn(
      'Gemini image generation is not supported via Vertex AI SDK. Falling back to Imagen model.'
    );
    return generateWithImagen(prompt, IMAGE_GENERATION_MODELS['nano-banana-pro'], aspectRatio);
  }

  return generateWithImagen(prompt, modelId, aspectRatio);
}
