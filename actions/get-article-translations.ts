import { createClient } from '@/providers/supabase/server';

export interface ArticleTranslation {
  id: string;
  title: string;
  slug: string;
  language: string;
  is_original: boolean;
  status: string;
}

export default async function getArticleTranslations(
  articleId: string | null
): Promise<ArticleTranslation[]> {
  if (!articleId) {
    return [];
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('article_translations')
      .select('id, title, slug, language, is_original, status')
      .eq('article_id', articleId)
      .order('is_original', { ascending: false });

    if (error) {
      console.error('Error fetching article translations:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}
