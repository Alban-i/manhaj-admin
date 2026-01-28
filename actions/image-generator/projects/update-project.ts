'use server';

import { createClient } from '@/providers/supabase/server';
import { ImageProjectFormData } from '@/types/image-generator';
import { revalidatePath } from 'next/cache';

interface UpdateProjectResult {
  success: boolean;
  error?: string;
}

const updateImageProject = async (id: string, formData: ImageProjectFormData): Promise<UpdateProjectResult> => {
  const supabase = await createClient();

  const { error } = await supabase
    .from('image_projects')
    .update({
      name: formData.name,
      preset_id: formData.preset_id || null,
      width: formData.width,
      height: formData.height,
      generation_prompt: formData.generation_prompt || null,
      style_reference_url: formData.style_reference_url || null,
      text_content: formData.text_content,
      text_config: formData.text_config,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating image project:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/images');
  revalidatePath(`/images/${id}`);
  return { success: true };
};

export default updateImageProject;
