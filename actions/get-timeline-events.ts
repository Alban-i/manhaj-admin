import { createClient } from '@/providers/supabase/server';
import { TimelineEvent } from '@/types/timeline';

// Re-export types and helpers for convenience
export type { TimelineEvent, TimelineEventNested } from '@/types/timeline';
export { nestEvents } from '@/types/timeline';

const getTimelineEvents = async (timelineId: string): Promise<TimelineEvent[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('timeline_articles')
    .select(`
      *,
      article:articles (
        id,
        title,
        slug,
        summary,
        content,
        content_json,
        image_url,
        event_date_hijri,
        event_date_hijri_year,
        event_date_gregorian,
        event_date_precision,
        language
      )
    `)
    .eq('timeline_id', timelineId)
    .order('display_order', { ascending: true });

  if (error) {
    console.log(error);
    return [];
  }

  // Transform the data to match the expected type
  return (data || []).map((item) => ({
    ...item,
    article: item.article as TimelineEvent['article'],
  }));
};

export default getTimelineEvents;
