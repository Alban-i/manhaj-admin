import { createClient } from '@/providers/supabase/server';
import { FatwaClassificationWithTranslations } from '@/types/types';

export default async function getFatwaClassifications(): Promise<
  FatwaClassificationWithTranslations[]
> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('fatwa_classifications')
      .select(`
        *,
        fatwa_classification_translations(*)
      `)
      .order('display_order');

    if (error) {
      console.error('Error fetching fatwa classifications:', error);
      return [];
    }

    return data as FatwaClassificationWithTranslations[];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}
