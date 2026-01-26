'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Tasks } from '@/types/types';
import { format } from 'date-fns';
import { DataTableColumnHeader } from './data-table-column-header';

export type TasksInDataTable = Tasks;

export type ExtendedColumnDef<T> = ColumnDef<T> & {
  label?: string;
};

export const columns: ExtendedColumnDef<Tasks>[] = [
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
    accessorKey: 'description',
    label: 'Description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      return (
        <div className="px-2 text-left">
          {row.original.description || 'No description'}
        </div>
      );
    },
  },
  {
    accessorKey: 'due_date',
    label: 'Due Date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => {
      const dueDate = row.original.due_date;
      return (
        <div className="px-2 text-right">
          {dueDate ? format(new Date(dueDate), 'PPP') : 'No due date'}
        </div>
      );
    },
  },
  {
    accessorKey: 'owner_id',
    label: 'Owner',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Owner" />
    ),
    cell: ({ row }) => {
      return (
        <div className="px-2 text-right">
          {row.original.owner_id?.full_name || 'Unassigned'}
        </div>
      );
    },
  },
];
