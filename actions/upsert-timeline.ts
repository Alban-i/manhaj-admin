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
  is_original?: boolean;
  timeline_id?: string | null;
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
    is_original: input.is_original ?? true,
    timeline_id: input.timeline_id || null,
    ...(input.id && { id: input.id }),
  };

  const { data, error } = await supabase
    .from('timeline_translations')
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

export async function deleteTimeline(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from('timeline_translations').delete().eq('id', id);

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

export interface UpsertTimelineEventInput {
  id?: string;
  timeline_id: string;
  display_order?: number;
  event_date_hijri?: string | null;
  event_date_hijri_year?: number | null;
  event_date_gregorian?: string | null;
  event_date_precision?: string;
  article_id?: string | null;
  image_url?: string | null;
  // Translations
  translations: {
    language: string;
    title: string;
    description?: string | null;
    source?: string | null;
    source_url?: string | null;
    is_original?: boolean;
  }[];
}

export async function upsertTimelineEvent(
  input: UpsertTimelineEventInput
): Promise<{ success: boolean; event_id?: string; error?: string }> {
  const supabase = await createClient();

  // Upsert the event
  const eventData = {
    timeline_id: input.timeline_id,
    display_order: input.display_order ?? 0,
    event_date_hijri: input.event_date_hijri || null,
    event_date_hijri_year: input.event_date_hijri_year || null,
    event_date_gregorian: input.event_date_gregorian || null,
    event_date_precision: input.event_date_precision || 'day',
    article_id: input.article_id || null,
    image_url: input.image_url || null,
    ...(input.id && { id: input.id }),
  };

  const { data: event, error: eventError } = await supabase
    .from('timeline_events')
    .upsert(eventData)
    .select('id')
    .single();

  if (eventError) {
    console.error('Error upserting timeline event:', eventError);
    return { success: false, error: eventError.message };
  }

  // Upsert translations
  for (const t of input.translations) {
    const { error: tError } = await supabase
      .from('timeline_event_translations')
      .upsert(
        {
          event_id: event.id,
          language: t.language,
          title: t.title,
          description: t.description || null,
          source: t.source || null,
          source_url: t.source_url || null,
          is_original: t.is_original ?? true,
        },
        { onConflict: 'event_id,language' }
      );

    if (tError) {
      console.error('Error upserting event translation:', tError);
      return { success: false, error: tError.message };
    }
  }

  revalidatePath('/timelines');

  return { success: true, event_id: event.id };
}

export async function deleteTimelineEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('timeline_events')
    .delete()
    .eq('id', eventId);

  if (error) {
    console.error('Error deleting timeline event:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/timelines');

  return { success: true };
}

export async function updateTimelineEventOrder(
  items: { id: string; display_order: number }[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  for (const item of items) {
    const { error } = await supabase
      .from('timeline_events')
      .update({ display_order: item.display_order })
      .eq('id', item.id);

    if (error) {
      console.error('Error updating event order:', error);
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}
