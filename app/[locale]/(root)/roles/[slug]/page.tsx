import { getRoleById } from '@/actions/get-roles';
import RoleForm from './components/role-form';

const RoleContentPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  // If slug is 'new', return empty role
  if (slug === 'new') {
    return (
      <div className="">
        <RoleForm role={null} />
      </div>
    );
  }

  // Fetch existing role by slug or ID
  const role = await getRoleById(slug);

  if (!role) {
    return <div className="px-4">No role found.</div>;
  }

  return (
    <div className="">
      <RoleForm role={role} />
    </div>
  );
};

export default RoleContentPage;
