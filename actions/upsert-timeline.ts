'use server';

import { createClient } from '@/providers/supabase/server';
import { revalidatePath } from 'next/cache';

export interface UpsertTimelineInput {
  id?: string;
  slug: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  status?: string;
  language?: string | null;
  category_id?: number | null;
  is_original?: boolean;
  translation_group_id?: string | null;
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
    status: input.status ?? 'draft',
    language: input.language || 'ar',
    category_id: input.category_id || null,
    is_original: input.is_original ?? true,
    translation_group_id: input.translation_group_id || null,
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
  parent_id?: string | null;
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
    parent_id: input.parent_id || null,
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

  // First, get the timeline_article id for this article
  const { data: eventData, error: fetchError } = await supabase
    .from('timeline_articles')
    .select('id')
    .eq('timeline_id', timelineId)
    .eq('article_id', articleId)
    .single();

  if (fetchError) {
    console.error('Error fetching timeline article:', fetchError);
    return {
      success: false,
      error: fetchError.message,
    };
  }

  // Promote any children to top level by setting their parent_id to null
  // This happens automatically via ON DELETE SET NULL, but we do it explicitly
  // to ensure predictable behavior
  const { error: promoteError } = await supabase
    .from('timeline_articles')
    .update({ parent_id: null })
    .eq('parent_id', eventData.id);

  if (promoteError) {
    console.error('Error promoting children:', promoteError);
    // Continue with deletion even if promotion fails (ON DELETE SET NULL will handle it)
  }

  // Now delete the event
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

// Set or change the parent of an event (for indent/outdent operations)
export async function setEventParent(
  eventId: string,
  parentId: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // If setting a parent, verify it's not already a child (max 2 levels)
  if (parentId) {
    const { data: parentData, error: parentCheckError } = await supabase
      .from('timeline_articles')
      .select('parent_id')
      .eq('id', parentId)
      .single();

    if (parentCheckError) {
      console.error('Error checking parent:', parentCheckError);
      return {
        success: false,
        error: 'Could not verify parent event.',
      };
    }

    if (parentData.parent_id !== null) {
      return {
        success: false,
        error: 'Cannot nest more than 2 levels deep.',
      };
    }

    // Also verify this event doesn't have children (a parent can't become a child)
    const { data: childrenData, error: childrenError } = await supabase
      .from('timeline_articles')
      .select('id')
      .eq('parent_id', eventId)
      .limit(1);

    if (childrenError) {
      console.error('Error checking children:', childrenError);
      return {
        success: false,
        error: 'Could not verify event children.',
      };
    }

    if (childrenData && childrenData.length > 0) {
      return {
        success: false,
        error: 'Cannot make an event with children into a child.',
      };
    }
  }

  const { error } = await supabase
    .from('timeline_articles')
    .update({ parent_id: parentId })
    .eq('id', eventId);

  if (error) {
    console.error('Error setting event parent:', error);
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
