'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/providers/supabase/client';
import { revalidateFrontend } from '@/actions/revalidate';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Language } from '@/types/types';

const SETTING_CONFIG: Record<string, { label: string; placeholder: string; rows: number }> = {
  site_description: { label: 'Meta — Description du site', placeholder: 'Description courte du site (texte brut)', rows: 3 },
  articles_description: { label: 'Meta — Description des articles', placeholder: 'Description de la page articles (texte brut)', rows: 3 },
  footer_description: { label: 'Footer — Description', placeholder: '<p>Ligne 1</p><p>Ligne 2</p>', rows: 6 },
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

  const settingKeys = Object.keys(SETTING_CONFIG);

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
            <CardTitle className="text-base">{SETTING_CONFIG[key].label}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={languages[0]?.code}>
              <TabsList>
                {languages.map((lang) => (
                  <TabsTrigger key={lang.code} value={lang.code}>
                    {lang.native_name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {languages.map((lang) => (
                <TabsContent key={lang.code} value={lang.code}>
                  <div className="space-y-1.5">
                    <Label>{lang.native_name} ({lang.code})</Label>
                    <Textarea
                      dir={lang.direction === 'rtl' ? 'rtl' : 'ltr'}
                      rows={SETTING_CONFIG[key].rows}
                      className="font-mono text-sm"
                      placeholder={SETTING_CONFIG[key].placeholder}
                      value={values[key]?.[lang.code] ?? ''}
                      onChange={(e) =>
                        handleChange(key, lang.code, e.target.value)
                      }
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      ))}
    </fieldset>
  );
};

export default SettingsForm;
