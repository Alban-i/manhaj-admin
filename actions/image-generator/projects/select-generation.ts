'use server';

import { createClient } from '@/providers/supabase/server';
import { revalidatePath } from 'next/cache';

interface SelectGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

const selectGeneration = async (
  projectId: string,
  generationId: string
): Promise<SelectGenerationResult> => {
  const supabase = await createClient();

  // Get the generation's media URL
  const { data: generation, error: fetchError } = await supabase
    .from('image_project_generations')
    .select(`
      media:media_id (
        url
      )
    `)
    .eq('id', generationId)
    .single();

  if (fetchError || !generation?.media) {
    console.error('Error fetching generation:', fetchError);
    return { success: false, error: fetchError?.message || 'Generation not found' };
  }

  const media = generation.media as unknown as { url: string };
  const mediaUrl = media.url;

  // Unselect all generations for this project
  const { error: unselectError } = await supabase
    .from('image_project_generations')
    .update({ is_selected: false })
    .eq('project_id', projectId);

  if (unselectError) {
    console.error('Error unselecting generations:', unselectError);
    return { success: false, error: unselectError.message };
  }

  // Select the chosen generation
  const { error: selectError } = await supabase
    .from('image_project_generations')
    .update({ is_selected: true })
    .eq('id', generationId);

  if (selectError) {
    console.error('Error selecting generation:', selectError);
    return { success: false, error: selectError.message };
  }

  // Update project's background URL
  const { error: updateError } = await supabase
    .from('image_projects')
    .update({ background_image_url: mediaUrl })
    .eq('id', projectId);

  if (updateError) {
    console.error('Error updating project background:', updateError);
    return { success: false, error: updateError.message };
  }

  revalidatePath(`/images/${projectId}`);
  return { success: true, imageUrl: mediaUrl };
};

export default selectGeneration;
