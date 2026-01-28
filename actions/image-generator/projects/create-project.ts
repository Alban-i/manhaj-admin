'use server';

import { createClient } from '@/providers/supabase/server';
import { ImageProjectFormData } from '@/types/image-generator';
import { revalidatePath } from 'next/cache';

interface CreateProjectResult {
  success: boolean;
  data?: { id: string };
  error?: string;
}

const createImageProject = async (formData: ImageProjectFormData): Promise<CreateProjectResult> => {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('image_projects')
    .insert({
      name: formData.name,
      preset_id: formData.preset_id || null,
      width: formData.width,
      height: formData.height,
      generation_prompt: formData.generation_prompt || null,
      style_reference_url: formData.style_reference_url || null,
      text_content: formData.text_content,
      text_config: formData.text_config,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating image project:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/images');
  return { success: true, data: { id: data.id } };
};

export default createImageProject;
