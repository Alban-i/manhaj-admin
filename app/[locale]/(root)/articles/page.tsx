import getArticles from '@/actions/get-articles';
import { getActiveLanguages } from '@/actions/get-languages';
import ArticlesClient from './components/articles-client';

const ArticlesPage = async () => {
  const [articles, languages] = await Promise.all([
    getArticles(),
    getActiveLanguages(),
  ]);

  return (
    <div className="">
      <ArticlesClient articles={articles} languages={languages} />
    </div>
  );
};

export default ArticlesPage;
