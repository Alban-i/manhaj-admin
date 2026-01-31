'use server';

import { createClient } from '@/providers/supabase/server';
import { ImagePresetFormData } from '@/types/image-generator';
import { revalidatePath } from 'next/cache';

interface CreatePresetResult {
  success: boolean;
  data?: { id: string };
  error?: string;
}

const createImagePreset = async (formData: ImagePresetFormData): Promise<CreatePresetResult> => {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('image_presets')
    .insert({
      name: formData.name,
      prompt_template: formData.prompt_template,
      style_reference_url: formData.style_reference_url || null,
      width: formData.width,
      height: formData.height,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating image preset:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/images/presets');
  return { success: true, data: { id: data.id } };
};

export default createImagePreset;
