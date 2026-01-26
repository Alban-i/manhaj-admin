import { getMediaById } from '@/actions/media/get-media';
import { MediaForm } from '../../components/media-form';
import { notFound } from 'next/navigation';

interface DocumentDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { slug } = await params;
  const media = await getMediaById(slug);

  if (!media || media.media_type !== 'document') {
    notFound();
  }

  return <MediaForm media={media} />;
}