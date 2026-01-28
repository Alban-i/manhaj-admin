'use client';

import { PlusCircle, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageProjectWithRelations, ImagePresetWithCreator } from '@/types/image-generator';
import Link from 'next/link';
import { DataTable } from './data-table';
import { columns } from './columns';
import { useTranslations } from 'next-intl';

interface ProjectsClientProps {
  projects: ImageProjectWithRelations[];
  presets: ImagePresetWithCreator[];
}

const ProjectsClient: React.FC<ProjectsClientProps> = ({ projects, presets }) => {
  const t = useTranslations('imageGenerator');

  const refinedProjects = projects.map(({ id, name, width, height, preset, updated_at }) => ({
    id,
    name,
    size: `${width}x${height}`,
    preset_name: preset?.name ?? '-',
    updated_at: updated_at ?? '',
  }));

  return (
    <div className="grid gap-3 px-4">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">{t('projects')}</h2>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/images/presets" passHref>
            <Button variant="outline" className="gap-1">
              <Palette className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                {t('presets')}
              </span>
            </Button>
          </Link>
          <Link href="/images/new" passHref>
            <Button className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                {t('newProject')}
              </span>
            </Button>
          </Link>
        </div>
      </div>

      <DataTable data={refinedProjects} columns={columns} />
    </div>
  );
};

export default ProjectsClient;
