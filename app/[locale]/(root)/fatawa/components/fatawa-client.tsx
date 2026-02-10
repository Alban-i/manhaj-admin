'use client';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FatwaInList, Language } from '@/types/types';
import Link from 'next/link';
import { DataTable } from './data-table';
import { columns } from './columns';

interface FatawaClientProps {
  fatawa: FatwaInList[];
  languages: Language[];
}

const FatawaClient: React.FC<FatawaClientProps> = ({ fatawa, languages }) => {
  const refinedFatawa = fatawa.map(({ id, title, status, slug, language }) => ({
    id,
    title: title ?? '',
    status,
    slug,
    language: language ?? 'ar',
  }));

  return (
    <div className="grid gap-3 px-4">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Fatawa</h2>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/fatawa/new" passHref>
            <Button className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                New
              </span>
            </Button>
          </Link>
        </div>
      </div>

      <DataTable data={refinedFatawa} columns={columns} languages={languages} />
    </div>
  );
};

export default FatawaClient;
