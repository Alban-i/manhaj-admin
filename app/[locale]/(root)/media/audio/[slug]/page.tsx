import { getMediaById } from '@/actions/media/get-media';
import { MediaForm } from '../../components/media-form';
import { notFound } from 'next/navigation';

interface AudioDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function AudioDetailPage({ params }: AudioDetailPageProps) {
  const { slug } = await params;
  const media = await getMediaById(slug);

  if (!media || media.media_type !== 'audio') {
    notFound();
  }

  return <MediaForm media={media} />;
}