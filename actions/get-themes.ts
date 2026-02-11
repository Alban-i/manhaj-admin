import { createClient } from '@/providers/supabase/server';
import { Theme } from '@/types/types';

const getThemes = async (): Promise<Theme[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('theme_translations')
    .select(`*`)
    .order('title', { ascending: true });

  if (error) {
    console.log(error);
  }
  return data || [];
};

export default getThemes;
