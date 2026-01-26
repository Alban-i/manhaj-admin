import getTimeline from '@/actions/get-timeline';
import getTimelineEvents from '@/actions/get-timeline-events';
import getArticlesForTimeline from '@/actions/get-articles-for-timeline';
import { getActiveLanguages } from '@/actions/get-languages';
import TimelineForm from './components/timeline-form';

interface TimelinePageProps {
  params: Promise<{ slug: string }>;
}

const TimelinePage = async ({ params }: TimelinePageProps) => {
  const { slug } = await params;
  const isNew = slug === 'new';

  const [timeline, languages, availableArticles] = await Promise.all([
    isNew ? Promise.resolve(null) : getTimeline(slug),
    getActiveLanguages(),
    getArticlesForTimeline(),
  ]);

  // Get timeline events if editing existing timeline
  const timelineEvents = timeline ? await getTimelineEvents(timeline.id) : [];

  return (
    <TimelineForm
      timeline={timeline}
      languages={languages}
      availableArticles={availableArticles}
      timelineEvents={timelineEvents}
    />
  );
};

export default TimelinePage;
