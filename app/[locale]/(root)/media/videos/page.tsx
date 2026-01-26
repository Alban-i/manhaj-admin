import { getMediaByType } from '@/actions/media/get-media';
import MediaClient from '../components/media-client';

export const dynamic = 'force-dynamic';

export default async function VideosPage() {
  const videoFiles = await getMediaByType('video');

  return (
    <MediaClient
      initialMedia={videoFiles}
      mediaType="video"
      title="Videos"
      revalidatePath="/media/videos"
    />
  );
}