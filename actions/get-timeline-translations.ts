import { createClient } from '@/providers/supabase/server';

export interface TimelineTranslation {
  id: string;
  title: string;
  slug: string;
  language: string;
  is_original: boolean;
  status: string;
}

export default async function getTimelineTranslations(
  translationGroupId: string | null
): Promise<TimelineTranslation[]> {
  if (!translationGroupId) {
    return [];
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('timelines')
      .select('id, title, slug, language, is_original, status')
      .eq('translation_group_id', translationGroupId)
      .order('is_original', { ascending: false });

    if (error) {
      console.error('Error fetching timeline translations:', error);
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      language: item.language || 'ar',
      is_original: item.is_original ?? true,
      status: item.status || 'draft',
    }));
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}
