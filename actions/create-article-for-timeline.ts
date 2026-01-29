'use server';

import { createClient } from '@/providers/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CreateArticleForTimelineInput {
  timeline_id: string;
  timeline_slug: string;
  title: string;
  slug: string;
  summary: string;
  author_id: string;
  category_id?: number | null;
  event_date_hijri?: string | null;
  event_date_hijri_year?: number | null;
  event_date_gregorian?: string | null;
  language: string;
}

export interface CreateArticleForTimelineResult {
  success: boolean;
  article?: {
    id: string;
    slug: string;
  };
  error?: string;
}

export async function createArticleForTimeline(
  input: CreateArticleForTimelineInput
): Promise<CreateArticleForTimelineResult> {
  const supabase = await createClient();

  try {
    // 1. Create article metadata first
    const { data: articleMetadata, error: metadataError } = await supabase
      .from('articles')
      .insert({
        author_id: input.author_id,
        category_id: input.category_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (metadataError) {
      console.error('Error creating article metadata:', metadataError);
      return {
        success: false,
        error: 'Failed to create article metadata: ' + metadataError.message,
      };
    }

    // 2. Create the article translation
    const { data: article, error: articleError } = await supabase
      .from('article_translations')
      .insert({
        title: input.title,
        slug: input.slug,
        summary: input.summary,
        content: '', // Empty content - user will edit later
        status: 'draft',
        author_id: input.author_id,
        category_id: input.category_id || null,
        language: input.language,
        article_id: articleMetadata.id,
        is_original: true,
        is_featured: false,
        event_date_hijri: input.event_date_hijri || null,
        event_date_hijri_year: input.event_date_hijri_year || null,
        event_date_gregorian: input.event_date_gregorian || null,
      })
      .select('id, slug')
      .single();

    if (articleError) {
      console.error('Error creating article translation:', articleError);
      // Try to clean up the article metadata we created
      await supabase
        .from('articles')
        .delete()
        .eq('id', articleMetadata.id);
      return {
        success: false,
        error: 'Failed to create article: ' + articleError.message,
      };
    }

    // 3. Get max display_order for this timeline
    const { data: maxOrderData } = await supabase
      .from('timeline_articles')
      .select('display_order')
      .eq('timeline_id', input.timeline_id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const nextDisplayOrder = (maxOrderData?.display_order ?? 0) + 1;

    // 4. Add article to timeline_articles
    const { error: timelineArticleError } = await supabase
      .from('timeline_articles')
      .insert({
        timeline_id: input.timeline_id,
        article_id: article.id,
        display_order: nextDisplayOrder,
      });

    if (timelineArticleError) {
      console.error('Error adding article to timeline:', timelineArticleError);
      // Clean up: delete the article translation and metadata
      await supabase.from('article_translations').delete().eq('id', article.id);
      await supabase
        .from('articles')
        .delete()
        .eq('id', articleMetadata.id);
      return {
        success: false,
        error: 'Failed to add article to timeline: ' + timelineArticleError.message,
      };
    }

    // 5. Revalidate paths
    revalidatePath('/timelines');
    revalidatePath(`/timelines/${input.timeline_slug}`);
    revalidatePath(`/timelines/view/${input.timeline_slug}`);
    revalidatePath('/articles');

    return {
      success: true,
      article: {
        id: article.id,
        slug: article.slug,
      },
    };
  } catch (error) {
    console.error('Unexpected error creating article for timeline:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
