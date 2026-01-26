import { getMediaByType } from '@/actions/media/get-media';
import MediaClient from '../components/media-client';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage() {
  const documentFiles = await getMediaByType('document');

  return (
    <MediaClient
      initialMedia={documentFiles}
      mediaType="document"
      title="Documents"
      revalidatePath="/media/documents"
    />
  );
}