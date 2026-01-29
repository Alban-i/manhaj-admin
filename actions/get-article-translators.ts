import { createClient } from '@/providers/supabase/server';

export default async function getArticleTranslators(identifier: string): Promise<number[]> {
  if (identifier === 'new') return [];

  const supabase = await createClient();

  // First get the article to find its ID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

  let query = supabase
    .from('article_translations')
    .select('id');

  if (isUuid) {
    query = query.eq('id', identifier);
  } else {
    query = query.eq('slug', identifier);
  }

  const { data: article, error: articleError } = await query.single();

  if (articleError || !article) {
    console.error('Error fetching article for translators:', articleError);
    return [];
  }

  // Get translator IDs from article_translators
  const { data, error } = await supabase
    .from('article_translators')
    .select('individual_id')
    .eq('article_id', article.id)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching article translators:', error);
    return [];
  }

  return data.map((row) => row.individual_id);
}
