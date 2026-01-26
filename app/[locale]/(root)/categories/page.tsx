import { createClient } from '@/providers/supabase/server';
import CategoriesClient from './components/categories-client';

const CategoriesPage = async () => {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching categories:', error);
    return <div className="p-4">Error loading categories.</div>;
  }

  return (
    <div className="">
      <CategoriesClient categories={categories} />
    </div>
  );
};

export default CategoriesPage;
