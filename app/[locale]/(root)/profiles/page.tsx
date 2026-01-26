import getProfiles from '@/actions/get-profiles';
import ProfilesClient from './components/profiles-client';

const ProfilesPage = async () => {
  const profiles = await getProfiles();

  return (
    <div className="">
      <ProfilesClient profiles={profiles} />
    </div>
  );
};

export default ProfilesPage;
