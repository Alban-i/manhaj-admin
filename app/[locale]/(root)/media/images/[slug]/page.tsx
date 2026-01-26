import { getMediaById } from '@/actions/media/get-media';
import { MediaForm } from '../../components/media-form';
import { notFound } from 'next/navigation';

interface ImageDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ImageDetailPage({ params }: ImageDetailPageProps) {
  const { slug } = await params;
  const media = await getMediaById(slug);

  if (!media || media.media_type !== 'image') {
    notFound();
  }

  return <MediaForm media={media} />;
}