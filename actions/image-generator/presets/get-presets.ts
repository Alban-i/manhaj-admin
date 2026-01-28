'use server';

import { createClient } from '@/providers/supabase/server';
import { ImagePresetWithCreator } from '@/types/image-generator';

const getImagePresets = async (): Promise<ImagePresetWithCreator[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('image_presets')
    .select(`
      *,
      creator:profiles!image_presets_created_by_fkey(id, full_name)
    `)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching image presets:', error);
    return [];
  }

  return data || [];
};

export default getImagePresets;
