'use client';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImagePresetWithCreator } from '@/types/image-generator';
import Link from 'next/link';
import { DataTable } from './data-table';
import { columns } from './columns';
import { useTranslations } from 'next-intl';

interface PresetsClientProps {
  presets: ImagePresetWithCreator[];
}

const PresetsClient: React.FC<PresetsClientProps> = ({ presets }) => {
  const t = useTranslations('imageGenerator');

  const refinedPresets = presets.map(({ id, name, width, height, prompt_template, created_at }) => ({
    id,
    name,
    size: `${width}x${height}`,
    prompt_template: prompt_template.length > 50
      ? prompt_template.substring(0, 50) + '...'
      : prompt_template,
    created_at: created_at ?? '',
  }));

  return (
    <div className="grid gap-3 px-4">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">{t('presets')}</h2>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/images/presets/new" passHref>
            <Button className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                {t('newPreset')}
              </span>
            </Button>
          </Link>
        </div>
      </div>

      <DataTable data={refinedPresets} columns={columns} />
    </div>
  );
};

export default PresetsClient;
