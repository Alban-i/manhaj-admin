'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/app/[locale]/(root)/articles/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';

export type PresetInDataTable = {
  id: string;
  name: string;
  size: string;
  prompt_template: string;
  created_at: string;
};

export type ExtendedColumnDef<T> = ColumnDef<T> & {
  label?: string;
};

export const columns: ExtendedColumnDef<PresetInDataTable>[] = [
  {
    accessorKey: 'name',
    label: 'Name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      return (
        <div className="px-2 text-left font-medium">{row.original.name}</div>
      );
    },
  },
  {
    accessorKey: 'size',
    label: 'Size',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Size" />
    ),
    cell: ({ row }) => {
      return (
        <div className="px-2 text-center">
          <Badge variant="outline" className="font-mono">
            {row.original.size}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'prompt_template',
    label: 'Prompt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prompt Template" />
    ),
    cell: ({ row }) => {
      return (
        <div className="px-2 text-left text-muted-foreground max-w-[300px] truncate">
          {row.original.prompt_template}
        </div>
      );
    },
  },
];
