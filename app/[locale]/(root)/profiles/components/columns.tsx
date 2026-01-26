'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from './data-table-column-header';

export type ProfilesInDataTable = {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
};

// Extend the ColumnDef type to include the label property
export type ExtendedColumnDef<T> = ColumnDef<T> & {
  label?: string;
};

export const columns: ExtendedColumnDef<ProfilesInDataTable>[] = [
  {
    accessorKey: 'email',
    label: 'Email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      return (
        <div className="px-2 text-left font-medium">{row.original.email}</div>
      );
    },
  },
  {
    accessorKey: 'username',
    label: 'Username',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Username" />
    ),
    cell: ({ row }) => {
      return (
        <div className="px-2 text-left font-medium">
          {row.original.username}
        </div>
      );
    },
  },
  {
    accessorKey: 'role',
    label: 'Role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      return (
        <div className="px-2 text-left font-medium">{row.original.role}</div>
      );
    },
  },
  {
    accessorKey: 'created_at',
    label: 'Created At',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      return (
        <div className="px-2 text-left font-medium">
          {row.original.created_at}
        </div>
      );
    },
  },
];
