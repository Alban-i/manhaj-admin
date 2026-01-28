'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/app/[locale]/(root)/articles/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export type ProjectInDataTable = {
  id: string;
  name: string;
  size: string;
  preset_name: string;
  updated_at: string;
};

export type ExtendedColumnDef<T> = ColumnDef<T> & {
  label?: string;
};

export const columns: ExtendedColumnDef<ProjectInDataTable>[] = [
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
    accessorKey: 'preset_name',
    label: 'Preset',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Preset" />
    ),
    cell: ({ row }) => {
      const presetName = row.original.preset_name;
      return (
        <div className="px-2 text-center">
          {presetName !== '-' ? (
            <Badge variant="secondary">{presetName}</Badge>
          ) : (
            <span className="text-muted-foreground">Custom</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'updated_at',
    label: 'Updated',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated" />
    ),
    cell: ({ row }) => {
      const date = row.original.updated_at;
      return (
        <div className="px-2 text-right text-muted-foreground">
          {date ? format(new Date(date), 'MMM d, yyyy') : '-'}
        </div>
      );
    },
  },
];
