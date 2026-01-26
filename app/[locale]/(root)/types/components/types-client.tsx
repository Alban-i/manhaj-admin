'use client';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface Type {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  classification: string;
}

interface TypesClientProps {
  types: Type[];
}

const TypesClient: React.FC<TypesClientProps> = ({ types }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTypes = types.filter((type) =>
    type.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid gap-3 px-4">
      {/* TOP FIRST LINE */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Types</h2>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={() => router.push('/types/new')} className="gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              New
            </span>
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader className="grid grid-cols-[1fr_auto] gap-2">
          <div className="flex flex-col items-start gap-2">
            <CardTitle>List of types</CardTitle>
            <CardDescription>Your list of individual types</CardDescription>
          </div>

          <Input
            type="text"
            placeholder="Search types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded w-[300px]"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.map((type) => (
                <TableRow
                  key={type.id}
                  className={cn('cursor-pointer hover:bg-secondary/50')}
                  onClick={() => router.push(`/types/${type.slug}`)}
                >
                  <TableCell className="font-bold">{type.name}</TableCell>
                  <TableCell>
                    {type.classification
                      ? type.classification.charAt(0).toUpperCase() +
                        type.classification.slice(1)
                      : '—'}
                  </TableCell>
                  <TableCell className="max-w-md break-words whitespace-normal">
                    {type.description}
                  </TableCell>
                  <TableCell>
                    {type.created_at
                      ? new Date(type.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TypesClient;
