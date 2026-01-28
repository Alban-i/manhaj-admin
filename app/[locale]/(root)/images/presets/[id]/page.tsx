import getImagePreset from '@/actions/image-generator/presets/get-preset';
import PresetForm from './components/preset-form';

interface PresetPageProps {
  params: Promise<{ id: string }>;
}

const PresetPage = async ({ params }: PresetPageProps) => {
  const { id } = await params;
  const isNew = id === 'new';

  const preset = isNew ? null : await getImagePreset(id);

  return <PresetForm preset={preset} isNew={isNew} />;
};

export default PresetPage;
