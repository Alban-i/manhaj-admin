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

interface Glossary {
  id: string;
  term: string;
  definition: string;
  slug: string;
  created_at: string;
}

interface GlossariesClientProps {
  glossaries: Glossary[];
}

const GlossariesClient: React.FC<GlossariesClientProps> = ({ glossaries }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGlossaries = glossaries.filter((glossary) =>
    glossary.term?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid gap-3 px-4">
      {/* TOP FIRST LINE */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Glossaries</h2>
        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={() => router.push('/glossaries/new')}
            className="gap-1"
          >
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
            <CardTitle>List of glossaries</CardTitle>
            <CardDescription>Your list of glossary terms</CardDescription>
          </div>

          <Input
            type="text"
            placeholder="Search glossaries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded w-[300px]"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term</TableHead>
                <TableHead>Definition</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGlossaries.map((glossary) => (
                <TableRow
                  key={glossary.id}
                  className={cn('cursor-pointer hover:bg-secondary/50')}
                  onClick={() => router.push(`/glossaries/${glossary.slug}`)}
                >
                  <TableCell>{glossary.term}</TableCell>
                  <TableCell className="max-w-md break-words whitespace-normal">
                    {glossary.definition}
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

export default GlossariesClient;