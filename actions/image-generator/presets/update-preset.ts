'use server';

import { createClient } from '@/providers/supabase/server';
import { ImagePresetFormData } from '@/types/image-generator';
import { revalidatePath } from 'next/cache';

interface UpdatePresetResult {
  success: boolean;
  error?: string;
}

const updateImagePreset = async (id: string, formData: ImagePresetFormData): Promise<UpdatePresetResult> => {
  const supabase = await createClient();

  const { error } = await supabase
    .from('image_presets')
    .update({
      name: formData.name,
      prompt_template: formData.prompt_template,
      style_reference_url: formData.style_reference_url || null,
      width: formData.width,
      height: formData.height,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating image preset:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/images/presets');
  revalidatePath(`/images/presets/${id}`);
  return { success: true };
};

export default updateImagePreset;
