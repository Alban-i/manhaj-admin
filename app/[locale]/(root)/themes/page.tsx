import getThemes from '@/actions/get-themes';
import { getActiveLanguages } from '@/actions/get-languages';
import ThemesClient from './components/themes-client';

const ThemesPage = async () => {
  const [themes, languages] = await Promise.all([
    getThemes(),
    getActiveLanguages(),
  ]);

  return (
    <div className="">
      <ThemesClient themes={themes} languages={languages} />
    </div>
  );
};

export default ThemesPage;
