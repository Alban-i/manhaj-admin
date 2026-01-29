import { createClient } from '@/providers/supabase/server';

export interface IndividualTranslation {
  id: number;
  name: string;
  slug: string;
  language: string;
  is_original: boolean;
  status: string;
}

export default async function getIndividualTranslations(
  individualId: string | null
): Promise<IndividualTranslation[]> {
  if (!individualId) {
    return [];
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('individual_translations')
      .select('id, name, slug, language, is_original, status')
      .eq('individual_id', individualId)
      .order('is_original', { ascending: false });

    if (error) {
      console.error('Error fetching individual translations:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}
