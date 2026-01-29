import { createClient } from '@/providers/supabase/server';

export default async function getArticleTags(identifier: string) {
  if (identifier === 'new') return [];

  const supabase = await createClient();

  // First get the article translation to find its article_id
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

  let query = supabase
    .from('article_translations')
    .select('id, article_id');

  if (isUuid) {
    query = query.eq('id', identifier);
  } else {
    query = query.eq('slug', identifier);
  }

  const { data: article, error: articleError } = await query.single();

  if (articleError || !article) {
    console.error('Error fetching article for tags:', articleError);
    return [];
  }

  // If article has article_id, get tags from article_group_tags
  if (article.article_id) {
    const { data, error } = await supabase
      .from('article_group_tags')
      .select('tag_id')
      .eq('article_id', article.article_id);

    if (error) {
      console.error('Error fetching article group tags:', error);
      return [];
    }

    return data.map((row) => row.tag_id);
  }

  // Fallback to article_tags for backward compatibility
  const { data, error } = await supabase
    .from('article_tags')
    .select('tag_id')
    .eq('article_id', article.id);

  if (error) {
    console.error('Error fetching article tags:', error);
    return [];
  }

  return data.map((row) => row.tag_id);
}
