import { getTypeByIdWithTranslations } from '@/actions/get-types';
import getClassifications from '@/actions/get-classifications';
import { getActiveLanguages } from '@/actions/get-languages';
import TypeForm from './components/type-form';

const TypeContentPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  // Fetch active languages and classifications for the form
  const [languages, classifications] = await Promise.all([
    getActiveLanguages(),
    getClassifications(),
  ]);

  // If slug is 'new', return empty type
  if (slug === 'new') {
    return (
      <div className="">
        <TypeForm
          type={null}
          languages={languages}
          classifications={classifications}
        />
      </div>
    );
  }

  // Fetch existing type with translations by slug or ID
  const type = await getTypeByIdWithTranslations(slug);

  if (!type) {
    return <div className="px-4">No type found.</div>;
  }

  return (
    <div className="">
      <TypeForm
        type={type}
        languages={languages}
        classifications={classifications}
      />
    </div>
  );
};

export default TypeContentPage;
