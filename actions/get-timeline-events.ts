import { createClient } from '@/providers/supabase/server';
import { TimelineEvent } from '@/types/timeline';

const getTimelineEvents = async (timelineId: string, language?: string): Promise<TimelineEvent[]> => {
  const supabase = await createClient();

  // Fetch events with their translations and optional article data
  const { data, error } = await supabase
    .from('timeline_events')
    .select(`
      *,
      translations:timeline_event_translations (*),
      article:articles (
        id,
        title,
        slug,
        image_url
      )
    `)
    .eq('timeline_id', timelineId)
    .order('display_order', { ascending: true });

  if (error) {
    console.log(error);
    return [];
  }

  // Transform data: pick the right translation for the current language
  return (data || []).map((item) => {
    const translations = (item.translations || []) as TimelineEvent['translations'];
    const translation = language
      ? translations.find((t) => t.language === language)
      : translations[0];

    return {
      ...item,
      translations,
      translation,
      article: item.article as TimelineEvent['article'],
    };
  });
};

export default getTimelineEvents;
