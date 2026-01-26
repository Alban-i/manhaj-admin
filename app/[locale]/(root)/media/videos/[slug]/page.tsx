import { getMediaById } from '@/actions/media/get-media';
import { MediaForm } from '../../components/media-form';
import { notFound } from 'next/navigation';

interface VideoDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { slug } = await params;
  const media = await getMediaById(slug);

  if (!media || media.media_type !== 'video') {
    notFound();
  }

  return <MediaForm media={media} />;
}