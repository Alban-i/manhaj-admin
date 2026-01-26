import { createClient } from '@/providers/supabase/server';
import IndividualsClient from './components/individuals-client';

const IndividualsPage = async () => {
  const supabase = await createClient();

  const { data: individuals, error } = await supabase
    .from('individuals')
    .select(
      `
      *,
      types!left (
        name
      )
    `
    )
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching individuals:', error);
    return <div className="p-4">Error loading individuals.</div>;
  }

  return (
    <div className="">
      <IndividualsClient individuals={individuals} />
    </div>
  );
};

export default IndividualsPage;
