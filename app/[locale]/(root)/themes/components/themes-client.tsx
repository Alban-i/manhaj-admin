'use client';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Theme, Language } from '@/types/types';
import Link from 'next/link';
import { DataTable } from './data-table';
import { columns } from './columns';

interface ThemesClientProps {
  themes: Theme[];
  languages: Language[];
}

const ThemesClient: React.FC<ThemesClientProps> = ({ themes, languages }) => {
  const refinedThemes = themes.map(({ id, title, slug, status, language }) => ({
    id,
    title: title ?? '',
    slug,
    status: status ?? 'draft',
    language: language ?? 'ar',
  }));

  return (
    <div className="grid gap-3 px-4">
      {/* TOP FIRST LINE */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Themes</h2>
        <div className="ml-auto flex items-center gap-2">
          {/* NEW THEME */}
          <Link href="/themes/new" passHref>
            <Button className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                New
              </span>
            </Button>
          </Link>
        </div>
      </div>

      <DataTable data={refinedThemes} columns={columns} languages={languages} />
    </div>
  );
};

export default ThemesClient;
