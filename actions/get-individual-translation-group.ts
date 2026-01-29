import { createClient } from '@/providers/supabase/server';

export interface IndividualMetadataData {
  id: string;
  type_id: number | null;
  original_name: string | null;
  ranking: string | null;
}

// Legacy alias for compatibility
export type IndividualTranslationGroupData = IndividualMetadataData;

export default async function getIndividualTranslationGroup(
  individualId: string | null
): Promise<IndividualMetadataData | null> {
  if (!individualId) {
    return null;
  }

  const supabase = await createClient();

  // Get individual metadata
  const { data: individual, error: individualError } = await supabase
    .from('individuals')
    .select('id, type_id, original_name, ranking')
    .eq('id', individualId)
    .single();

  if (individualError || !individual) {
    console.error('Error fetching individual metadata:', individualError);
    return null;
  }

  return individual;
}
