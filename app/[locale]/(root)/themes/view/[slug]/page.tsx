import getTheme from '@/actions/get-theme';
import getThemeEvents from '@/actions/get-theme-events';
import getCategories from '@/actions/get-categories';
import getProfiles from '@/actions/get-profiles';
import ThemeViewer from './components/theme-viewer';
import { notFound } from 'next/navigation';

interface ThemeViewPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ event?: string }>;
}

const ThemeViewPage = async ({ params, searchParams }: ThemeViewPageProps) => {
  const { slug } = await params;
  const { event } = await searchParams;

  const [theme, categories, profiles] = await Promise.all([
    getTheme(slug),
    getCategories(),
    getProfiles(),
  ]);

  if (!theme) {
    notFound();
  }

  const themeEvents = await getThemeEvents(theme.id);

  return (
    <ThemeViewer
      theme={theme}
      events={themeEvents}
      selectedEventSlug={event}
      categories={categories}
      authors={profiles}
    />
  );
};

export default ThemeViewPage;
