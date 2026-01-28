'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
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

import DeleteButton from '@/components/delete-btn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tags, TagTranslation, Language } from '@/types/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/providers/supabase/client';
import { generateSlug } from '@/lib/utils';
import { revalidateTags } from '@/actions/revalidate';
import { upsertTagTranslations } from '@/actions/upsert-tag-translations';
import { getLanguageWithFlag } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

interface TagFormProps {
  tag: Tags | null;
  translations?: TagTranslation[];
  languages: Language[];
}

const TagForm: React.FC<TagFormProps> = ({
  tag,
  translations = [],
  languages,
}) => {
  const t = useTranslations('tags');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // Build dynamic form schema based on active languages
  const translationSchema: Record<string, z.ZodString> = {};
  languages.forEach((lang) => {
    // Arabic is required, others are optional
    if (lang.code === 'ar') {
      translationSchema[lang.code] = z.string().min(1, t('translationRequired'));
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
    const existing = translations.find((tr) => tr.language === lang.code);
    defaultTranslations[lang.code] = existing?.name ?? '';
  });

  // Get the Arabic translation for display
  const arabicTranslation = translations.find((tr) => tr.language === 'ar');
  const displayName = arabicTranslation?.name ?? tag?.slug ?? t('newTag');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: tag?.slug ?? '',
      translations: defaultTranslations,
    },
  });

  // Auto-generate slug from Arabic name for new tags
  const arabicNameValue = form.watch('translations.ar');
  useEffect(() => {
    // Only auto-generate slug for new tags (when no tag exists)
    if (!tag && arabicNameValue) {
      const generatedSlug = generateSlug(arabicNameValue);
      form.setValue('slug', generatedSlug);
    }
  }, [arabicNameValue, tag, form]);

  // Labels
  const toastMessage = tag ? t('tagUpdated') : t('tagCreated');
  const action = tag ? t('saveChanges') : t('create');

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      if (tag) {
        // Update existing tag slug only
        const { error } = await supabase
          .from('tags')
          .update({
            slug: values.slug,
          })
          .eq('id', tag.id);

        if (error) {
          toast.error(error.message);
          return;
        }

        // Update translations
        const translationData = Object.entries(values.translations)
          .filter(([_, name]) => name && name.trim() !== '')
          .map(([language, name]) => ({
            language,
            name: name.trim(),
          }));

        const result = await upsertTagTranslations(tag.id, translationData);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
      } else {
        // Create new tag (only slug needed now)
        const { data, error } = await supabase
          .from('tags')
          .insert({
            slug: values.slug,
          })
          .select()
          .single();

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data) {
          // Create translations for the new tag
          const translationData = Object.entries(values.translations)
            .filter(([_, name]) => name && name.trim() !== '')
            .map(([language, name]) => ({
              language,
              name: name.trim(),
            }));

          const result = await upsertTagTranslations(data.id, translationData);
          if (!result.success) {
            toast.error(result.error);
            return;
          }

          router.push(`/tags/${data.slug}`);
        }
      }

      toast.success(toastMessage);

      // Revalidate frontend cache
      await revalidateTags();

      router.refresh();
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!tag) {
      return;
    }

    try {
      const { error } = await supabase.from('tags').delete().eq('id', tag.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(t('tagDeleted'));

      // Revalidate frontend cache
      await revalidateTags();

      router.push('/tags');
      router.refresh();
    } catch (error) {
      toast.error('Something went wrong when trying to delete');
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
                  {tag && <DeleteButton label={t('deleteTag')} fn={onDelete} />}
                  <Button type="submit">{action}</Button>
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
                            placeholder={`${t('tagNameIn')} ${lang.name}`}
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

export default TagForm;
