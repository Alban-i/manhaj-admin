'use server';

import { createClient } from '@/providers/supabase/server';
import { revalidatePath } from 'next/cache';

export interface SaveGeneratedImageParams {
  projectId: string;
  imageUrl: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  prompt: string;
  model: string;
  // Optional metadata overrides
  altText?: string;
  slug?: string;
  description?: string;
}

interface SaveGeneratedImageResult {
  success: boolean;
  mediaId?: string;
  mediaSlug?: string;
  imageUrl?: string;
  error?: string;
}

const saveGeneratedImage = async (
  params: SaveGeneratedImageParams
): Promise<SaveGeneratedImageResult> => {
  const {
    projectId,
    imageUrl,
    filePath,
    fileName,
    fileSize,
    mimeType,
    prompt,
    model,
    altText,
    slug: customSlug,
    description,
  } = params;

  if (!projectId) {
    return { success: false, error: 'Project ID is required' };
  }

  if (!imageUrl) {
    return { success: false, error: 'Image URL is required' };
  }

  try {
    const supabase = await createClient();

    // 1. Create media record
    const slug = customSlug || `ai-gen-${Date.now()}`;
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .insert({
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize,
        mime_type: mimeType,
        media_type: 'image',
        original_name: fileName,
        slug,
        url: imageUrl,
        alt_text: altText || prompt.substring(0, 200),
        description: description || `AI generated with ${model}`,
      })
      .select()
      .single();

    if (mediaError) {
      console.error('Error creating media record:', mediaError);
      return { success: false, error: 'Failed to create media record' };
    }

    // 2. Unselect previous generations for this project
    const { error: unselectError } = await supabase
      .from('image_project_generations')
      .update({ is_selected: false })
      .eq('project_id', projectId)
      .eq('is_selected', true);

    if (unselectError) {
      console.error('Error unselecting previous generations:', unselectError);
      // Continue anyway - not critical
    }

    // 3. Link to project via junction table
    const { error: linkError } = await supabase
      .from('image_project_generations')
      .insert({
        project_id: projectId,
        media_id: media.id,
        prompt,
        model,
        is_selected: true,
      });

    if (linkError) {
      console.error('Error linking generation to project:', linkError);
      return { success: false, error: 'Failed to link generation to project' };
    }

    // 4. Update project's background_image_url for quick access
    const { error: updateError } = await supabase
      .from('image_projects')
      .update({ background_image_url: imageUrl })
      .eq('id', projectId);

    if (updateError) {
      console.error('Error updating project background URL:', updateError);
      // Continue anyway - the generation is still saved
    }

    revalidatePath('/images');
    revalidatePath(`/images/${projectId}`);

    return { success: true, mediaId: media.id, mediaSlug: slug, imageUrl };
  } catch (error) {
    console.error('Error saving generated image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};

export default saveGeneratedImage;
