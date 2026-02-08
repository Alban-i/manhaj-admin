'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { createClient } from '@/providers/supabase/client';
import { revalidateFrontend } from '@/actions/revalidate';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Language } from '@/types/types';
import Editor from '@/components/tiptap/editor';

const SETTING_LABELS: Record<string, string> = {
  footer_description: 'Footer — Description',
};

interface SettingsFormProps {
  settings: Record<string, Record<string, string>>;
  languages: Language[];
}

const SettingsForm: React.FC<SettingsFormProps> = ({
  settings: initialSettings,
  languages,
}) => {
  const [values, setValues] = useState(initialSettings);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const settingKeys = Object.keys(SETTING_LABELS);

  const handleChange = (key: string, lang: string, html: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [lang]: html,
      },
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const upserts = [];
      for (const key of settingKeys) {
        for (const lang of languages) {
          const value = values[key]?.[lang.code] ?? '';
          upserts.push({
            key,
            language: lang.code,
            value,
            updated_at: new Date().toISOString(),
          });
        }
      }

      const { error } = await supabase
        .from('site_settings')
        .upsert(upserts, { onConflict: 'key,language' });

      if (error) {
        toast.error(error.message);
        return;
      }

      await revalidateFrontend(['site-settings']);
      toast.success('Settings saved.');
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <fieldset disabled={loading} className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Site Settings</CardTitle>
          <Button onClick={handleSave}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </CardHeader>
      </Card>

      {settingKeys.map((key) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="text-base">{SETTING_LABELS[key]}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            {languages.map((lang) => (
              <div key={lang.code} className="space-y-1.5">
                <Label>{lang.native_name} ({lang.code})</Label>
                <Editor
                  content={values[key]?.[lang.code] ?? ''}
                  onChange={(html) => handleChange(key, lang.code, html)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </fieldset>
  );
};

export default SettingsForm;
