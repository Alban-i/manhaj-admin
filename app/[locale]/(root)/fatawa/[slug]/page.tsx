import getFatwa from '@/actions/get-fatwa';
import getFatwaTags from '@/actions/get-fatwa-tags';
import getFatwaTranslations from '@/actions/get-fatwa-translations';
import getFatwaMetadata from '@/actions/get-fatwa-metadata';
import getFatwaClassifications from '@/actions/get-fatwa-classifications';
import getAuthors from '@/actions/get-authors';
import { getActiveLanguages } from '@/actions/get-languages';
import { getTagsWithTranslations } from '@/actions/get-tags';
import { getIndividualGroupsForSelect } from '@/actions/get-individual-groups-for-select';
import FatwaForm from './components/fatwa-form';

const FatwaPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const { locale, slug } = await params;
  const query = await searchParams;

  const [fatwa, classifications, tags, fatwaTags, authors, languages, individualGroups] = await Promise.all([
    getFatwa(slug),
    getFatwaClassifications(),
    getTagsWithTranslations(locale),
    getFatwaTags(slug),
    getAuthors(),
    getActiveLanguages(),
    getIndividualGroupsForSelect(locale),
  ]);

  if (fatwa === 'error') {
    return <div className="px-4">Aucune fatwa n'a été trouvée.</div>;
  }

  // Handle translation creation params
  const translationParams = {
    translateFrom: query.translate_from as string | undefined,
    fatwaId: query.fatwa_id as string | undefined,
    language: query.language as string | undefined,
    slug: query.slug as string | undefined,
  };

  // Fetch fatwa metadata if creating a new translation
  const fatwaMetadata = translationParams.fatwaId
    ? await getFatwaMetadata(translationParams.fatwaId)
    : null;

  // Fetch translations if fatwa exists and has a fatwa_id
  const translations = fatwa?.fatwa_id
    ? await getFatwaTranslations(fatwa.fatwa_id)
    : translationParams.fatwaId
      ? await getFatwaTranslations(translationParams.fatwaId)
      : [];

  // If creating a new translation, pre-fill with metadata
  const fatwaWithTranslation = fatwa ?? (translationParams.translateFrom ? {
    title: '',
    summary: '',
    question: '',
    question_json: null,
    answer: '',
    answer_json: null,
    slug: translationParams.slug ?? '',
    status: 'draft',
    classification_id: fatwaMetadata?.classification_id ?? null,
    author_id: fatwaMetadata?.author_id ?? null,
    individual_id: fatwaMetadata?.individual_id ?? null,
    source: fatwaMetadata?.source ?? null,
    source_url: fatwaMetadata?.source_url ?? null,
    media_id: fatwaMetadata?.media_id ?? null,
    id: undefined,
    published_at: null,
    language: translationParams.language ?? 'ar',
    fatwa_id: translationParams.fatwaId ?? null,
    is_original: false,
  } : null);

  // Use metadata tags for new translations
  const selectedTags = fatwa ? fatwaTags : (fatwaMetadata?.tags ?? []);

  return (
    <div className="">
      <FatwaForm
        fatwa={fatwaWithTranslation as any}
        classifications={classifications}
        tags={tags}
        selectedTagIds={selectedTags}
        authors={authors}
        languages={languages}
        translations={translations}
        individualGroups={individualGroups}
      />
    </div>
  );
};

export default FatwaPage;
