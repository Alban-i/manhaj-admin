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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import DeleteButton from '@/components/delete-btn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FatwaClassificationWithTranslations,
  Language,
} from '@/types/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/providers/supabase/client';
import { getLanguageWithFlag } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

interface FatwaClassificationFormProps {
  classification: FatwaClassificationWithTranslations;
  classifications: FatwaClassificationWithTranslations[];
  languages: Language[];
}

const FatwaClassificationForm: React.FC<FatwaClassificationFormProps> = ({
  classification,
  classifications,
  languages,
}) => {
  const t = useTranslations('fatwaClassifications');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // Build form schema
  const translationSchema: Record<string, z.ZodObject<{ name: z.ZodString; description: z.ZodString }>> = {};
  languages.forEach((lang) => {
    if (lang.code === 'ar') {
      translationSchema[lang.code] = z.object({
        name: z.string().min(1, 'Required'),
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
    slug: z.string().min(1, 'Slug is required'),
    display_order: z.coerce.number().int().min(0),
    parent_id: z.string().optional(),
    translations: z.object(translationSchema),
  });

  type FormValues = z.infer<typeof formSchema>;

  // Default translations
  const defaultTranslations: Record<string, { name: string; description: string }> = {};
  languages.forEach((lang) => {
    const existing = classification.fatwa_classification_translations.find(
      (tr) => tr.language === lang.code
    );
    defaultTranslations[lang.code] = {
      name: existing?.name ?? '',
      description: existing?.description ?? '',
    };
  });

  const arabicTranslation = classification.fatwa_classification_translations.find(
    (tr) => tr.language === 'ar'
  );
  const displayName = arabicTranslation?.name ?? classification.slug;

  // Potential parents (exclude self)
  const parentOptions = classifications.filter((c) => c.id !== classification.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: classification.slug,
      display_order: classification.display_order ?? 0,
      parent_id: classification.parent_id?.toString() ?? undefined,
      translations: defaultTranslations,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      // Update classification
      const { error: updateError } = await supabase
        .from('fatwa_classifications')
        .update({
          slug: values.slug,
          display_order: values.display_order,
          parent_id: values.parent_id ? Number(values.parent_id) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', classification.id);

      if (updateError) {
        toast.error(updateError.message);
        return;
      }

      // Upsert translations
      const translationEntries = Object.entries(values.translations)
        .filter(([_, data]) => data.name.trim() !== '');

      for (const [language, data] of translationEntries) {
        const existing = classification.fatwa_classification_translations.find(
          (tr) => tr.language === language
        );

        if (existing) {
          const { error } = await supabase
            .from('fatwa_classification_translations')
            .update({
              name: data.name.trim(),
              description: data.description?.trim() || null,
              updated_at: new Date().toISOString(),
            })
            .eq('classification_id', classification.id)
            .eq('language', language);

          if (error) {
            toast.error(error.message);
            return;
          }
        } else {
          const { error } = await supabase
            .from('fatwa_classification_translations')
            .insert({
              classification_id: classification.id,
              language,
              name: data.name.trim(),
              description: data.description?.trim() || null,
            });

          if (error) {
            toast.error(error.message);
            return;
          }
        }
      }

      toast.success(t('classificationUpdated'));
      router.refresh();
    } catch (error) {
      toast.error(t('somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);

      // Delete translations first
      await supabase
        .from('fatwa_classification_translations')
        .delete()
        .eq('classification_id', classification.id);

      // Delete classification
      const { error } = await supabase
        .from('fatwa_classifications')
        .delete()
        .eq('id', classification.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(t('classificationDeleted'));
      router.push('/fatwa-classifications');
      router.refresh();
    } catch (error) {
      toast.error(t('somethingWentWrong'));
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
                  <DeleteButton label={t('deleteClassification')} fn={onDelete} />
                  <Button type="submit">{t('saveChanges')}</Button>
                </div>
              </CardHeader>
            </Card>

            {/* SETTINGS */}
            <Card>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
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
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="parent_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('parentClassification')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl className="w-full">
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectParent')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{t('noParent')}</SelectItem>
                          {parentOptions.map((cls) => {
                            const name = cls.fatwa_classification_translations?.find(
                              (tr) => tr.language === 'ar'
                            )?.name ?? cls.slug;
                            return (
                              <SelectItem key={cls.id} value={cls.id.toString()}>
                                {name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
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
                          Required
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

export default FatwaClassificationForm;
