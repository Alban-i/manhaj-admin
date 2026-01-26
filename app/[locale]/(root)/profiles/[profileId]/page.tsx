import getProfile from '@/actions/get-profile';
import ProfileForm from './components/profile-form';
import getRoles from '@/actions/get-roles';
const ProfileContentPage = async ({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) => {
  const { profileId } = await params;

  const profile = await getProfile(profileId);
  const roles = await getRoles();

  if (profile === 'error') {
    return <div className="px-4">Aucun profil n'a été trouvée.</div>;
  }

  if (!profile) {
    return <div className="px-4">Profile not found.</div>;
  }

  return (
    <div className="">
      <ProfileForm profile={profile} roles={roles} />
    </div>
  );
};

export default ProfileContentPage;
