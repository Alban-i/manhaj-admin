import getFatawa from '@/actions/get-fatawa';
import { getActiveLanguages } from '@/actions/get-languages';
import FatawaClient from './components/fatawa-client';

const FatawaPage = async () => {
  const [fatawa, languages] = await Promise.all([
    getFatawa(),
    getActiveLanguages(),
  ]);

  return (
    <div className="">
      <FatawaClient fatawa={fatawa} languages={languages} />
    </div>
  );
};

export default FatawaPage;
