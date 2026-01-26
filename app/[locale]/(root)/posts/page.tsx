import getPosts from '@/actions/get-posts';
import { getActiveLanguages } from '@/actions/get-languages';
import PostsClient from './components/posts-client';

const PostsPage = async () => {
  const [posts, languages] = await Promise.all([
    getPosts(),
    getActiveLanguages(),
  ]);

  return (
    <div className="">
      <PostsClient posts={posts} languages={languages} />
    </div>
  );
};

export default PostsPage;
