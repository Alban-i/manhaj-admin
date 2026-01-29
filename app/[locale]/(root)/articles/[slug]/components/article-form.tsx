'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Articles,
  ProfilesWithRoles,
  Tags,
  ArticleStatus,
  Language,
} from '@/types/types';
import { Json } from '@/types/types_db';
import { ArticleTranslation } from '@/actions/get-article-translations';
import { IndividualGroupOption } from '@/actions/get-individual-groups-for-select';
import { IndividualOption } from '@/actions/get-individuals-for-select';

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

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

import DeleteButton from '@/components/delete-btn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/providers/supabase/client';
import Editor from '@/components/tiptap/editor';
import { TabToggle } from '@/components/ui/tab-toggle';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Globe, Plus, Star, Link2, Calendar as CalendarIcon, FileEdit, Archive, Check, ChevronsUpDown } from 'lucide-react';
import ImageUpload from '@/components/image-upload';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import arabic from 'react-date-object/calendars/arabic';
import arabic_ar from 'react-date-object/locales/arabic_ar';
import gregorian from 'react-date-object/calendars/gregorian';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { createHijriDateObject, dateObjectToTimestamp } from '@/lib/hijri-utils';
import { UsedMediaCard } from '@/components/media/used-media-card';
import { revalidateArticle, revalidateArticles } from '@/actions/revalidate';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getLanguageWithFlag } from '@/i18n/config';
import { useTranslations } from 'next-intl';

const initialData = {
  title: '',
  summary: '',
  content: '',
  content_json: null,
  slug: '',
  status: 'draft',
  category_id: null,
  author_id: null,
  individual_id: null,
  id: undefined,
  published_at: null,
  is_featured: false,
  image_url: '',
  language: 'ar',
  article_id: null,
  is_original: true,
  event_date_hijri: null,
  event_date_hijri_year: null,
  event_date_gregorian: null,
} as const;

const formSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  slug: z.string().min(1),
  category_id: z.string().optional(),
  author_id: z.string().min(1, 'Author is required'),
  individual_id: z.string().optional(),
  is_featured: z.boolean(),
  is_original: z.boolean(),
  image_url: z.string().optional(),
  language: z.string().min(1, 'Language is required'),
  event_date_hijri: z.string().optional(),
  event_date_hijri_year: z.coerce.number().optional(),
  event_date_gregorian: z.string().optional(),
});

interface TagWithLocalizedName {
  id: number;
  slug: string;
  created_at: string;
  updated_at: string;
  localizedName: string;
}

interface ArticleFormProps {
  article: (Omit<Articles, 'is_published'> & { id?: string; individual_id?: string | null }) | null;
  categories: { id: number; name: string }[];
  tags: TagWithLocalizedName[];
  selectedTagIds: number[];
  selectedTranslatorIds: number[];
  authors: ProfilesWithRoles[];
  languages: Language[];
  translations: ArticleTranslation[];
  individualGroups: IndividualGroupOption[];
  individuals: IndividualOption[];
}

