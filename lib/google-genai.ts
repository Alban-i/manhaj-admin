import { GoogleGenAI } from '@google/genai';

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
  regular: 'gemini-2.0-flash-exp',
  pro: 'imagen-3.0-generate-002',
} as const;

export type ImageGenerationModel = keyof typeof IMAGE_GENERATION_MODELS;

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

/**
 * Generate an image using Google's Gemini API
 * @param prompt - The text prompt describing the image to generate
 * @param model - The model to use ('regular' or 'pro')
 * @param width - Desired image width (used for aspect ratio calculation)
 * @param height - Desired image height (used for aspect ratio calculation)
 */
export async function generateImage(
  prompt: string,
  model: ImageGenerationModel = 'regular',
  width: number = 1200,
  height: number = 630
): Promise<GenerateImageResponse> {
  try {
    const client = getClient();
    const modelId = IMAGE_GENERATION_MODELS[model];

    // Calculate aspect ratio
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    const aspectRatio = `${width / divisor}:${height / divisor}`;

    const response = await client.models.generateContent({
      model: modelId,
      contents: prompt,
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
  } catch (error) {
    console.error('Error generating image:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: message };
  }
}
