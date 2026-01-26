import getTimeline from '@/actions/get-timeline';
import getTimelineEvents from '@/actions/get-timeline-events';
import getCategories from '@/actions/get-categories';
import getProfiles from '@/actions/get-profiles';
import TimelineViewer from './components/timeline-viewer';
import { notFound } from 'next/navigation';

interface TimelineViewPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ event?: string }>;
}

const TimelineViewPage = async ({ params, searchParams }: TimelineViewPageProps) => {
  const { slug } = await params;
  const { event } = await searchParams;

  const [timeline, categories, profiles] = await Promise.all([
    getTimeline(slug),
    getCategories(),
    getProfiles(),
  ]);

  if (!timeline) {
    notFound();
  }

  const timelineEvents = await getTimelineEvents(timeline.id);

  return (
    <TimelineViewer
      timeline={timeline}
      events={timelineEvents}
      selectedEventSlug={event}
      categories={categories}
      authors={profiles}
    />
  );
};

export default TimelineViewPage;
