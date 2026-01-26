'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { columns } from './columns';
import { DataTable } from './data-table';

interface Individual {
  id: number;
  name: string;
  description: string | null;
  type_id: number | null;
  created_at: string | null;
  updated_at: string | null;
  original_name?: string | null; // <-- Added
  status: 'draft' | 'published' | 'archived'; // <-- Added
  slug: string; // <-- Added for slug-based routing
  types?: {
    name: string;
  } | null;
}

interface IndividualsClientProps {
  individuals: Individual[];
}

const IndividualsClient: React.FC<IndividualsClientProps> = ({
  individuals,
}) => {
  const router = useRouter();

  // Map the data to include type_name for the table
  const mappedData = individuals.map((individual) => ({
    ...individual,
    type_name: individual.types?.name || null,
    original_name: individual.original_name || '', // <-- Ensure this is passed
    status: individual.status, // <-- Ensure this is passed
    slug: individual.slug, // <-- Ensure slug is passed for navigation
  }));

  return (
    <div className="grid gap-3 px-4">
      {/* TOP FIRST LINE */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Individuals</h2>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={() => router.push('/individuals/new')}>
            Add New Individual
          </Button>
        </div>
      </div>

      <DataTable data={mappedData} columns={columns} />
    </div>
  );
};

export default IndividualsClient;
