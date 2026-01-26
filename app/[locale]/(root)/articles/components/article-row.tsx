'use client';

import { useRouter } from 'next/navigation';
import { TableCell, TableRow } from '@/components/ui/table';
import { Articles } from '@/types/types';

interface ArticleRowPops {
  article: Articles;
}

const ArticleRow: React.FC<ArticleRowPops> = ({ article }) => {
  const router = useRouter();

  return (
    <TableRow
      key={article.id}
      className="cursor-pointer"
      onClick={() => {
        router.push(`/articles/${article.slug}`);
      }}
    >
      <TableCell className="font-medium">{article.title}</TableCell>
      <TableCell className="text-right">{article.status}</TableCell>
    </TableRow>
  );
};

export default ArticleRow;
