import { getTagById } from '@/actions/get-tags';
import { getTagTranslations } from '@/actions/get-tag-translations';
import { getActiveLanguages } from '@/actions/get-languages';
import TagForm from './components/tag-form';

const TagContentPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  // Fetch active languages for the form
  const languages = await getActiveLanguages();

  // If slug is 'new', return empty tag
  if (slug === 'new') {
    return (
      <div className="">
        <TagForm tag={null} languages={languages} />
      </div>
    );
  }

  // Fetch existing tag by slug or ID
  const tag = await getTagById(slug);

  if (!tag) {
    return <div className="px-4">No tag found.</div>;
  }

  // Fetch translations for existing tag
  const translations = await getTagTranslations(tag.id);

  return (
    <div className="">
      <TagForm tag={tag} translations={translations} languages={languages} />
    </div>
  );
};

export default TagContentPage;
