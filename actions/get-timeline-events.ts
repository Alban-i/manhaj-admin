import { createClient } from '@/providers/supabase/server';
import { Json } from '@/types/types_db';

export interface TimelineEvent {
  id: string;
  timeline_id: string;
  article_id: string;
  display_order: number | null;
  custom_event_date_hijri: string | null;
  custom_event_date_gregorian: string | null;
  custom_title: string | null;
  created_at: string | null;
  article: {
    id: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    content_json: Json | null;
    image_url: string | null;
    event_date_hijri: string | null;
    event_date_hijri_year: number | null;
    event_date_gregorian: string | null;
    event_date_precision: string | null;
    language: string;
  };
}

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
