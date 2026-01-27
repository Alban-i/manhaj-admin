import { createClient } from '@/providers/supabase/server';

export interface IndividualOption {
  id: number;
  name: string;
  slug: string;
  language: string;
}

export default async function getIndividualsForSelect(): Promise<IndividualOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('individuals')
    .select('id, name, slug, language, type:types!inner(classification)')
    .eq('status', 'published')
    .eq('type.classification', 'individual')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching individuals for select:', error);
    return [];
  }

  return data ?? [];
}
