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
      // Generation parameters
      aspect_ratio: formData.aspect_ratio || null,
      person_generation: formData.person_generation || 'dont_allow',
      enhance_prompt: formData.enhance_prompt ?? true,
      seed: formData.seed || null,
      image_size: formData.image_size || '1K',
      ai_model: formData.ai_model,
      reference_images: formData.reference_images,
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
