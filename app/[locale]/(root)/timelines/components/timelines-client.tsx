'use client';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Timeline, Language } from '@/types/types';
import Link from 'next/link';
import { DataTable } from './data-table';
import { columns } from './columns';

interface TimelinesClientProps {
  timelines: Timeline[];
  languages: Language[];
}

const TimelinesClient: React.FC<TimelinesClientProps> = ({ timelines, languages }) => {
  const refinedTimelines = timelines.map(({ id, title, slug, is_published, language }) => ({
    id,
    title: title ?? '',
    slug,
    is_published: is_published ?? false,
    language: language ?? 'ar',
  }));

  return (
    <div className="grid gap-3 px-4">
      {/* TOP FIRST LINE */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Timelines</h2>
        <div className="ml-auto flex items-center gap-2">
          {/* NEW TIMELINE */}
          <Link href="/timelines/new" passHref>
            <Button className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                New
              </span>
            </Button>
          </Link>
        </div>
      </div>

      <DataTable data={refinedTimelines} columns={columns} languages={languages} />
    </div>
  );
};

export default TimelinesClient;
