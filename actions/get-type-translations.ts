import { createClient } from '@/providers/supabase/server';
import { TypeTranslation } from '@/types/types';

export async function getTypeTranslations(
  typeId: number
): Promise<TypeTranslation[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('type_translations')
      .select('*')
      .eq('type_id', typeId);

    if (error) {
      console.error('Error fetching type translations:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}
