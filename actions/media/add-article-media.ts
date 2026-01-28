'use server';

import { createClient } from '@/providers/supabase/server';

export type AddArticleMediaResult = {
  success: boolean;
  error?: string;
};

export const addArticleMedia = async (
  articleId: string,
  mediaId: string
): Promise<AddArticleMediaResult> => {
  try {
    const supabase = await createClient();

    // Insert article-media relationship
    const { error } = await supabase
      .from('article_media')
      .insert({
        article_id: articleId,
        media_id: mediaId,
      });

    if (error) {
      // PostgreSQL error code 23505 = unique_violation (duplicate key)
      if (error.code === '23505') {
        // Relationship already exists - treat as success
        return { success: true };
      }
      console.error('Error adding article-media relationship:', error);
      return { success: false, error: error.message || 'Failed to add media relationship' };
    }

    return { success: true };
  } catch (error) {
    console.error('Article-media add error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};