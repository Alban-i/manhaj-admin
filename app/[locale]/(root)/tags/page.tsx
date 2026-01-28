import { createClient } from '@/providers/supabase/server';
import { getActiveLanguages } from '@/actions/get-languages';
import TagsClient from './components/tags-client';
import { TagWithTranslations } from '@/types/types';

const TagsPage = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;
  const supabase = await createClient();

  // Fetch tags with translations
  const { data: tags, error } = await supabase
    .from('tags')
    .select(
      `
      *,
      translations:tag_translations(*)
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tags:', error);
    return <div className="p-4">Error loading tags.</div>;
  }

  // Fetch active languages
  const languages = await getActiveLanguages();

  return (
    <div className="">
      <TagsClient
        tags={tags as TagWithTranslations[]}
        languages={languages}
        currentLocale={locale}
      />
    </div>
  );
};

export default TagsPage;
