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
      created_by: user.id,
      // Generation parameters
      aspect_ratio: formData.aspect_ratio || null,
      person_generation: formData.person_generation || 'dont_allow',
      enhance_prompt: formData.enhance_prompt ?? true,
      seed: formData.seed || null,
      image_size: formData.image_size || '1K',
      ai_model: formData.ai_model ?? 'nano-banana',
      reference_images: formData.reference_images ?? [],
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
