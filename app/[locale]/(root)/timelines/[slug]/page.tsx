import getTimeline from '@/actions/get-timeline';
import getTimelineEvents from '@/actions/get-timeline-events';
import { getActiveLanguages } from '@/actions/get-languages';
import getTimelineTranslations from '@/actions/get-timeline-translations';
import TimelineForm from './components/timeline-form';

interface TimelinePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const TimelinePage = async ({ params, searchParams }: TimelinePageProps) => {
  const { slug } = await params;
  const query = await searchParams;
  const isNew = slug === 'new';

  const [timeline, languages] = await Promise.all([
    isNew ? Promise.resolve(null) : getTimeline(slug),
    getActiveLanguages(),
  ]);

  // Get timeline events if editing existing timeline
  const timelineEvents = timeline ? await getTimelineEvents(timeline.id, timeline.language ?? 'ar') : [];

  // Handle translation creation params
  const translationParams = {
    translateFrom: query.translate_from as string | undefined,
    timelineId: query.timeline_id as string | undefined,
    language: query.language as string | undefined,
    slug: query.slug as string | undefined,
  };

  // Fetch translations if timeline exists and has a timeline_id
  const translations = timeline?.timeline_id
    ? await getTimelineTranslations(timeline.timeline_id)
    : translationParams.timelineId
      ? await getTimelineTranslations(translationParams.timelineId)
      : [];

  // If creating a new translation, pre-fill with basic data
  const timelineWithTranslation = timeline ?? (translationParams.translateFrom ? {
    title: '',
    description: '',
    slug: translationParams.slug ?? '',
    status: 'draft',
    id: undefined,
    image_url: null,
    language: translationParams.language ?? 'ar',
    timeline_id: translationParams.timelineId ?? null,
    is_original: false,
    created_at: null,
    updated_at: null,
  } : null);

  return (
    <TimelineForm
      timeline={timelineWithTranslation}
      languages={languages}
      timelineEvents={timelineEvents}
      translations={translations}
    />
  );
};

export default TimelinePage;
