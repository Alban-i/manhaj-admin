import { createClient } from '@/providers/supabase/server';

export default async function getFatwaTags(identifier: string): Promise<number[]> {
  if (identifier === 'new') return [];

  const supabase = await createClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

  let query = supabase
    .from('fatwa_translations')
    .select('id');

  if (isUuid) {
    query = query.eq('id', identifier);
  } else {
    query = query.eq('slug', identifier);
  }

  const { data: fatwa, error: fatwaError } = await query.single();

  if (fatwaError || !fatwa) {
    console.error('Error fetching fatwa for tags:', fatwaError);
    return [];
  }

  const { data, error } = await supabase
    .from('fatwa_tags')
    .select('tag_id')
    .eq('fatwa_id', fatwa.id);

  if (error) {
    console.error('Error fetching fatwa tags:', error);
    return [];
  }

  return data.map((row) => row.tag_id);
}
