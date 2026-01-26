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
import { Tags } from '@/types/types';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface TagsClientProps {
  tags: Tags[];
}

const TagsClient: React.FC<TagsClientProps> = ({ tags }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTags = tags.filter((tag) =>
    tag.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid gap-3 px-4">
      {/* TOP FIRST LINE */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Tags</h2>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={() => router.push('/tags/new')} className="gap-1">
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
            <CardTitle>List of tags</CardTitle>
            <CardDescription>Your list of tags</CardDescription>
          </div>

          <Input
            type="text"
            placeholder="Search tags..."
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
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTags.map((tag) => (
                <TableRow
                  key={tag.id}
                  className={cn('cursor-pointer hover:bg-secondary/50')}
                  onClick={() => router.push(`/tags/${tag.slug}`)}
                >
                  <TableCell>{tag.name}</TableCell>
                  <TableCell>
                    {tag.created_at
                      ? new Date(tag.created_at).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
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

export default TagsClient;
