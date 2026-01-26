'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from './data-table-column-header';

export type IndividualsInDataTable = {
  id: number;
  name: string;
  slug: string;
  type_id: number | null;
  type_name?: string | null;
  created_at: string | null;
  updated_at: string | null;
  original_name?: string | null;
  status: 'draft' | 'published' | 'archived';
};

// Extend the ColumnDef type to include the label property
export type ExtendedColumnDef<T> = ColumnDef<T> & {
  label?: string;
};

export const columns: ExtendedColumnDef<IndividualsInDataTable>[] = [
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
    accessorKey: 'original_name',
    label: 'Original Name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Original Name" />
    ),
    cell: ({ row }) => {
      return (
        <div className="px-2 text-left">{row.original.original_name || ''}</div>
      );
    },
  },
  {
    accessorKey: 'type_name',
    label: 'Type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      return (
        <div className="px-2 text-left">
          {row.original.type_name || 'No type'}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    label: 'Status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const value = row.original.status;
      let color = '';
      if (value === 'draft') color = 'var(--muted-foreground)';
      if (value === 'published') color = 'var(--primary)';
      if (value === 'archived') color = 'var(--destructive)';
      return (
        <div className="px-2 text-left font-medium" style={{ color }}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </div>
      );
    },
  },
];
