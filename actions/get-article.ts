import { createClient } from '@/providers/supabase/server';
import { Articles } from '@/types/types';

const getArticle = async (
  identifier: string
): Promise<Articles | null | 'error'> => {
  if (identifier === 'new') {
    return null;
  }

  const supabase = await createClient();

  // Check if identifier looks like a UUID (backward compatibility)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

  // Fetch article translation with articles metadata join for shared data
  let query = supabase
    .from('article_translations')
    .select(`
      *,
      articles (
        author_id,
        category_id,
        image_url,
        individual_id
      )
    `);

  if (isUuid) {
    query = query.eq('id', identifier);
  } else {
    query = query.eq('slug', identifier);
  }

  const { data, error } = await query.single();

  if (error) {
    console.log(error);
    return 'error';
  }

  if (!data) return null;

  // Get shared data from articles metadata, fallback to article data for backward compatibility
  const articleMetadata = data.articles as { author_id: string | null; category_id: number | null; image_url: string | null; individual_id: string | null } | null;

  return {
    ...data,
    // Use articles metadata if available, otherwise fallback to article data
    author_id: articleMetadata?.author_id ?? data.author_id,
    category_id: (articleMetadata?.category_id ?? data.category_id)?.toString() || null,
    image_url: articleMetadata?.image_url ?? data.image_url,
    individual_id: articleMetadata?.individual_id ?? null,
    is_published: data.status.toLowerCase() === 'published',
  };
};

export default getArticle;
