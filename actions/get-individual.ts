import { createClient } from '@/providers/supabase/server';
import { Tables } from '@/types/types_db';

export type IndividualWithType = Tables<'individual_translations'> & {
  types?: {
    id: number;
    name: string;
  } | null;
};

const getIndividual = async (
  identifier: string
): Promise<IndividualWithType | null | 'error'> => {
  if (identifier === 'new') {
    return null;
  }

  const supabase = await createClient();

  // Try to fetch by slug first, fallback to ID for backward compatibility
  let query = supabase
    .from('individual_translations')
    .select(`
      *,
      types:type_id (
        id,
        name
      )
    `);
  
  // Check if identifier is numeric (individuals use numeric IDs)
  const isNumeric = /^\d+$/.test(identifier);
  
  if (isNumeric) {
    query = query.eq('id', parseInt(identifier));
  } else {
    query = query.eq('slug', identifier);
  }

  const { data, error } = await query.single();

  if (error) {
    console.error('Error fetching individual:', error);
    return 'error';
  }

  if (!data) return null;

  return data;
};

export default getIndividual;