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
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/providers/supabase/client';
import type {
  TypeWithTranslations,
  ClassificationWithTranslations,
  Language,
} from '@/types/types';
import { generateSlug } from '@/lib/utils';
import { revalidateTypes } from '@/actions/revalidate';
import { upsertTypeTranslations } from '@/actions/upsert-type-translations';
import { getLanguageWithFlag } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

interface TypeFormProps {
  type: TypeWithTranslations | null;
  languages: Language[];
  classifications: ClassificationWithTranslations[];
}

const TypeForm: React.FC<TypeFormProps> = ({
  type,
  languages,
  classifications,
}) => {
  const t = useTranslations('types');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // Build dynamic form schema based on active languages
  const translationSchema: Record<
    string,
    z.ZodObject<{ name: z.ZodString; description: z.ZodString }>
  > = {};
  languages.forEach((lang) => {
    // Arabic is required, others are optional
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
    classification_id: z.coerce.number().min(1, t('classificationRequired')),
    translations: z.object(translationSchema),
  });

  type FormValues = z.infer<typeof formSchema>;

  // Build default values from existing translations
  const defaultTranslations: Record<
    string,
    { name: string; description: string }
  > = {};
  languages.forEach((lang) => {
    const existing = type?.translations.find((tr) => tr.language === lang.code);
    defaultTranslations[lang.code] = {
      name: existing?.name ?? '',
      description: existing?.description ?? '',
    };
  });

  // Get the Arabic translation for display
  const arabicTranslation = type?.translations.find(
    (tr) => tr.language === 'ar'
  );
  const displayName = arabicTranslation?.name ?? type?.slug ?? t('newType');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: type?.slug ?? '',
      classification_id: type?.classification_id ?? 0,
      translations: defaultTranslations,
    },
  });

  // Auto-generate slug from Arabic name for new types
  const arabicNameValue = form.watch('translations.ar.name');
  useEffect(() => {
    // Only auto-generate slug for new types (when no type exists)
    if (!type && arabicNameValue) {
      const generatedSlug = generateSlug(arabicNameValue);
      form.setValue('slug', generatedSlug);
    }
  }, [arabicNameValue, type, form]);

  // Labels
  const toastMessage = type ? t('typeUpdated') : t('typeCreated');
  const action = type ? t('saveChanges') : t('create');

  // Get localized classification name
  const getClassificationName = (
    classification: ClassificationWithTranslations,
    locale: string = 'ar'
  ) => {
    const translation = classification.translations.find(
      (tr) => tr.language === locale
    );
    return translation?.name ?? classification.slug;
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      if (type) {
        // Update existing type
        const { error } = await supabase
          .from('types')
          .update({
            slug: values.slug,
            classification_id: values.classification_id,
          })
          .eq('id', type.id);

        if (error) {
          toast.error(error.message);
          return;
        }

        // Update translations
        const translationData = Object.entries(values.translations)
          .filter(
            ([_, data]) => data.name && data.name.trim() !== ''
          )
          .map(([language, data]) => ({
            language,
            name: data.name.trim(),
            description: data.description?.trim() || '',
          }));

        const result = await upsertTypeTranslations(type.id, translationData);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
      } else {
        // Create new type (slug and classification_id only)
        const { data, error } = await supabase
          .from('types')
          .insert({
            slug: values.slug,
            classification_id: values.classification_id,
            name: values.translations.ar.name, // Required field
            description: values.translations.ar.description || null,
          })
          .select()
          .single();

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data) {
          // Create translations for the new type
          const translationData = Object.entries(values.translations)
            .filter(
              ([_, trData]) => trData.name && trData.name.trim() !== ''
            )
            .map(([language, trData]) => ({
              language,
              name: trData.name.trim(),
              description: trData.description?.trim() || '',
            }));

          const result = await upsertTypeTranslations(data.id, translationData);
          if (!result.success) {
            toast.error(result.error);
            return;
          }

          router.push(`/types/${data.slug}`);
        }
      }

      toast.success(toastMessage);

      // Revalidate frontend cache
      await revalidateTypes();

      router.refresh();
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!type) {
      return;
    }

    try {
      const { error } = await supabase.from('types').delete().eq('id', type.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(t('typeDeleted'));

      // Revalidate frontend cache
      await revalidateTypes();

      router.push('/types');
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
                  {type && (
                    <DeleteButton label={t('deleteType')} fn={onDelete} />
                  )}
                  <Button type="submit">{action}</Button>
                </div>
              </CardHeader>
            </Card>

            {/* SLUG & CLASSIFICATION */}
            <Card>
              <CardHeader>
                <CardTitle>{t('typeDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('slug')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('slugPlaceholder')} {...field} />
                      </FormControl>
                      <FormDescription>{t('slugDescription')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="classification_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('classification')}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ? String(field.value) : ''}
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          disabled={field.disabled}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={t('selectClassification')}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {classifications.map((classification) => (
                              <SelectItem
                                key={classification.id}
                                value={String(classification.id)}
                              >
                                {getClassificationName(classification)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
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
                  <div
                    key={lang.code}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      {getLanguageWithFlag(lang.code, lang.name)}
                      {lang.code === 'ar' && (
                        <Badge variant="secondary" className="text-xs">
                          {t('required')}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name={`translations.${lang.code}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('name')}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={`${t('typeNameIn')} ${lang.name}`}
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
                                placeholder={`${t('typeDescriptionIn')} ${lang.name}`}
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

export default TypeForm;
