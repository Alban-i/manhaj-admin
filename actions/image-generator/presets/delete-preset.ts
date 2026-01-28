'use server';

import { createClient } from '@/providers/supabase/server';
import { revalidatePath } from 'next/cache';

interface DeletePresetResult {
  success: boolean;
  error?: string;
}

const deleteImagePreset = async (id: string): Promise<DeletePresetResult> => {
  const supabase = await createClient();

  const { error } = await supabase
    .from('image_presets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting image preset:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/images/presets');
  return { success: true };
};

export default deleteImagePreset;
