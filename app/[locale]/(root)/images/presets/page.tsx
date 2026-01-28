import getImagePresets from '@/actions/image-generator/presets/get-presets';
import PresetsClient from './components/presets-client';

const PresetsPage = async () => {
  const presets = await getImagePresets();

  return (
    <div className="">
      <PresetsClient presets={presets} />
    </div>
  );
};

export default PresetsPage;
