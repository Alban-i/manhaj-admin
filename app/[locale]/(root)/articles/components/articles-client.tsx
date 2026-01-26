'use client';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Articles, Language } from '@/types/types';
import Link from 'next/link';
import { DataTable } from './data-table';
import { columns } from './columns';

interface ArticlesClientProps {
  articles: Articles[];
  languages: Language[];
}

const ArticlesClient: React.FC<ArticlesClientProps> = ({ articles, languages }) => {
  const refinedArticles = articles.map(({ id, title, status, slug, language }) => ({
    id,
    title: title ?? '',
    status,
    slug,
    language: language ?? 'ar',
  }));

  return (
    <div className="grid gap-3 px-4">
      {/* TOP FIRST LINE */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Articles</h2>
        <div className="ml-auto flex items-center gap-2">
          {/* NEW ARTICLE */}
          <Link href="/articles/new" passHref>
            <Button className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                New
              </span>
            </Button>
          </Link>
        </div>
      </div>

      <DataTable data={refinedArticles} columns={columns} languages={languages} />
    </div>
  );
};

export default ArticlesClient;
