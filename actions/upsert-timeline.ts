'use server';

import { createClient } from '@/providers/supabase/server';
import { revalidatePath } from 'next/cache';

export interface UpsertTimelineInput {
  id?: string;
  slug: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  is_published?: boolean;
  language?: string | null;
}

export interface UpsertTimelineResult {
  success: boolean;
  data?: {
    id: string;
    slug: string;
  };
  error?: string;
}

export async function upsertTimeline(
  input: UpsertTimelineInput
): Promise<UpsertTimelineResult> {
  const supabase = await createClient();

  const timelineData = {
    slug: input.slug,
    title: input.title,
    description: input.description || null,
    image_url: input.image_url || null,
    is_published: input.is_published ?? false,
    language: input.language || 'ar',
    ...(input.id && { id: input.id }),
  };

  const { data, error } = await supabase
    .from('timelines')
    .upsert(timelineData)
    .select('id, slug')
    .single();

  if (error) {
    console.error('Error upserting timeline:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath('/timelines');
  revalidatePath(`/timelines/${data.slug}`);

  return {
    success: true,
    data: {
      id: data.id,
      slug: data.slug,
    },
  };
}

export interface AddArticleToTimelineInput {
  timeline_id: string;
  article_id: string;
  display_order?: number;
  custom_event_date_hijri?: string | null;
  custom_event_date_gregorian?: string | null;
  custom_title?: string | null;
}

export async function addArticleToTimeline(
  input: AddArticleToTimelineInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from('timeline_articles').upsert({
    timeline_id: input.timeline_id,
    article_id: input.article_id,
    display_order: input.display_order ?? 0,
    custom_event_date_hijri: input.custom_event_date_hijri || null,
    custom_event_date_gregorian: input.custom_event_date_gregorian || null,
    custom_title: input.custom_title || null,
  });

  if (error) {
    console.error('Error adding article to timeline:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}

export async function removeArticleFromTimeline(
  timelineId: string,
  articleId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('timeline_articles')
    .delete()
    .eq('timeline_id', timelineId)
    .eq('article_id', articleId);

  if (error) {
    console.error('Error removing article from timeline:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}

export async function updateTimelineArticleOrder(
  items: { id: string; display_order: number }[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Update each item's display order
  for (const item of items) {
    const { error } = await supabase
      .from('timeline_articles')
      .update({ display_order: item.display_order })
      .eq('id', item.id);

    if (error) {
      console.error('Error updating timeline article order:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  return { success: true };
}

export async function deleteTimeline(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from('timelines').delete().eq('id', id);

  if (error) {
    console.error('Error deleting timeline:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath('/timelines');

  return { success: true };
}
