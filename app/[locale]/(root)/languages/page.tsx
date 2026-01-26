import getLanguages from '@/actions/get-languages';
import LanguagesClient from './components/languages-client';

const LanguagesPage = async () => {
  const languages = await getLanguages();

  return (
    <div className="">
      <LanguagesClient languages={languages} />
    </div>
  );
};

export default LanguagesPage;
