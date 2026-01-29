import getTimeline from '@/actions/get-timeline';
import getTimelineEvents from '@/actions/get-timeline-events';
import getArticlesForTimeline from '@/actions/get-articles-for-timeline';
import { getActiveLanguages } from '@/actions/get-languages';
import getCategories from '@/actions/get-categories';
import getProfiles from '@/actions/get-profiles';
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

  const [timeline, languages, availableArticles, categories, profiles] = await Promise.all([
    isNew ? Promise.resolve(null) : getTimeline(slug),
    getActiveLanguages(),
    getArticlesForTimeline(),
    getCategories(),
    getProfiles(),
  ]);

  // Get timeline events if editing existing timeline
  const timelineEvents = timeline ? await getTimelineEvents(timeline.id) : [];

  // Handle translation creation params
  const translationParams = {
    translateFrom: query.translate_from as string | undefined,
    timelineId: query.timeline_id as string | undefined,
    language: query.language as string | undefined,
    slug: query.slug as string | undefined,
    categoryId: query.category_id as string | undefined,
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
    category_id: translationParams.categoryId ? Number(translationParams.categoryId) : null,
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
      availableArticles={availableArticles}
      timelineEvents={timelineEvents}
      categories={categories}
      authors={profiles}
      translations={translations}
    />
  );
};

export default TimelinePage;
