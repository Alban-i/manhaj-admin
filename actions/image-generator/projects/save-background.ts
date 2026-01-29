'use server';

import { createClient } from '@/providers/supabase/server';
import { revalidatePath } from 'next/cache';

interface SaveBackgroundParams {
  projectId: string;
  imageUrl: string;
}

interface SaveBackgroundResult {
  success: boolean;
  error?: string;
}

const saveBackground = async (
  params: SaveBackgroundParams
): Promise<SaveBackgroundResult> => {
  const { projectId, imageUrl } = params;

  if (!projectId) {
    return { success: false, error: 'Project ID is required' };
  }

  if (!imageUrl) {
    return { success: false, error: 'Image URL is required' };
  }

  try {
    const supabase = await createClient();

    const { error: updateError } = await supabase
      .from('image_projects')
      .update({ background_image_url: imageUrl })
      .eq('id', projectId);

    if (updateError) {
      console.error('Error updating project:', updateError);
      return { success: false, error: 'Failed to save generated image' };
    }

    revalidatePath('/images');
    revalidatePath(`/images/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error('Error saving background:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};

export default saveBackground;
