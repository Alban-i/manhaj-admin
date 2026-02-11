import { createClient } from '@/providers/supabase/server';

export interface ArticleForTheme {
  id: string;
  title: string;
  slug: string;
  event_date_hijri: string | null;
  event_date_hijri_year: number | null;
  event_date_gregorian: string | null;
  event_date_precision: string | null;
  language: string;
  status: string;
  category_id: number | null;
}

const getArticlesForTheme = async (): Promise<ArticleForTheme[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('article_translations')
    .select(`
      id,
      title,
      slug,
      event_date_hijri,
      event_date_hijri_year,
      event_date_gregorian,
      event_date_precision,
      language,
      status,
      category_id
    `)
    .order('title', { ascending: true });

  if (error) {
    console.log(error);
    return [];
  }
  return data || [];
};

export default getArticlesForTheme;
