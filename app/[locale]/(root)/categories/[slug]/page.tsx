import { getCategoryById } from '@/actions/get-categories';
import CategoryForm from './components/category-form';

const CategoryContentPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  // If slug is 'new', return empty category
  if (slug === 'new') {
    return (
      <div className="">
        <CategoryForm category={null} />
      </div>
    );
  }

  // Fetch existing category by slug or ID
  const category = await getCategoryById(slug);

  if (!category) {
    return <div className="px-4">No category found.</div>;
  }

  return (
    <div className="">
      <CategoryForm category={category} />
    </div>
  );
};

export default CategoryContentPage;
