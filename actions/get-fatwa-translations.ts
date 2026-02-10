import { createClient } from '@/providers/supabase/server';

export interface FatwaTranslationEntry {
  id: string;
  title: string;
  slug: string;
  language: string;
  is_original: boolean;
  status: string;
}

export default async function getFatwaTranslations(
  fatwaId: string | null
): Promise<FatwaTranslationEntry[]> {
  if (!fatwaId) {
    return [];
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('fatwa_translations')
      .select('id, title, slug, language, is_original, status')
      .eq('fatwa_id', fatwaId)
      .order('is_original', { ascending: false });

    if (error) {
      console.error('Error fetching fatwa translations:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}
