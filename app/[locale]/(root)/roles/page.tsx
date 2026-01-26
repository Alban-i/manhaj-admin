import { createClient } from '@/providers/supabase/server';
import RolesClient from './components/roles-client';

const RolesPage = async () => {
  const supabase = await createClient();

  const { data: roles, error } = await supabase
    .from('roles')
    .select('*')
    .order('order', { ascending: true });

  if (error) {
    console.error('Error fetching roles:', error);
    return <div className="p-4">Error loading roles.</div>;
  }

  return (
    <div className="">
      <RolesClient roles={roles} />
    </div>
  );
};

export default RolesPage;
