'use server';

import { createClient } from '@/providers/supabase/server';
import { ImagePresetWithCreator } from '@/types/image-generator';

const getImagePreset = async (id: string): Promise<ImagePresetWithCreator | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('image_presets')
    .select(`
      *,
      creator:profiles!image_presets_created_by_fkey(id, full_name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching image preset:', error);
    return null;
  }

  return data;
};

export default getImagePreset;
