'use client';

import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTableViewOptions } from './data-table-view-options';
import { DataTableFacetedFilter } from '@/app/[locale]/(root)/articles/components/data-table-faceted-filter';
import { Language } from '@/types/types';
import { XIcon, Globe } from 'lucide-react';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  languages: Language[];
}

export function DataTableToolbar<TData>({
  table,
  languages,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const languageOptions = languages.map((lang) => ({
    label: lang.native_name,
    value: lang.code,
    icon: Globe,
  }));

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter titles..."
          value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('title')?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />

        {table.getColumn('language') && (
          <DataTableFacetedFilter
            column={table.getColumn('language')}
            title="Language"
            options={languageOptions}
          />
        )}

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
