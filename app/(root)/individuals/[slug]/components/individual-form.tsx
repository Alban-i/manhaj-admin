'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import DeleteButton from '@/components/delete-btn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/providers/supabase/client';
import Editor from '@/components/tiptap/editor';
import { revalidateIndividual, revalidateIndividuals } from '@/actions/revalidate';
import { TabToggle } from '@/components/ui/tab-toggle';
import { IndividualWithType } from '@/actions/get-individual';
import { IndividualTranslation } from '@/actions/get-individual-translations';
import { Language } from '@/types/types';
import { Globe, Plus, Star, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

interface Type {
  id: number;
  name: string;
}

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase, contain only letters, numbers, and hyphens, and cannot start or end with a hyphen'
    ),
  type_id: z.string().optional(),
  original_name: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  ranking: z.enum(['recommended', 'not recommended']),
  language: z.string().min(1, 'Language is required'),
  is_original: z.boolean(),
});

interface IndividualFormProps {
  individual: (Omit<IndividualWithType, 'id'> & {
    id?: number;
    language?: string;
    translation_group_id?: string | null;
    is_original?: boolean;
  }) | null;
  types: Type[];
  languages: Language[];
  translations: IndividualTranslation[];
}

const IndividualForm: React.FC<IndividualFormProps> = ({
  individual,
  types,
  languages,
  translations,
}) => {
  const router = useRouter();
  const supabase = createClient();
  const [description, setDescription] = useState<string>(
    individual?.description ?? ''
  );
  const [descriptionJson, setDescriptionJson] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const defaultValues = {
    name: individual?.name ?? '',
    slug: individual?.slug ?? '',
    type_id: individual?.type_id?.toString() ?? 'none',
    original_name: individual?.original_name ?? '',
    status: (individual?.status as 'draft' | 'published' | 'archived') ?? 'draft',
    ranking: (individual?.ranking as 'recommended' | 'not recommended') ?? 'not recommended',
    language: individual?.language ?? 'ar',
    is_original: individual?.is_original ?? true,
    id: individual?.id,
    translation_group_id: individual?.translation_group_id ?? null,
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues.name,
      slug: defaultValues.slug,
      type_id: defaultValues.type_id,
      original_name: defaultValues.original_name,
      status: defaultValues.status,
      ranking: defaultValues.ranking,
      language: defaultValues.language,
      is_original: defaultValues.is_original,
    },
  });

  // Get available languages for translation (excluding current individual's language)
  const availableLanguagesForTranslation = languages.filter(
    (lang) => !translations.some((t) => t.language === lang.code)
  );

  // Create translation function
  const createTranslation = (targetLanguage: string) => {
    const targetLang = languages.find((l) => l.code === targetLanguage);
    if (!targetLang || !defaultValues.id) return;

    // Generate slug with language suffix
    const baseSlug = defaultValues.slug ?? '';
    const newSlug = `${baseSlug}-${targetLanguage}`;

    // Navigate to new individual page with translation params
    const params = new URLSearchParams({
      translate_from: defaultValues.id.toString(),
      translation_group_id: defaultValues.translation_group_id ?? '',
      language: targetLanguage,
      slug: newSlug,
    });

    router.push(`/individuals/new?${params.toString()}`);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      let translationGroupId = defaultValues.translation_group_id;

      // Shared data that goes to individual_translation_groups
      const sharedData = {
        type_id: values.type_id && values.type_id !== 'none' ? parseInt(values.type_id) : null,
        original_name: values.original_name || null,
        ranking: values.ranking,
        updated_at: new Date().toISOString(),
      };

      // For new individuals without translation_group_id, create a new translation_group
      if (!translationGroupId) {
        const { data: newGroup, error: groupError } = await supabase
          .from('individual_translation_groups')
          .insert({
            ...sharedData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (groupError) {
          toast.error('Failed to create translation group: ' + groupError.message);
          setLoading(false);
          return;
        }

        translationGroupId = newGroup.id;
      } else {
        // Update existing translation_group with shared data
        const { error: updateGroupError } = await supabase
          .from('individual_translation_groups')
          .update(sharedData)
          .eq('id', translationGroupId);

        if (updateGroupError) {
          toast.error('Failed to update translation group: ' + updateGroupError.message);
          setLoading(false);
          return;
        }
      }

      // Individual-specific data
      const individualData = {
        name: values.name,
        slug: values.slug,
        description: description || null,
        description_json: descriptionJson,
        status: values.status,
        language: values.language,
        is_original: values.is_original,
        translation_group_id: translationGroupId,
        // Keep these for backward compatibility but they're managed via translation_groups now
        type_id: values.type_id && values.type_id !== 'none' ? parseInt(values.type_id) : null,
        original_name: values.original_name || null,
        ranking: values.ranking,
        ...(defaultValues.id && { id: defaultValues.id }),
      };

      const { data, error } = await supabase
        .from('individuals')
        .upsert(individualData)
        .select()
        .single();

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      toast.success(defaultValues.id ? 'Individual updated.' : 'Individual created.');

      // Revalidate frontend cache
      await revalidateIndividual(data.slug);

      if (!defaultValues.id) {
        router.push(`/individuals/${data.slug}`);
        return; // Exit early - the new page will load fresh
      }

      router.refresh();
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      if (!defaultValues.id) return;

      const { error } = await supabase
        .from('individuals')
        .delete()
        .eq('id', defaultValues.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Individual deleted.');

      // Revalidate frontend cache
      await revalidateIndividuals();

      router.push('/individuals');
      router.refresh();
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  return (
    <div className="p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <fieldset
            disabled={loading}
            className="grid md:grid-cols-[2fr_1fr] gap-4"
          >
            {/* Left Column */}
            <div className="space-y-4">
              {/* HEADER */}
              <Card>
                <CardHeader className="grid grid-cols-[1fr_auto] items-center gap-4">
                  <CardTitle>
                    {defaultValues.id ? defaultValues.name : 'New Individual'}
                  </CardTitle>
                  <div className="flex gap-2">
                    {defaultValues.id && (
                      <DeleteButton label="Delete Individual" fn={onDelete} />
                    )}
                    <Button type="submit">
                      {defaultValues.id ? 'Save changes' : 'Create'}
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* DETAILS */}
              <Card>
                <CardHeader>
                  <CardTitle>Individual Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-2 gap-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="individual-slug" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status Field */}
                  <div className="">
                    <FormLabel className="mb-2">Status</FormLabel>
                    <TabToggle
                      state={form.watch('status')}
                      setState={(value) => form.setValue('status', value as 'draft' | 'published' | 'archived')}
                      picklist={[
                        { value: 'draft', label: 'Draft' },
                        { value: 'published', label: 'Published' },
                        { value: 'archived', label: 'Archived' },
                      ]}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          Language
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl className="w-full">
                            <SelectTrigger>
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang.code} value={lang.code}>
                                <span className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  {lang.native_name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* SHARED DATA */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    Shared Data
                  </CardTitle>
                  <CardDescription>
                    Changes apply to all translations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Type */}
                  <FormField
                    control={form.control}
                    name="type_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl className="w-full">
                            <SelectTrigger>
                              <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No type</SelectItem>
                            {types.map((type) => (
                              <SelectItem
                                key={type.id}
                                value={type.id.toString()}
                              >
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Original Name Field */}
                  <FormField
                    control={form.control}
                    name="original_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Original Name</FormLabel>
                        <FormDescription>
                          e.g. Arabic name
                        </FormDescription>
                        <FormControl>
                          <Input
                            placeholder="الاسم بالعربية"
                            dir="rtl"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Ranking Field */}
                  <div className="">
                    <FormLabel className="mb-2">Ranking</FormLabel>
                    <TabToggle
                      state={form.watch('ranking')}
                      setState={(value) => form.setValue('ranking', value as 'recommended' | 'not recommended')}
                      picklist={[
                        { value: 'recommended', label: 'Recommended' },
                        { value: 'not recommended', label: 'Not Recommended' },
                      ]}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* TRANSLATIONS - Full Width */}
            {defaultValues.id && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Translations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-[1fr_auto] gap-4 items-start">
                    {/* Left column - Translations */}
                    <div className="space-y-4">
                      {/* Existing translations */}
                      {translations.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">Available translations:</span>
                          <div className="flex flex-wrap items-center gap-2 p-3 rounded-md border bg-muted/50">
                            {translations.map((translation) => {
                              const lang = languages.find(
                                (l) => l.code === translation.language
                              );
                              const isCurrent = translation.id === defaultValues.id;
                              return isCurrent ? (
                                <Badge
                                  key={translation.id}
                                  variant="default"
                                  className="text-xs gap-1 cursor-default py-1.5 px-3"
                                >
                                  {translation.is_original && <Star className="h-3 w-3 fill-current" />}
                                  {lang?.native_name || translation.language.toUpperCase()}
                                </Badge>
                              ) : (
                                <Link key={translation.id} href={`/individuals/${translation.slug}`}>
                                  <Badge
                                    variant="outline"
                                    className="text-xs gap-1 cursor-pointer hover:bg-background py-1.5 px-3"
                                  >
                                    {translation.is_original && <Star className="h-3 w-3 fill-current" />}
                                    {lang?.native_name || translation.language.toUpperCase()}
                                  </Badge>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Create new translation */}
                      {availableLanguagesForTranslation.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">Add translation:</span>
                          <div className="flex flex-wrap items-center gap-2">
                            {availableLanguagesForTranslation.map((lang) => (
                              <Button
                                key={lang.code}
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={() => createTranslation(lang.code)}
                                className="gap-1 h-8"
                              >
                                <Plus className="h-3 w-3" />
                                {lang.native_name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {translations.length === 0 &&
                        availableLanguagesForTranslation.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No translations available.
                          </p>
                        )}
                    </div>

                    {/* Right column - Mark as original */}
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Original status:</span>
                      <FormField
                        control={form.control}
                        name="is_original"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0 border rounded-md p-3 bg-muted/50">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Mark as original</FormLabel>
                              <FormDescription>
                                Source individual for translations
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* DESCRIPTION - Full Width */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <Editor
                  content={description}
                  onChange={(html, json) => {
                    setDescription(html);
                    if (json) setDescriptionJson(json);
                  }}
                />
              </CardContent>
            </Card>
          </fieldset>
        </form>
      </Form>
    </div>
  );
};

export default IndividualForm;
