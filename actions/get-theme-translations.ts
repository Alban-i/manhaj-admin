import { createClient } from '@/providers/supabase/server';

export interface ThemeTranslationItem {
  id: string;
  title: string;
  slug: string;
  language: string;
  is_original: boolean;
  status: string;
}

export default async function getThemeTranslations(
  themeId: string | null
): Promise<ThemeTranslationItem[]> {
  if (!themeId) {
    return [];
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('theme_translations')
      .select('id, title, slug, language, is_original, status')
      .eq('theme_id', themeId)
      .order('is_original', { ascending: false });

    if (error) {
      console.error('Error fetching theme translations:', error);
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
