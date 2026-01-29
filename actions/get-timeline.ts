import { createClient } from '@/providers/supabase/server';
import { Timeline } from '@/types/types';

const getTimeline = async (slug: string): Promise<Timeline | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('timeline_translations')
    .select(`*`)
    .eq('slug', slug)
    .single();

  if (error) {
    console.log(error);
    return null;
  }
  return data;
};

export default getTimeline;
