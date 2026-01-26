import { getGlossaryById } from '@/actions/get-glossaries';
import GlossaryForm from './components/glossary-form';

const GlossaryContentPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  // If slug is 'new', return empty glossary
  if (slug === 'new') {
    return (
      <div className="">
        <GlossaryForm glossary={null} />
      </div>
    );
  }

  // Fetch existing glossary by slug or ID
  const glossary = await getGlossaryById(slug);

  if (!glossary) {
    return <div className="px-4">No glossary found.</div>;
  }

  return (
    <div className="">
      <GlossaryForm glossary={glossary} />
    </div>
  );
};

export default GlossaryContentPage;