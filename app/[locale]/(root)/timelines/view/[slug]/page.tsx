import getTimeline from '@/actions/get-timeline';
import getTimelineEvents from '@/actions/get-timeline-events';
import TimelineViewer from './components/timeline-viewer';
import { notFound } from 'next/navigation';

interface TimelineViewPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ event?: string }>;
}

const TimelineViewPage = async ({ params, searchParams }: TimelineViewPageProps) => {
  const { slug } = await params;
  const { event } = await searchParams;

  const timeline = await getTimeline(slug);

  if (!timeline) {
    notFound();
  }

  const timelineEvents = await getTimelineEvents(
    timeline.timeline_id ?? timeline.id,
    timeline.language ?? 'ar'
  );

  return (
    <TimelineViewer
      timeline={timeline}
      events={timelineEvents}
      selectedEventId={event}
    />
  );
};

export default TimelineViewPage;
