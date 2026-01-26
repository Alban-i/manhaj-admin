import getPost from '@/actions/get-post';
import getPostTranslations from '@/actions/get-post-translations';
import getAuthors from '@/actions/get-authors';
import getCategories from '@/actions/get-categories';
import { getActiveLanguages } from '@/actions/get-languages';
import PostForm from './components/post-form';

const PostContentPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const { slug } = await params;
  const query = await searchParams;

  const [post, categories, authors, languages] = await Promise.all([
    getPost(slug),
    getCategories(),
    getAuthors(),
    getActiveLanguages(),
  ]);

  if (post === 'error') {
    return <div className="px-4">No post found.</div>;
  }

  // Fetch translations if post exists and has a translation_group_id
  const translations = post?.translation_group_id
    ? await getPostTranslations(post.translation_group_id)
    : [];

  // Handle translation creation params
  const translationParams = {
    translateFrom: query.translate_from as string | undefined,
    translationGroupId: query.translation_group_id as string | undefined,
    language: query.language as string | undefined,
    slug: query.slug as string | undefined,
    categoryId: query.category_id as string | undefined,
  };

  // If creating a new translation, pre-fill with translation data
  const postWithTranslation = post ?? (translationParams.translateFrom ? {
    id: null,
    title: '',
    content: '',
    status: 'draft',
    slug: translationParams.slug ?? '',
    type: 'global',
    created_at: null,
    updated_at: null,
    author_id: null,
    category_id: translationParams.categoryId ? Number(translationParams.categoryId) : null,
    image_url: null,
    source: null,
    language: translationParams.language ?? 'ar',
    translation_group_id: translationParams.translationGroupId ?? null,
    is_original: false,
  } : null);

  return (
    <div className="">
      <PostForm
        post={postWithTranslation as any}
        categories={categories}
        authors={authors}
        languages={languages}
        translations={translations}
      />
    </div>
  );
};

export default PostContentPage;
