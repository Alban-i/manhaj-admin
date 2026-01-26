'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from './data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { ArticleStatus } from '@/types/types';
import { cn } from '@/lib/utils';

export type PostsInDataTable = {
  id: string;
  title: string;
  status: ArticleStatus;
  slug: string;
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

export const columns: ExtendedColumnDef<PostsInDataTable>[] = [
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
    accessorKey: 'status',
    label: 'Status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      const capitalizedStatus =
        status.charAt(0).toUpperCase() + status.slice(1);

      return (
        <div className="px-2 text-right">
          <Badge
            variant={status === 'Archived' ? 'secondary' : 'outline'}
            className={cn(
              status === 'Published' &&
                'border-green-400 bg-green-100 text-green-700',
              status === 'Draft' &&
                'border-gray-800 bg-background text-foreground',
              status === 'Archived' && 'border-none'
            )}
          >
            {capitalizedStatus}
          </Badge>
        </div>
      );
    },
  },
];
