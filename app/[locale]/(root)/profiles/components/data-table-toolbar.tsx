'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Profiles } from '@/types/types';
import { Table } from '@tanstack/react-table';
import { DataTableFacetedFilter } from './data-table-faceted-filter';
import { DataTableViewOptions } from './data-table-view-options';
import { XIcon } from 'lucide-react';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  // profiles: Profiles[];
}

export function DataTableToolbar<TData>({
  table,
}: // profiles,
DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  // const profileOptions = profiles.map((profile) => ({
  //   value: profile.email ?? '',
  //   label: profile.email ?? '',
  // }));

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search by email"
          value={(table.getColumn('email')?.getFilterValue() as number) ?? ''}
          onChange={(event) =>
            table.getColumn('email')?.setFilterValue(event.target.value)
          }
          className="max-w-sm bg-background"
        />
        {/* {table.getColumn('email') && (
          <DataTableFacetedFilter
            column={table.getColumn('email')}
            title="Email"
            options={profileOptions}
          />
        )} */}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <XIcon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
