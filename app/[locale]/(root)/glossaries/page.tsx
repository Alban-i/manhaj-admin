import { createClient } from '@/providers/supabase/server';
import GlossariesClient from './components/glossaries-client';

const GlossariesPage = async () => {
  const supabase = await createClient();

  const { data: glossaries, error } = await supabase
    .from('glossary')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching glossaries:', error);
    return <div className="p-4">Error loading glossaries.</div>;
  }

  return (
    <div className="">
      <GlossariesClient glossaries={glossaries} />
    </div>
  );
};

export default GlossariesPage;