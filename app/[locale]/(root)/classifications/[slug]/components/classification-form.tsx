'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ClassificationWithTranslations,
  Language,
} from '@/types/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/providers/supabase/client';
import { upsertClassificationTranslations } from '@/actions/upsert-classification-translations';
import { getLanguageWithFlag } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

interface ClassificationFormProps {
  classification: ClassificationWithTranslations;
  languages: Language[];
}

const ClassificationForm: React.FC<ClassificationFormProps> = ({
  classification,
  languages,
}) => {
  const t = useTranslations('classifications');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // Build dynamic form schema based on active languages
  const translationSchema: Record<string, z.ZodString> = {};
  languages.forEach((lang) => {
    // Arabic is required, others are optional
    if (lang.code === 'ar') {
      translationSchema[lang.code] = z
        .string()
        .min(1, t('translationRequired'));
    } else {
      translationSchema[lang.code] = z.string();
    }
  });

  const formSchema = z.object({
    slug: z.string().min(1, t('slugRequired')),
    translations: z.object(translationSchema),
  });

  type FormValues = z.infer<typeof formSchema>;

  // Build default values from existing translations
  const defaultTranslations: Record<string, string> = {};
  languages.forEach((lang) => {
    const existing = classification.translations.find(
      (tr) => tr.language === lang.code
    );
    defaultTranslations[lang.code] = existing?.name ?? '';
  });

  // Get the Arabic translation for display
  const arabicTranslation = classification.translations.find(
    (tr) => tr.language === 'ar'
  );
  const displayName = arabicTranslation?.name ?? classification.slug;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: classification.slug,
      translations: defaultTranslations,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      // Update classification slug if changed
      if (values.slug !== classification.slug) {
        const { error } = await supabase
          .from('classifications')
          .update({ slug: values.slug })
          .eq('id', classification.id);

        if (error) {
          toast.error(error.message);
          return;
        }
      }

      // Update translations
      const translationData = Object.entries(values.translations)
        .filter(([_, name]) => name && name.trim() !== '')
        .map(([language, name]) => ({
          language,
          name: name.trim(),
        }));

      const result = await upsertClassificationTranslations(
        classification.id,
        translationData
      );
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(t('classificationUpdated'));

      // If slug changed, redirect to new URL
      if (values.slug !== classification.slug) {
        router.push(`/classifications/${values.slug}`);
      }

      router.refresh();
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <fieldset disabled={loading} className="grid grid-cols-1 gap-2">
            {/* HEADER */}
            <Card>
              <CardHeader className="grid grid-cols-[1fr_auto] items-center gap-4">
                <CardTitle>{displayName}</CardTitle>
                <div className="flex gap-2">
                  <Button type="submit">{t('saveChanges')}</Button>
                </div>
              </CardHeader>
            </Card>

            {/* SLUG */}
            <Card>
              <CardHeader>
                <CardTitle>{t('slug')}</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('slug')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('slugPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('slugDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* TRANSLATIONS */}
            <Card>
              <CardHeader>
                <CardTitle>{t('translations')}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-x-2 gap-y-4">
                {languages.map((lang) => (
                  <FormField
                    key={lang.code}
                    control={form.control}
                    name={`translations.${lang.code}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          {getLanguageWithFlag(lang.code, lang.name)}
                          {lang.code === 'ar' && (
                            <Badge variant="secondary" className="text-xs">
                              {t('required')}
                            </Badge>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={`${t('classificationNameIn')} ${lang.name}`}
                            dir={lang.direction}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
            </Card>
          </fieldset>
        </form>
      </Form>
    </div>
  );
};

export default ClassificationForm;
