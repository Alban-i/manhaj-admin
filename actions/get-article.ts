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

  // Fetch article with translation_groups join for shared data
  let query = supabase
    .from('articles')
    .select(`
      *,
      translation_groups (
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

  // Get shared data from translation_groups, fallback to article data for backward compatibility
  const translationGroup = data.translation_groups as { author_id: string | null; category_id: number | null; image_url: string | null; individual_id: number | null } | null;

  return {
    ...data,
    // Use translation_groups data if available, otherwise fallback to article data
    author_id: translationGroup?.author_id ?? data.author_id,
    category_id: (translationGroup?.category_id ?? data.category_id)?.toString() || null,
    image_url: translationGroup?.image_url ?? data.image_url,
    individual_id: translationGroup?.individual_id ?? data.individual_id,
    is_published: data.status.toLowerCase() === 'published',
  };
};

export default getArticle;
