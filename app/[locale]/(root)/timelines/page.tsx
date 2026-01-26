import getTimelines from '@/actions/get-timelines';
import { getActiveLanguages } from '@/actions/get-languages';
import TimelinesClient from './components/timelines-client';

const TimelinesPage = async () => {
  const [timelines, languages] = await Promise.all([
    getTimelines(),
    getActiveLanguages(),
  ]);

  return (
    <div className="">
      <TimelinesClient timelines={timelines} languages={languages} />
    </div>
  );
};

export default TimelinesPage;
