import { createClient } from '@/providers/supabase/server';
import { Theme } from '@/types/types';

const getTheme = async (slug: string): Promise<Theme | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('theme_translations')
    .select(`*`)
    .eq('slug', slug)
    .single();

  if (error) {
    console.log(error);
    return null;
  }
  return data;
};

export default getTheme;
