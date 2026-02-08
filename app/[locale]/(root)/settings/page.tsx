import { createClient } from '@/providers/supabase/server';
import { getActiveLanguages } from '@/actions/get-languages';
import SettingsForm from './components/settings-form';

type SiteSetting = {
  id: number;
  key: string;
  language: string;
  value: string;
};

const SettingsPage = async () => {
  const supabase = await createClient();
  const languages = await getActiveLanguages();

  const { data: settings } = await supabase
    .from('site_settings')
    .select('id, key, language, value')
    .order('key')
    .order('language');

  // Group settings by key -> language -> value
  const grouped: Record<string, Record<string, string>> = {};
  for (const row of (settings as SiteSetting[]) || []) {
    if (!grouped[row.key]) grouped[row.key] = {};
    grouped[row.key][row.language] = row.value;
  }

  return (
    <div className="p-4">
      <SettingsForm settings={grouped} languages={languages} />
    </div>
  );
};

export default SettingsPage;
