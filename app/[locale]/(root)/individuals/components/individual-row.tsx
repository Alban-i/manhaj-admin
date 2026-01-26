'use client';

import { useRouter } from 'next/navigation';
import { TableCell, TableRow } from '@/components/ui/table';

interface Individual {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface IndividualRowProps {
  individual: Individual;
}

const IndividualRow: React.FC<IndividualRowProps> = ({ individual }) => {
  const router = useRouter();

  return (
    <TableRow
      key={individual.id}
      className="cursor-pointer hover:bg-secondary/50"
      onClick={() => {
        router.push(`/individuals/${individual.slug}`);
      }}
    >
      <TableCell className="pl-4">{individual.name}</TableCell>
      <TableCell>{individual.description}</TableCell>
      <TableCell>
        {individual.created_at
          ? new Date(individual.created_at).toLocaleString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : ''}
      </TableCell>
      <TableCell>
        {individual.updated_at
          ? new Date(individual.updated_at).toLocaleString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : ''}
      </TableCell>
    </TableRow>
  );
};

export default IndividualRow;
