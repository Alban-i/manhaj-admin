'use client';

import { ProfilesWithRoles } from '@/types/types';
import { columns } from './columns';
import { DataTable } from './data-table';

interface ProfilesClientProps {
  profiles: ProfilesWithRoles[];
}

const ProfilesClient: React.FC<ProfilesClientProps> = ({ profiles }) => {
  const refinedProfiles = profiles.map(
    ({ id, email, username, role_id, created_at }) => ({
      id,
      email: email ?? '',
      username: username ?? '',
      role: role_id?.label ?? '',
      created_at: created_at
        ? new Date(created_at).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '',
    })
  );

  return (
    <div className="grid gap-3 px-4">
      {/* TOP FIRST LINE */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Profiles</h2>
        <div className="ml-auto flex items-center gap-2"></div>
      </div>

      <DataTable data={refinedProfiles} columns={columns} />
    </div>
  );
};

export default ProfilesClient;
