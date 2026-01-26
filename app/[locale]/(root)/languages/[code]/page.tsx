import { getLanguageByCode } from '@/actions/get-languages';
import LanguageForm from './components/language-form';

const LanguageContentPage = async ({
  params,
}: {
  params: Promise<{ code: string }>;
}) => {
  const { code } = await params;

  // If code is 'new', return empty language
  if (code === 'new') {
    return (
      <div className="">
        <LanguageForm language={null} />
      </div>
    );
  }

  // Fetch existing language by code
  const language = await getLanguageByCode(code);

  if (!language) {
    return <div className="px-4">No language found.</div>;
  }

  return (
    <div className="">
      <LanguageForm language={language} />
    </div>
  );
};

export default LanguageContentPage;
