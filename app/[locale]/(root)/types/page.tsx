import { getTypesWithTranslations } from '@/actions/get-types';
import { getActiveLanguages } from '@/actions/get-languages';
import TypesClient from './components/types-client';

const TypesPage = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;

  const [types, languages] = await Promise.all([
    getTypesWithTranslations(),
    getActiveLanguages(),
  ]);

  return (
    <div className="">
      <TypesClient types={types} languages={languages} currentLocale={locale} />
    </div>
  );
};

export default TypesPage;
