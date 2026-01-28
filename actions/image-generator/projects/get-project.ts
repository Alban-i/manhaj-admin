'use server';

import { createClient } from '@/providers/supabase/server';
import { ImageProjectWithRelations } from '@/types/image-generator';

const getImageProject = async (id: string): Promise<ImageProjectWithRelations | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('image_projects')
    .select(`
      *,
      preset:image_presets(*),
      creator:profiles!image_projects_created_by_fkey(id, full_name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching image project:', error);
    return null;
  }

  return data;
};

export default getImageProject;
