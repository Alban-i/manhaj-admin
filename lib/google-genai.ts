import { GoogleGenAI } from '@google/genai';
import type { ReferenceImages } from '@/types/image-generator';

// Initialize the Google GenAI client
const getClient = () => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not configured');
  }
  return new GoogleGenAI({ apiKey });
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
export const modelSupportsReferenceImages = (model: ImageGenerationModel): boolean => {
  return model === 'gemini-flash' || model === 'gemini-pro';
};

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
}

interface GenerateImageOptions {
  prompt: string;
  model?: ImageGenerationModel;
  width?: number;
  height?: number;
  referenceImages?: {
    elements?: ReferenceImageData[];
    style?: ReferenceImageData[];
    person?: ReferenceImageData[];
  };
}

/**
 * Build the enhanced prompt with reference image context
 */
function buildPromptWithContext(
  basePrompt: string,
  referenceImages?: GenerateImageOptions['referenceImages']
): string {
  if (!referenceImages) return basePrompt;

  const contextParts: string[] = [basePrompt];
  const hasElements = referenceImages.elements && referenceImages.elements.length > 0;
  const hasStyle = referenceImages.style && referenceImages.style.length > 0;
  const hasPerson = referenceImages.person && referenceImages.person.length > 0;

  if (hasElements || hasStyle || hasPerson) {
    contextParts.push('\n\nReference images context:');

    if (hasElements) {
      contextParts.push(
        `- Images 1-${referenceImages.elements!.length}: Use elements from these images`
      );
    }
    if (hasStyle) {
      contextParts.push(
        `- Style images: Apply the visual style from these images`
      );
    }
    if (hasPerson) {
      contextParts.push(
        `- Person images: Include the likeness of these people`
      );
    }
  }

  return contextParts.join('\n');
}

/**
 * Generate an image using Google's Gemini API (for Gemini models with reference images)
 */
async function generateWithGemini(
  client: GoogleGenAI,
  modelId: string,
  prompt: string,
  referenceImages?: GenerateImageOptions['referenceImages']
): Promise<GenerateImageResponse> {
  // Build contents array with text and reference images
  const contents: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  // Add reference images in order: elements → style → person
  if (referenceImages?.elements) {
    for (const img of referenceImages.elements) {
      contents.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64,
        },
      });
    }
  }

  if (referenceImages?.style) {
    for (const img of referenceImages.style) {
      contents.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64,
        },
      });
    }
  }

  if (referenceImages?.person) {
    for (const img of referenceImages.person) {
      contents.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64,
        },
      });
    }
  }

  // Build enhanced prompt with context
  const enhancedPrompt = buildPromptWithContext(prompt, referenceImages);
  contents.push({ text: enhancedPrompt });

  const response = await client.models.generateContent({
    model: modelId,
    contents: contents,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  // Extract image data from response
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    return { success: false, error: 'No response generated' };
  }

  const parts = candidates[0].content?.parts;
  if (!parts) {
    return { success: false, error: 'No content in response' };
  }

  // Find the image part
  for (const part of parts) {
    if (part.inlineData) {
      return {
        success: true,
        base64: part.inlineData.data ?? '',
        mimeType: part.inlineData.mimeType ?? 'image/png',
      };
    }
  }

  return { success: false, error: 'No image data in response' };
}

/**
 * Generate an image using Google's Imagen API (text-only)
 */
async function generateWithImagen(
  client: GoogleGenAI,
  modelId: string,
  prompt: string
): Promise<GenerateImageResponse> {
  const response = await client.models.generateImages({
    model: modelId,
    prompt: prompt,
    config: {
      numberOfImages: 1,
    },
  });

  // Extract image data from response
  const images = response.generatedImages;
  if (!images || images.length === 0) {
    return { success: false, error: 'No images generated' };
  }

  const image = images[0].image;
  if (!image || !image.imageBytes) {
    return { success: false, error: 'No image data in response' };
  }

  return {
    success: true,
    base64: image.imageBytes,
    mimeType: 'image/png',
  };
}

/**
 * Generate an image using Google's Gemini/Imagen API
 * @param options - Generation options including prompt, model, dimensions, and reference images
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse>;

/**
 * Generate an image using Google's Gemini/Imagen API
 * @param prompt - The text prompt describing the image to generate
 * @param model - The model to use
 * @param width - Desired image width (used for aspect ratio calculation)
 * @param height - Desired image height (used for aspect ratio calculation)
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
  const options: GenerateImageOptions =
    typeof promptOrOptions === 'string'
      ? { prompt: promptOrOptions, model, width, height }
      : promptOrOptions;

  const {
    prompt,
    model: selectedModel = 'nano-banana',
    referenceImages,
  } = options;

  try {
    const client = getClient();
    const modelId = IMAGE_GENERATION_MODELS[selectedModel];
    const isGeminiModel = modelSupportsReferenceImages(selectedModel);

    if (isGeminiModel) {
      return await generateWithGemini(client, modelId, prompt, referenceImages);
    } else {
      return await generateWithImagen(client, modelId, prompt);
    }
  } catch (error) {
    console.error('Error generating image:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: message };
  }
}
