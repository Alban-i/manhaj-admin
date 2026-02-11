import getTheme from '@/actions/get-theme';
import getThemeEvents from '@/actions/get-theme-events';
import getArticlesForTheme from '@/actions/get-articles-for-theme';
import { getActiveLanguages } from '@/actions/get-languages';
import getCategories from '@/actions/get-categories';
import getProfiles from '@/actions/get-profiles';
import getThemeTranslations from '@/actions/get-theme-translations';
import ThemeForm from './components/theme-form';

interface ThemePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const ThemePage = async ({ params, searchParams }: ThemePageProps) => {
  const { slug } = await params;
  const query = await searchParams;
  const isNew = slug === 'new';

  const [theme, languages, availableArticles, categories, profiles] = await Promise.all([
    isNew ? Promise.resolve(null) : getTheme(slug),
    getActiveLanguages(),
    getArticlesForTheme(),
    getCategories(),
    getProfiles(),
  ]);

  // Get theme events if editing existing theme
  const themeEvents = theme ? await getThemeEvents(theme.id) : [];

  // Handle translation creation params
  const translationParams = {
    translateFrom: query.translate_from as string | undefined,
    themeId: query.theme_id as string | undefined,
    language: query.language as string | undefined,
    slug: query.slug as string | undefined,
    categoryId: query.category_id as string | undefined,
  };

  // Fetch translations if theme exists and has a theme_id
  const translations = theme?.theme_id
    ? await getThemeTranslations(theme.theme_id)
    : translationParams.themeId
      ? await getThemeTranslations(translationParams.themeId)
      : [];

  // If creating a new translation, pre-fill with basic data
  const themeWithTranslation = theme ?? (translationParams.translateFrom ? {
    title: '',
    description: '',
    slug: translationParams.slug ?? '',
    status: 'draft',
    category_id: translationParams.categoryId ? Number(translationParams.categoryId) : null,
    id: undefined,
    image_url: null,
    language: translationParams.language ?? 'ar',
    theme_id: translationParams.themeId ?? null,
    is_original: false,
    created_at: null,
    updated_at: null,
  } : null);

  return (
    <ThemeForm
      theme={themeWithTranslation}
      languages={languages}
      availableArticles={availableArticles}
      themeEvents={themeEvents}
      categories={categories}
      authors={profiles}
      translations={translations}
    />
  );
};

export default ThemePage;
