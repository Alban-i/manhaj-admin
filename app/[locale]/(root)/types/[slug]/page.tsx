import { getTypeById } from '@/actions/get-types';
import TypeForm from './components/type-form';

const TypeContentPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  // If slug is 'new', return empty type
  if (slug === 'new') {
    return (
      <div className="">
        <TypeForm type={null} />
      </div>
    );
  }

  // Fetch existing type by slug or ID
  const type = await getTypeById(slug);

  if (!type) {
    return <div className="px-4">No type found.</div>;
  }

  return (
    <div className="">
      <TypeForm type={type} />
    </div>
  );
};

export default TypeContentPage;
