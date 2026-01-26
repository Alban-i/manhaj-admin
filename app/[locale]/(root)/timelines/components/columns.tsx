'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/app/[locale]/(root)/articles/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type TimelinesInDataTable = {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  language: string;
};

// Language display names
const languageNames: Record<string, string> = {
  ar: 'العربية',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
};

// Extend the ColumnDef type to include the label property
export type ExtendedColumnDef<T> = ColumnDef<T> & {
  label?: string;
};

export const columns: ExtendedColumnDef<TimelinesInDataTable>[] = [
  {
    accessorKey: 'title',
    label: 'Title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      return (
        <div className="px-2 text-left font-medium">{row.original.title}</div>
      );
    },
  },
  {
    accessorKey: 'language',
    label: 'Language',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Language" />
    ),
    cell: ({ row }) => {
      const language = row.original.language;
      return (
        <div className="px-2 text-center">
          <Badge variant="outline" className="font-normal">
            {languageNames[language] || language.toUpperCase()}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'is_published',
    label: 'Status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isPublished = row.original.is_published;

      return (
        <div className="px-2 text-right">
          <Badge
            variant={isPublished ? 'default' : 'outline'}
            className={cn(
              isPublished &&
                'border-green-400 bg-green-100 text-green-700',
              !isPublished &&
                'border-gray-800 bg-background text-foreground'
            )}
          >
            {isPublished ? 'Published' : 'Draft'}
          </Badge>
        </div>
      );
    },
  },
];
