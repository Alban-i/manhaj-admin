import { getActiveLanguages } from '@/actions/get-languages';
import getFatwaClassifications from '@/actions/get-fatwa-classifications';
import FatwaClassificationForm from './components/fatwa-classification-form';

const FatwaClassificationPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const [classifications, languages] = await Promise.all([
    getFatwaClassifications(),
    getActiveLanguages(),
  ]);

  const classification = classifications.find((c) => c.id.toString() === id);

  if (!classification) {
    return <div className="px-4">No classification found.</div>;
  }

  return (
    <div className="">
      <FatwaClassificationForm
        classification={classification}
        classifications={classifications}
        languages={languages}
      />
    </div>
  );
};

export default FatwaClassificationPage;
