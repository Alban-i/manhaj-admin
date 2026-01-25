import getIndividual from '@/actions/get-individual';
import getIndividualTranslationGroup from '@/actions/get-individual-translation-group';
import getIndividualTranslations from '@/actions/get-individual-translations';
import { getActiveLanguages } from '@/actions/get-languages';
import getTypes from '@/actions/get-types';
import IndividualForm from './components/individual-form';

const IndividualPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const { slug } = await params;
  const query = await searchParams;

  // Fetch types, individual data, and languages in parallel
  const [types, individual, languages] = await Promise.all([
    getTypes(),
    getIndividual(slug),
    getActiveLanguages(),
  ]);

  // Handle translation creation params
  const translationParams = {
    translateFrom: query.translate_from as string | undefined,
    translationGroupId: query.translation_group_id as string | undefined,
    language: query.language as string | undefined,
    slug: query.slug as string | undefined,
  };

  // Fetch translation group data if creating a new translation
  const translationGroup = translationParams.translationGroupId
    ? await getIndividualTranslationGroup(translationParams.translationGroupId)
    : null;

  // Fetch translations if individual exists and has a translation_group_id
  const translations = individual && individual !== 'error' && individual.translation_group_id
    ? await getIndividualTranslations(individual.translation_group_id)
    : translationParams.translationGroupId
      ? await getIndividualTranslations(translationParams.translationGroupId)
      : [];

  // If slug is 'new', return empty individual or pre-filled translation
  if (slug === 'new') {
    const individualWithTranslation = translationParams.translateFrom ? {
      name: '',
      slug: translationParams.slug ?? '',
      description: null,
      description_json: null,
      status: 'draft' as const,
      type_id: translationGroup?.type_id ?? null,
      original_name: translationGroup?.original_name ?? '',
      ranking: translationGroup?.ranking ?? 'not recommended',
      language: translationParams.language ?? 'ar',
      translation_group_id: translationParams.translationGroupId ?? null,
      is_original: false,
      created_at: null,
      updated_at: null,
    } : null;

    return (
      <div className="">
        <IndividualForm
          individual={individualWithTranslation}
          types={types || []}
          languages={languages}
          translations={translations}
        />
      </div>
    );
  }

  if (individual === 'error' || !individual) {
    return <div className="px-4">No individual found.</div>;
  }

  return (
    <div className="">
      <IndividualForm
        individual={individual}
        types={types || []}
        languages={languages}
        translations={translations}
      />
    </div>
  );
};

export default IndividualPage;
