import { getClassificationBySlug } from '@/actions/get-classifications';
import { getActiveLanguages } from '@/actions/get-languages';
import ClassificationForm from './components/classification-form';

const ClassificationContentPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  // Fetch active languages for the form
  const languages = await getActiveLanguages();

  // Fetch existing classification by slug
  const classification = await getClassificationBySlug(slug);

  if (!classification) {
    return <div className="px-4">No classification found.</div>;
  }

  return (
    <div className="">
      <ClassificationForm
        classification={classification}
        languages={languages}
      />
    </div>
  );
};

export default ClassificationContentPage;