const ArticleForm: React.FC<ArticleFormProps> = ({
  article,
  categories,
  tags,
  selectedTagIds,
  selectedTranslatorIds,
  authors,
  languages,
  translations,
  individualGroups,
  individuals,
}) => {
  const t = useTranslations('articles');
  const defaultValues = article ?? { ...initialData, is_featured: false };
  const [content, setContent] = useState<string>(defaultValues.content ?? '');
  const initialContentRef = useRef<string>(defaultValues.content ?? '');
  const [contentJson, setContentJson] = useState<Json | null>(defaultValues.content_json ?? null);
  const [loading, setLoading] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [selectedTags, setSelectedTags] = useState<number[]>(selectedTagIds);
  const [selectedTranslators, setSelectedTranslators] = useState<number[]>(selectedTranslatorIds);
  const [individualOpen, setIndividualOpen] = useState(false);
  const [translatorOpen, setTranslatorOpen] = useState(false);
  type FormStatus = 'draft' | 'published' | 'archived';
  const [status, setStatus] = useState<FormStatus>(
    (defaultValues.status?.toLowerCase() as FormStatus) ?? 'draft'
  );

  const supabase = createClient();
  const router = useRouter();

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues.title ?? '',
      summary: defaultValues.summary ?? '',
      slug: defaultValues.slug ?? '',
      category_id: defaultValues.category_id?.toString() ?? undefined,
      author_id: defaultValues.author_id?.toString() ?? undefined,
      individual_id: defaultValues.individual_id ?? undefined,
      is_featured: defaultValues.is_featured ?? false,
      is_original: defaultValues.is_original ?? true,
      image_url: defaultValues.image_url ?? '',
      language: defaultValues.language ?? 'ar',
      event_date_hijri: defaultValues.event_date_hijri ?? '',
      event_date_hijri_year: defaultValues.event_date_hijri_year ?? undefined,
      event_date_gregorian: defaultValues.event_date_gregorian ?? '',
    },
  });

  // Get available languages for translation (excluding current article's language)
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

    // Navigate to new article page with translation params
    const params = new URLSearchParams({
      translate_from: defaultValues.id,
      article_id: defaultValues.article_id ?? defaultValues.id,
      language: targetLanguage,
      slug: newSlug,
      category_id: defaultValues.category_id?.toString() ?? '',
    });

    router.push(`/articles/new?${params.toString()}`);
  };

  // Labels
  const toastMessage = defaultValues.id
    ? t('articleUpdated')
    : t('articleCreated');
  const action = defaultValues.id ? t('saveChanges') : t('create');

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      let articleMetadataId = defaultValues.article_id;

      // Shared data that goes to translation_groups
      const sharedData = {
        author_id: values.author_id || null,
        category_id: values.category_id ? Number(values.category_id) : null,
        individual_id: values.individual_id || null,
        image_url: values.image_url || null,
        updated_at: new Date().toISOString(),
      };

      // For new articles without article_id, create a new translation_group
      if (!articleMetadataId) {
        const { data: newGroup, error: groupError } = await supabase
          .from('articles')
          .insert({
            ...sharedData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (groupError) {
          toast.error(t('failedToCreateGroup') + ': ' + groupError.message);
          setLoading(false);
          return;
        }

        articleMetadataId = newGroup.id;
      } else {
        // Update existing translation_group with shared data
        const { error: updateGroupError } = await supabase
          .from('articles')
          .update(sharedData)
          .eq('id', articleMetadataId);

        if (updateGroupError) {
          toast.error(t('failedToUpdateGroup') + ': ' + updateGroupError.message);
          setLoading(false);
          return;
        }
      }

      // Article-specific data
      const articleData = {
        title: values.title,
        summary: values.summary,
        content: content,
        content_json: contentJson, // Store TipTap JSON for React-native rendering
        slug: values.slug,
        status,
        is_featured: values.is_featured,
        is_original: values.is_original,
        language: values.language,
        article_id: articleMetadataId,
        published_at:
          status === 'published' &&
          defaultValues.status?.toLowerCase() !== 'published'
            ? new Date().toISOString()
            : defaultValues.published_at,
        // Keep these for backward compatibility but they're managed via translation_groups now
        category_id: values.category_id ? Number(values.category_id) : null,
        author_id: values.author_id || null,
        image_url: values.image_url || null,
        // Event date fields for timeline support
        event_date_hijri: values.event_date_hijri || null,
        event_date_hijri_year: values.event_date_hijri_year || null,
        event_date_gregorian: values.event_date_gregorian || null,
        ...(defaultValues.id && { id: defaultValues.id }),
      };

      const { data, error } = await supabase
        .from('article_translations')
        .upsert(articleData)
        .select()
        .single();

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      // Calculate tag differences
      const tagsToAdd = selectedTags.filter(
        (tagId) => !selectedTagIds.includes(tagId)
      );
      const tagsToRemove = selectedTagIds.filter(
        (tagId) => !selectedTags.includes(tagId)
      );

      // Update tags in translation_group_tags
      if (tagsToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('article_group_tags')
          .delete()
          .eq('article_id', articleMetadataId)
          .in('tag_id', tagsToRemove);

        if (deleteError) {
          toast.error(t('failedToRemoveTags'));
          console.error('Error removing tags:', deleteError);
        }
      }

      if (tagsToAdd.length > 0) {
        const tagData = tagsToAdd.map((tagId) => ({
          article_id: articleMetadataId,
          tag_id: tagId,
        }));

        const { error: insertError } = await supabase
          .from('article_group_tags')
          .upsert(tagData, { onConflict: 'article_id,tag_id' });

        if (insertError) {
          toast.error(t('failedToAddTags'));
          console.error('Error adding tags:', insertError);
        }
      }

      // Sync translators for article (article-level, not translation_group)
      const translatorsToAdd = selectedTranslators.filter(
        (id) => !selectedTranslatorIds.includes(id)
      );
      const translatorsToRemove = selectedTranslatorIds.filter(
        (id) => !selectedTranslators.includes(id)
      );

      if (translatorsToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('article_translators')
          .delete()
          .eq('article_id', data.id)
          .in('individual_id', translatorsToRemove);

        if (deleteError) {
          toast.error(t('failedToRemoveTranslators'));
          console.error('Error removing translators:', deleteError);
        }
      }

      if (translatorsToAdd.length > 0) {
        const translatorData = translatorsToAdd.map((individualId, index) => ({
          article_id: data.id,
          individual_id: individualId,
          display_order: selectedTranslators.indexOf(individualId),
        }));

        const { error: insertError } = await supabase
          .from('article_translators')
          .upsert(translatorData, { onConflict: 'article_id,individual_id' });

        if (insertError) {
          toast.error(t('failedToAddTranslators'));
          console.error('Error adding translators:', insertError);
        }
      }

      form.reset({
        title: data.title ?? '',
        summary: data.summary ?? '',
        slug: data.slug ?? '',
        category_id: values.category_id ?? undefined,
        author_id: values.author_id ?? undefined,
        individual_id: values.individual_id ?? undefined,
        is_featured: data.is_featured ?? false,
        is_original: data.is_original ?? true,
        image_url: values.image_url ?? '',
        language: data.language ?? 'ar',
        event_date_hijri: data.event_date_hijri ?? '',
        event_date_hijri_year: data.event_date_hijri_year ?? undefined,
        event_date_gregorian: data.event_date_gregorian ?? '',
      });
      initialContentRef.current = content;

      toast.success(toastMessage);

      // Revalidate frontend cache
      await revalidateArticle(data.slug);

      if (!defaultValues.id) {
        router.push(`/articles/${data.slug}`);
        return; // Exit early - the new page will load fresh
      }

      // Redirect if slug changed, otherwise just refresh
      if (defaultValues.slug !== data.slug) {
        router.push(`/articles/${data.slug}`);
        return;
      }

      router.refresh();
    } catch (err) {
      toast.error(t('somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!defaultValues.id) {
      toast.error(t('articleNotFound'));
      return;
    }

    try {
      const { error } = await supabase
        .from('article_translations')
        .delete()
        .eq('id', defaultValues.id);

      if (error) {
        toast.error(error.message);
        setLoading(false);
      }

      toast.success(t('articleDeleted'));

      // Revalidate frontend cache
      await revalidateArticles();

      router.push('/articles');

      form.reset();
      router.refresh();
    } catch (error) {
      toast.error(t('deleteError'));
    }
  };

  const generateSummary = async () => {
    if (!content) {
      toast.error(t('addContentFirst'));
      return;
    }

    try {
      setIsGeneratingSummary(true);
      const response = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate summary');
      }

      const data = await response.json();
      form.setValue('summary', data.summary);
      toast.success(t('summaryGenerated'));
    } catch (error) {
      toast.error(t('summaryFailed'));
      console.error('Error generating summary:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <div className="p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
          <fieldset
            disabled={loading}
            className="grid @3xl:grid-cols-[2fr_1fr] gap-4"
          >
            {/* Left Column */}
            <div className="space-y-4">
              {/* HEADER */}
              <Card>
                <CardHeader className="grid grid-cols-[1fr_auto] items-center gap-4">
                  <CardTitle>
                    {defaultValues.id ? defaultValues.title : 'New article'}
                  </CardTitle>
                  <div className="flex gap-2">
                    {defaultValues.id && (
                      <DeleteButton label="Delete Article" fn={onDelete} />
                    )}
                    <Button type="submit">{action}</Button>
                  </div>
                </CardHeader>
              </Card>

              {/* SUMMARY */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{t('summary')}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateSummary}
                      disabled={isGeneratingSummary}
                    >
                      {isGeneratingSummary ? (
                        t('generating')
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          {t('generateWithAI')}
                        </>
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder={t('summaryPlaceholder')}
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* EVENT DATE - For Timeline Support */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {t('eventDate')}
                  </CardTitle>
                  <CardDescription>
                    {t('eventDateDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-2 gap-y-4">
                  {/* Hijri Date Picker */}
                  <FormField
                    control={form.control}
                    name="event_date_hijri"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('hijriDate')}</FormLabel>
                        <FormControl>
                          <DatePicker
                            calendar={arabic}
                            locale={arabic_ar}
                            value={createHijriDateObject(field.value)}
                            onChange={(date: DateObject | null) => {
                              if (date) {
                                // Store as Unix timestamp (ms) for reliable parsing
                                field.onChange(dateObjectToTimestamp(date));
                                // Also set the hijri year for sorting
                                form.setValue('event_date_hijri_year', date.year);

                                // Convert to Gregorian and sync
                                const gregorianDate = new DateObject(date).convert(gregorian, gregorian_en);
                                form.setValue('event_date_gregorian', gregorianDate.format('YYYY-MM-DD'));
                              } else {
                                field.onChange('');
                                form.setValue('event_date_hijri_year', undefined);
                                form.setValue('event_date_gregorian', '');
                              }
                            }}
                            format="D MMMM YYYY"
                            placeholder={t('selectHijriDate')}
                            containerClassName="w-full"
                            inputClass="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                          />
                        </FormControl>
                        <FormDescription>
                          {t('hijriDateDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Gregorian Date Picker */}
                  <FormField
                    control={form.control}
                    name="event_date_gregorian"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('gregorianDate')}</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value || ''}
                            onChange={(e) => {
                              const selectedDate = e.target.value ? new Date(e.target.value) : null;
                              if (selectedDate) {
                                // Format as YYYY-MM-DD for database
                                field.onChange(format(selectedDate, 'yyyy-MM-dd'));

                                // Convert to Hijri and sync (store as timestamp)
                                const hijriDate = new DateObject(selectedDate).convert(arabic, arabic_ar);
                                form.setValue('event_date_hijri', dateObjectToTimestamp(hijriDate));
                                form.setValue('event_date_hijri_year', hijriDate.year);
                              } else {
                                field.onChange('');
                                form.setValue('event_date_hijri', '');
                                form.setValue('event_date_hijri_year', undefined);
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('gregorianDateDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* USED MEDIA */}
              <UsedMediaCard
                articleId={defaultValues.id}
                onMediaRemoved={() => {
                  // Refresh can be added here if needed
                }}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* SHARED DATA */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    {t('sharedData')}
                  </CardTitle>
                  <CardDescription>
                    {t('sharedDataDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Author */}
                  <FormField
                    control={form.control}
                    name="author_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          {t('author')}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl className="w-full">
                            <SelectTrigger>
                              <SelectValue placeholder={t('selectAuthor')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {authors.map((author) => (
                              <SelectItem key={author.id} value={author.id}>
                                {author.username || author.email || author.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Individual */}
                  <FormField
                    control={form.control}
                    name="individual_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t('individual')}</FormLabel>
                        <Popover open={individualOpen} onOpenChange={setIndividualOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? individualGroups.find((g) => g.id === field.value)?.name
                                  : t('selectIndividual')}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder={t('searchIndividual')} />
                              <CommandList>
                                <CommandEmpty>{t('noIndividualFound')}</CommandEmpty>
                                <CommandGroup>
                                  {individualGroups.map((group) => (
                                    <CommandItem
                                      key={group.id}
                                      value={group.name}
                                      onSelect={() => {
                                        field.onChange(group.id);
                                        setIndividualOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === group.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {group.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('category')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl className="w-full">
                            <SelectTrigger>
                              <SelectValue placeholder={t('selectCategory')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Tags */}
                  <div className="space-y-2">
                    <FormLabel>{t('tags')}</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Button
                          key={tag.id}
                          variant={
                            selectedTags.includes(tag.id) ? 'default' : 'outline'
                          }
                          size="sm"
                          className="rounded-full"
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                        >
                          {tag.localizedName}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Cover Image */}
                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('coverImage')}</FormLabel>
                        <FormDescription>
                          {t('coverImageSize')}
                        </FormDescription>
                        <FormControl>
                          <ImageUpload
                            disabled={loading}
                            value={field.value ? [field.value] : []}
                            onChange={(url: string) => field.onChange(url)}
                            onRemove={() => field.onChange('')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* TRANSLATIONS - Full Width */}
            {defaultValues.id && (
              <Card className="@3xl:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {t('translations')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid @xl:grid-cols-[1fr_auto] gap-4 items-start">
                    {/* Left column - Translations */}
                    <div className="space-y-4">
                      {/* Existing translations */}
                      {translations.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">{t('availableTranslations')}</span>
                          <div className="flex flex-wrap items-center gap-2 p-3 rounded-md border bg-muted/50">
                            {translations.map((translation) => {
                              const lang = languages.find(
                                (l) => l.code === translation.language
                              );
                              const isCurrent = translation.id === defaultValues.id;
                              const displayName = getLanguageWithFlag(
                                translation.language,
                                lang?.native_name || translation.language.toUpperCase()
                              );
                              return isCurrent ? (
                                <Badge
                                  key={translation.id}
                                  variant="default"
                                  className="text-xs gap-1 cursor-default py-1.5 px-3"
                                >
                                  {translation.is_original && <Star className="h-3 w-3 fill-current" />}
                                  {displayName}
                                </Badge>
                              ) : (
                                <Link key={translation.id} href={`/articles/${translation.slug}`}>
                                  <Badge
                                    variant="outline"
                                    className="text-xs gap-1 cursor-pointer hover:bg-background py-1.5 px-3"
                                  >
                                    {translation.is_original && <Star className="h-3 w-3 fill-current" />}
                                    {displayName}
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
                          <span className="text-sm text-muted-foreground">{t('addTranslation')}</span>
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
                                {getLanguageWithFlag(lang.code, lang.native_name)}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {translations.length === 0 &&
                        availableLanguagesForTranslation.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            {t('noTranslationsAvailable')}
                          </p>
                        )}
                    </div>

                    {/* Right column - Mark as original */}
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">{t('originalStatus')}</span>
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
                              <FormLabel>{t('markAsOriginal')}</FormLabel>
                              <FormDescription>
                                {t('sourceArticle')}
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

            {/* ARTICLE DETAILS - Full Width */}
            <Card className="@3xl:col-span-2">
              <CardHeader>
                <CardTitle>{t('articleDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title - Full Width & Prominent */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">{t('titleLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('titlePlaceholder')}
                          className="text-2xl @lg:text-3xl font-bold h-14 @lg:h-16"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Other Details - Grid */}
                <div className="grid @lg:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('slug')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('slugPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel className="mb-2">{t('status')}</FormLabel>
                    <TabToggle
                      state={status}
                      setState={(value) => setStatus(value as FormStatus)}
                      picklist={[
                        { value: 'draft', label: <span className="flex items-center gap-1.5"><FileEdit className="h-3.5 w-3.5" />{t('statusDraft')}</span> },
                        { value: 'published', label: <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />{t('statusPublished')}</span> },
                        { value: 'archived', label: <span className="flex items-center gap-1.5"><Archive className="h-3.5 w-3.5" />{t('statusArchived')}</span> },
                      ]}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          {t('language')}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl className="w-full">
                            <SelectTrigger>
                              <SelectValue placeholder={t('selectLanguage')} />
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

                  <FormField
                    control={form.control}
                    name="is_featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0 border rounded-md p-2 h-fit self-end">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{t('featureArticle')}</FormLabel>
                          <FormDescription>
                            {t('displayedOnHomePage')}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Translators */}
                <div className="space-y-2">
                  <FormLabel>{t('translators')}</FormLabel>
                  <FormDescription>
                    {t('translatorsDescription')}
                  </FormDescription>
                  <Popover open={translatorOpen} onOpenChange={setTranslatorOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          selectedTranslators.length === 0 && "text-muted-foreground"
                        )}
                      >
                        {selectedTranslators.length > 0
                          ? `${selectedTranslators.length} ${t('translatorsSelected')}`
                          : t('selectTranslators')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder={t('searchTranslator')} />
                        <CommandList>
                          <CommandEmpty>{t('noTranslatorFound')}</CommandEmpty>
                          <CommandGroup>
                            {individuals.map((individual) => (
                              <CommandItem
                                key={individual.id}
                                value={individual.name}
                                onSelect={() => {
                                  setSelectedTranslators((prev) =>
                                    prev.includes(individual.id)
                                      ? prev.filter((id) => id !== individual.id)
                                      : [...prev, individual.id]
                                  );
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedTranslators.includes(individual.id)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {individual.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedTranslators.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedTranslators.map((translatorId) => {
                        const translator = individuals.find((i) => i.id === translatorId);
                        return translator ? (
                          <Badge
                            key={translatorId}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() =>
                              setSelectedTranslators((prev) =>
                                prev.filter((id) => id !== translatorId)
                              )
                            }
                          >
                            {translator.name}
                            <span className="ml-1 text-muted-foreground hover:text-foreground">×</span>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Full Width Content Card */}
            <Card className="@3xl:col-span-2">
              <CardHeader>
                <CardTitle>{t('content')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Editor
                  content={content}
                  onChange={(html, json) => {
                    setContent(html);
                    if (json) setContentJson(json as Json);
                  }}
                  articleId={defaultValues.id}
                />
              </CardContent>
            </Card>
          </fieldset>

          {/* Sticky Bottom Action Bar - appears when form is dirty */}
          {(form.formState.isDirty || content !== initialContentRef.current) && (
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card">
              <div className="flex h-14 items-center justify-end gap-4 px-4 md:px-6">
                <span className="text-sm text-muted-foreground mr-auto">
                  {t('unsavedChanges')}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.reset();
                    setContent(initialContentRef.current);
                  }}
                  disabled={loading}
                >
                  {t('discard')}
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? t('saving') : action}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default ArticleForm;
