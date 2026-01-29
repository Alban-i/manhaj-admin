'use server';

import { createClient } from '@/providers/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateImage, getAspectRatio, ImageGenerationModel } from '@/lib/google-genai';

interface ReferenceImageData {
  base64: string;
  mimeType: string;
  description: string;
}

interface GenerateBackgroundParams {
  projectId: string;
  prompt: string;
  model: ImageGenerationModel;
  width: number;
  height: number;
  referenceImages?: ReferenceImageData[];
}

interface GenerateBackgroundResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

async function uploadToCloudinary(base64: string, mimeType: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = 'markazshaafii';

  if (!cloudName) {
    throw new Error('Cloudinary cloud name not configured');
  }

  const dataUri = `data:${mimeType};base64,${base64}`;
  const formData = new FormData();
  formData.append('file', dataUri);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'image-generator');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to upload to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url;
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
    // Generate image directly using Google Vertex AI
    const result = await generateImage({
      prompt,
      model,
      aspectRatio: getAspectRatio(width, height),
      referenceImages,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(result.base64, result.mimeType);

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
