import { createClient } from '@/providers/supabase/server';
import { FatwaInList } from '@/types/types';

const getFatawa = async (): Promise<FatwaInList[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('fatwa_translations')
    .select(`*`)
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching fatawa:', error);
  }
  return data || [];
};

export default getFatawa;
