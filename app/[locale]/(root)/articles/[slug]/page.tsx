import getArticle from '@/actions/get-article';
import getArticleTags from '@/actions/get-article-tags';
import getArticleTranslations from '@/actions/get-article-translations';
import getAuthors from '@/actions/get-authors';
import getCategories from '@/actions/get-categories';
import { getActiveLanguages } from '@/actions/get-languages';
import getTags from '@/actions/get-tags';
import getTranslationGroup from '@/actions/get-translation-group';
import getIndividualsForSelect from '@/actions/get-individuals-for-select';
import ArticleForm from './components/article-form';

const ArticlePage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const { slug } = await params;
  const query = await searchParams;

  const [article, categories, tags, articleTags, authors, languages, individuals] = await Promise.all([
    getArticle(slug),
    getCategories(),
    getTags(),
    getArticleTags(slug),
    getAuthors(),
    getActiveLanguages(),
    getIndividualsForSelect(),
  ]);

  if (article === 'error') {
    return <div className="px-4">Aucun article n'a été trouvée.</div>;
  }

  // Handle translation creation params
  const translationParams = {
    translateFrom: query.translate_from as string | undefined,
    translationGroupId: query.translation_group_id as string | undefined,
    language: query.language as string | undefined,
    slug: query.slug as string | undefined,
  };

  // Fetch translation group data if creating a new translation
  const translationGroup = translationParams.translationGroupId
    ? await getTranslationGroup(translationParams.translationGroupId)
    : null;

  // Fetch translations if article exists and has a translation_group_id
  const translations = article?.translation_group_id
    ? await getArticleTranslations(article.translation_group_id)
    : translationParams.translationGroupId
      ? await getArticleTranslations(translationParams.translationGroupId)
      : [];

  // If creating a new translation, pre-fill with translation group data
  const articleWithTranslation = article ?? (translationParams.translateFrom ? {
    title: '',
    summary: '',
    content: '',
    slug: translationParams.slug ?? '',
    status: 'draft',
    category_id: translationGroup?.category_id?.toString() ?? null,
    author_id: translationGroup?.author_id ?? null,
    individual_id: translationGroup?.individual_id ?? null,
    id: undefined,
    published_at: null,
    is_featured: false,
    image_url: translationGroup?.image_url ?? '',
    language: translationParams.language ?? 'ar',
    translation_group_id: translationParams.translationGroupId ?? null,
    is_original: false,
  } : null);

  // Use translation group tags for new translations
  const selectedTags = article ? articleTags : (translationGroup?.tags ?? []);

  return (
    <div className="">
      <ArticleForm
        article={articleWithTranslation as any}
        categories={categories}
        tags={tags}
        selectedTagIds={selectedTags}
        authors={authors}
        languages={languages}
        translations={translations}
        individuals={individuals}
      />
    </div>
  );
};

export default ArticlePage;
