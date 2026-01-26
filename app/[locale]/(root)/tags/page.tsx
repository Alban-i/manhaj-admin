import { createClient } from '@/providers/supabase/server';
import TagsClient from './components/tags-client';

const TagsPage = async () => {
  const supabase = await createClient();

  const { data: tags, error } = await supabase
    .from('tags')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tags:', error);
    return <div className="p-4">Error loading tags.</div>;
  }

  return (
    <div className="">
      <TagsClient tags={tags} />
    </div>
  );
};

export default TagsPage;
