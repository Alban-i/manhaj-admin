'use client';

import { Table } from '@tanstack/react-table';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableFacetedFilter } from '@/app/[locale]/(root)/articles/components/data-table-faceted-filter';
import { DataTableViewOptions } from '@/app/[locale]/(root)/articles/components/data-table-view-options';
import { Language } from '@/types/types';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  languages: Language[];
}

export function DataTableToolbar<TData>({
  table,
  languages,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  // Convert languages to filter options
  const languageOptions = languages.map((lang) => ({
    label: lang.native_name,
    value: lang.code,
  }));

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter by title..."
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
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
