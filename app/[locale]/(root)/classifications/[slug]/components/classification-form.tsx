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
import { Textarea } from '@/components/ui/textarea';
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
import ImageUpload from '@/components/image-upload';

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
  const translationSchema: Record<string, z.ZodObject<{ name: z.ZodString; description: z.ZodString }>> = {};
  languages.forEach((lang) => {
    // Arabic name is required, others are optional
    if (lang.code === 'ar') {
      translationSchema[lang.code] = z.object({
        name: z.string().min(1, t('translationRequired')),
        description: z.string(),
      });
    } else {
      translationSchema[lang.code] = z.object({
        name: z.string(),
        description: z.string(),
      });
    }
  });

  const formSchema = z.object({
    slug: z.string().min(1, t('slugRequired')),
    display_order: z.coerce.number().int().min(0),
    cover_image: z.string().optional(),
    translations: z.object(translationSchema),
  });

  type FormValues = z.infer<typeof formSchema>;

  // Build default values from existing translations
  const defaultTranslations: Record<string, { name: string; description: string }> = {};
  languages.forEach((lang) => {
    const existing = classification.translations.find(
      (tr) => tr.language === lang.code
    );
    defaultTranslations[lang.code] = {
      name: existing?.name ?? '',
      description: existing?.description ?? '',
    };
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
      display_order: classification.display_order ?? 0,
      cover_image: classification.cover_image ?? '',
      translations: defaultTranslations,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      // Update classification slug, display_order, and cover_image
      const updateData: { slug?: string; display_order?: number; cover_image?: string | null } = {};
      if (values.slug !== classification.slug) {
        updateData.slug = values.slug;
      }
      if (values.display_order !== classification.display_order) {
        updateData.display_order = values.display_order;
      }
      if (values.cover_image !== (classification.cover_image ?? '')) {
        updateData.cover_image = values.cover_image || null;
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('classifications')
          .update(updateData)
          .eq('id', classification.id);

        if (error) {
          toast.error(error.message);
          return;
        }
      }

      // Update translations
      const translationData = Object.entries(values.translations)
        .filter(([_, data]) => data.name && data.name.trim() !== '')
        .map(([language, data]) => ({
          language,
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
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

            {/* SLUG & SETTINGS */}
            <Card>
              <CardHeader>
                <CardTitle>{t('settings')}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <FormField
                  control={form.control}
                  name="display_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('displayOrder')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('displayOrderDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cover_image"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{t('coverImage')}</FormLabel>
                      <FormControl>
                        <ImageUpload
                          disabled={loading}
                          value={field.value ? [field.value] : []}
                          onChange={(url: string) => field.onChange(url)}
                          onRemove={() => field.onChange('')}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('coverImageSize')}
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
              <CardContent className="grid grid-cols-1 gap-6">
                {languages.map((lang) => (
                  <div key={lang.code} className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getLanguageWithFlag(lang.code, lang.name)}
                      {lang.code === 'ar' && (
                        <Badge variant="secondary" className="text-xs">
                          {t('required')}
                        </Badge>
                      )}
                    </div>
                    <FormField
                      control={form.control}
                      name={`translations.${lang.code}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('name')}</FormLabel>
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
                    <FormField
                      control={form.control}
                      name={`translations.${lang.code}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('description')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={`${t('classificationDescriptionIn')} ${lang.name}`}
                              dir={lang.direction}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
