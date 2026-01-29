import { createClient } from '@/providers/supabase/server';
import { Articles } from '@/types/types';

const getArticles = async (): Promise<Articles[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('article_translations')
    .select(`*`)
    .order('title', { ascending: true });

  if (error) {
    console.log(error);
  }
  return data || [];
};

export default getArticles;
