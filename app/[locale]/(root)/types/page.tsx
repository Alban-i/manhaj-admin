import { createClient } from '@/providers/supabase/server';
import TypesClient from './components/types-client';

const TypesPage = async () => {
  const supabase = await createClient();

  const { data: types, error } = await supabase
    .from('types')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching types:', error);
    return <div className="p-4">Error loading types.</div>;
  }

  return (
    <div className="">
      <TypesClient types={types} />
    </div>
  );
};

export default TypesPage;
