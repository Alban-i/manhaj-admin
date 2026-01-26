'use client';

import { PlusCircle, Globe } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Language } from '@/types/types';

interface LanguagesClientProps {
  languages: Language[];
}

const LanguagesClient: React.FC<LanguagesClientProps> = ({ languages }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLanguages = languages.filter(
    (language) =>
      language.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      language.native_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      language.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid gap-3 px-4">
      {/* TOP FIRST LINE */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Languages</h2>
        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={() => router.push('/languages/new')}
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
            <CardTitle>List of languages</CardTitle>
            <CardDescription>
              Manage supported languages for content translations
            </CardDescription>
          </div>

          <Input
            type="text"
            placeholder="Search languages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded w-[300px]"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Native Name</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLanguages.map((language) => (
                <TableRow
                  key={language.code}
                  className={cn('cursor-pointer hover:bg-secondary/50')}
                  onClick={() => router.push(`/languages/${language.code}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
                        {language.code}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell>{language.name}</TableCell>
                  <TableCell>{language.native_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {language.direction.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={language.is_active ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {language.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {language.sort_order}
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

export default LanguagesClient;
