'use server';

import { createClient } from '@/providers/supabase/server';
import { revalidatePath } from 'next/cache';
import { ImageGenerationModel } from '@/lib/google-genai';

interface ReferenceImageData {
  base64: string;
  mimeType: string;
}

interface ReferenceImagesData {
  elements?: ReferenceImageData[];
  style?: ReferenceImageData[];
  person?: ReferenceImageData[];
}

interface GenerateBackgroundParams {
  projectId: string;
  prompt: string;
  model: ImageGenerationModel;
  width: number;
  height: number;
  referenceImages?: ReferenceImagesData;
}

interface GenerateBackgroundResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

const generateBackground = async (
  params: GenerateBackgroundParams
): Promise<GenerateBackgroundResult> => {
  const { projectId, prompt, model, width, height, referenceImages } = params;

  // Validate inputs
  if (!projectId) {
    return { success: false, error: 'Project ID is required' };
  }

  if (!prompt?.trim()) {
    return { success: false, error: 'Prompt is required' };
  }

  try {
    // Get the base URL from environment or construct it
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Call the API route to generate and upload the image
    const response = await fetch(`${baseUrl}/api/ai/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, model, width, height, referenceImages }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to generate image' };
    }

    const { imageUrl } = await response.json();

    // Update the project with the generated background URL
    const supabase = await createClient();

    const { error: updateError } = await supabase
      .from('image_projects')
      .update({ background_image_url: imageUrl })
      .eq('id', projectId);

    if (updateError) {
      console.error('Error updating project:', updateError);
      return { success: false, error: 'Failed to save generated image' };
    }

    // Revalidate paths
    revalidatePath('/images');
    revalidatePath(`/images/${projectId}`);

    return { success: true, imageUrl };
  } catch (error) {
    console.error('Error generating background:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};

export default generateBackground;
