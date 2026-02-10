import { getActiveLanguages } from '@/actions/get-languages';
import getFatwaClassifications from '@/actions/get-fatwa-classifications';
import FatwaClassificationsClient from './components/fatwa-classifications-client';

const FatwaClassificationsPage = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;

  const [classifications, languages] = await Promise.all([
    getFatwaClassifications(),
    getActiveLanguages(),
  ]);

  return (
    <div className="">
      <FatwaClassificationsClient
        classifications={classifications}
        languages={languages}
        currentLocale={locale}
      />
    </div>
  );
};

export default FatwaClassificationsPage;
