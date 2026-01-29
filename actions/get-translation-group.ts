import { createClient } from '@/providers/supabase/server';

export interface ArticleMetadataData {
  id: string;
  author_id: string | null;
  category_id: number | null;
  individual_id: string | null;
  image_url: string | null;
  tags: number[];
}

// Legacy alias for compatibility
export type TranslationGroupData = ArticleMetadataData;

export default async function getTranslationGroup(
  articleId: string | null
): Promise<ArticleMetadataData | null> {
  if (!articleId) {
    return null;
  }

  const supabase = await createClient();

  // Get article metadata
  const { data: article, error: articleError } = await supabase
    .from('articles')
    .select('id, author_id, category_id, individual_id, image_url')
    .eq('id', articleId)
    .single();

  if (articleError || !article) {
    console.error('Error fetching article metadata:', articleError);
    return null;
  }

  // Get tags for this article
  const { data: tags, error: tagsError } = await supabase
    .from('article_group_tags')
    .select('tag_id')
    .eq('article_id', articleId);

  if (tagsError) {
    console.error('Error fetching article tags:', tagsError);
    return {
      ...article,
      tags: [],
    };
  }

  return {
    ...article,
    tags: tags.map((t) => t.tag_id),
  };
}
