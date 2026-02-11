import { createClient } from '@/providers/supabase/server';
import { ThemeEvent } from '@/types/theme';

// Re-export types and helpers for convenience
export type { ThemeEvent, ThemeEventNested } from '@/types/theme';
export { nestEvents } from '@/types/theme';

const getThemeEvents = async (themeId: string): Promise<ThemeEvent[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('theme_articles')
    .select(`
      *,
      article:article_translations (
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
    .eq('theme_id', themeId)
    .order('display_order', { ascending: true });

  if (error) {
    console.log(error);
    return [];
  }

  // Transform the data to match the expected type
  return (data || []).map((item) => ({
    ...item,
    article: item.article as ThemeEvent['article'],
  }));
};

export default getThemeEvents;
