import { createClient } from '@/providers/supabase/server';
import { Timeline } from '@/types/types';

const getTimelines = async (): Promise<Timeline[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('timeline_translations')
    .select(`*`)
    .order('title', { ascending: true });

  if (error) {
    console.log(error);
  }
  return data || [];
};

export default getTimelines;
