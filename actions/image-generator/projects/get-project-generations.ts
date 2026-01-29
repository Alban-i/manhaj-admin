'use server';

import { createClient } from '@/providers/supabase/server';

export interface ProjectGeneration {
  id: string;
  prompt: string | null;
  model: string | null;
  is_selected: boolean | null;
  created_at: string | null;
  media: {
    id: string;
    url: string;
    file_name: string;
  } | null;
}

interface RawGeneration {
  id: string;
  prompt: string | null;
  model: string | null;
  is_selected: boolean | null;
  created_at: string | null;
  media: {
    id: string;
    url: string;
    file_name: string;
  } | null;
}

const getProjectGenerations = async (projectId: string): Promise<{
  data: ProjectGeneration[] | null;
  error: string | null;
}> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('image_project_generations')
    .select(`
      id,
      prompt,
      model,
      is_selected,
      created_at,
      media:media_id (
        id,
        url,
        file_name
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching project generations:', error);
    return { data: null, error: error.message };
  }

  // Transform data to match expected interface
  const generations: ProjectGeneration[] = (data as unknown as RawGeneration[]).map((gen) => ({
    id: gen.id,
    prompt: gen.prompt,
    model: gen.model,
    is_selected: gen.is_selected,
    created_at: gen.created_at,
    media: gen.media,
  }));

  return { data: generations, error: null };
};

export default getProjectGenerations;
