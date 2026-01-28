'use server';

import { createClient } from '@/providers/supabase/server';
import { ImageProjectWithRelations } from '@/types/image-generator';

const getImageProjects = async (): Promise<ImageProjectWithRelations[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('image_projects')
    .select(`
      *,
      preset:image_presets(*),
      creator:profiles!image_projects_created_by_fkey(id, full_name)
    `)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching image projects:', error);
    return [];
  }

  return data || [];
};

export default getImageProjects;
