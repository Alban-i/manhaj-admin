import { getActiveLanguages } from '@/actions/get-languages';
import getClassifications from '@/actions/get-classifications';
import ClassificationsClient from './components/classifications-client';

const ClassificationsPage = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;

  const classifications = await getClassifications();
  const languages = await getActiveLanguages();

  return (
    <div className="">
      <ClassificationsClient
        classifications={classifications}
        languages={languages}
        currentLocale={locale}
      />
    </div>
  );
};

export default ClassificationsPage;
