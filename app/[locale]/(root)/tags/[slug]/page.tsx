import { getTagById } from '@/actions/get-tags';
import TagForm from './components/tag-form';

const TagContentPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  // If slug is 'new', return empty tag
  if (slug === 'new') {
    return (
      <div className="">
        <TagForm tag={null} />
      </div>
    );
  }

  // Fetch existing tag by slug or ID
  const tag = await getTagById(slug);

  if (!tag) {
    return <div className="px-4">No tag found.</div>;
  }

  return (
    <div className="">
      <TagForm tag={tag} />
    </div>
  );
};

export default TagContentPage;
