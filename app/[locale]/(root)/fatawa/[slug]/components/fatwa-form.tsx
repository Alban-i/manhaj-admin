'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  ProfilesWithRoles,
  Tags,
  FatwaStatus,
  FatwaClassificationWithTranslations,
  Language,
} from '@/types/types';
import { Json } from '@/types/types_db';
import { FatwaTranslationEntry } from '@/actions/get-fatwa-translations';
import { IndividualGroupOption } from '@/actions/get-individual-groups-for-select';

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
import { Globe, Plus, Star, Link2, FileEdit, Archive, Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { revalidateFatwa, revalidateFatawa } from '@/actions/revalidate';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ClassificationPickerDialog } from './classification-picker-dialog';
import { getLanguageWithFlag } from '@/i18n/config';
import { useTranslations } from 'next-intl';

interface FatwaData {
  id?: string;
  title: string;
  slug: string;
  summary: string | null;
  question: string;
  question_json: Json | null;
  answer: string;
  answer_json: Json | null;
  status: string;
  language: string;
  fatwa_id: string | null;
  is_original: boolean;
  published_at: string | null;
  classification_id: number | null;
  author_id: string | null;
  individual_id: string | null;
  source: string | null;
  source_url: string | null;
  media_id: string | null;
}

const initialData: FatwaData = {
  title: '',
  summary: '',
  question: '',
  question_json: null,
  answer: '',
  answer_json: null,
  slug: '',
  status: 'draft',
  classification_id: null,
  author_id: null,
  individual_id: null,
  source: null,
  source_url: null,
  media_id: null,
  id: undefined,
  published_at: null,
  language: 'ar',
  fatwa_id: null,
  is_original: true,
};

const formSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().optional(),
  classification_id: z.string().optional(),
  author_id: z.string().min(1, 'Author is required'),
  individual_id: z.string().optional(),
  source: z.string().optional(),
  source_url: z.string().optional(),
  is_original: z.boolean(),
  language: z.string().min(1, 'Language is required'),
});

interface TagWithLocalizedName {
  id: number;
  slug: string;
  created_at: string;
  updated_at: string;
  localizedName: string;
}

interface FatwaFormProps {
  fatwa: FatwaData | null;
  classifications: FatwaClassificationWithTranslations[];
  tags: TagWithLocalizedName[];
  selectedTagIds: number[];
  authors: ProfilesWithRoles[];
  languages: Language[];
  translations: FatwaTranslationEntry[];
  individualGroups: IndividualGroupOption[];
}

const FatwaForm: React.FC<FatwaFormProps> = ({
  fatwa,
  classifications,
  tags,
  selectedTagIds,
  authors,
  languages,
  translations,
  individualGroups,
}) => {
  const t = useTranslations('fatawa');
  const defaultValues = fatwa ?? initialData;
  const [question, setQuestion] = useState<string>(defaultValues.question ?? '');
  const initialQuestionRef = useRef<string>(defaultValues.question ?? '');
  const [questionJson, setQuestionJson] = useState<Json | null>(defaultValues.question_json ?? null);
  const [answer, setAnswer] = useState<string>(defaultValues.answer ?? '');
  const initialAnswerRef = useRef<string>(defaultValues.answer ?? '');
  const [answerJson, setAnswerJson] = useState<Json | null>(defaultValues.answer_json ?? null);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<number[]>(selectedTagIds);
  const [individualOpen, setIndividualOpen] = useState(false);
  const [status, setStatus] = useState<FatwaStatus>(
    (defaultValues.status?.toLowerCase() as FatwaStatus) ?? 'draft'
  );
  const [embeddingStatus, setEmbeddingStatus] = useState<'idle' | 'generating' | 'success' | 'error'>(
    'embedding' in defaultValues && (defaultValues as unknown as { embedding: string | null }).embedding
      ? 'success'
      : 'idle'
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
      classification_id: defaultValues.classification_id?.toString() ?? undefined,
      author_id: defaultValues.author_id?.toString() ?? undefined,
      individual_id: defaultValues.individual_id ?? undefined,
      source: defaultValues.source ?? '',
      source_url: defaultValues.source_url ?? '',
      is_original: defaultValues.is_original ?? true,
      language: defaultValues.language ?? 'ar',
    },
  });

  // Available languages for translation
  const availableLanguagesForTranslation = languages.filter(
    (lang) => !translations.some((t) => t.language === lang.code)
  );

  // Create translation
  const createTranslation = (targetLanguage: string) => {
    const targetLang = languages.find((l) => l.code === targetLanguage);
    if (!targetLang || !defaultValues.id) return;

    const baseSlug = defaultValues.slug ?? '';
    const newSlug = `${baseSlug}-${targetLanguage}`;

    const params = new URLSearchParams({
      translate_from: defaultValues.id,
      fatwa_id: defaultValues.fatwa_id ?? defaultValues.id,
      language: targetLanguage,
      slug: newSlug,
    });

    router.push(`/fatawa/new?${params.toString()}`);
  };

  // Labels
  const toastMessage = defaultValues.id ? t('fatwaUpdated') : t('fatwaCreated');
  const action = defaultValues.id ? t('saveChanges') : t('create');

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      let fatwaMetadataId = defaultValues.fatwa_id;

      // Shared data for fatawa table
      const sharedData = {
        author_id: values.author_id || null,
        classification_id: values.classification_id ? Number(values.classification_id) : null,
        individual_id: values.individual_id || null,
        source: values.source || null,
        source_url: values.source_url || null,
        updated_at: new Date().toISOString(),
      };

      // Create or update fatawa metadata
      if (!fatwaMetadataId) {
        const { data: newFatwa, error: fatwaError } = await supabase
          .from('fatawa')
          .insert({
            ...sharedData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (fatwaError) {
          toast.error(t('failedToCreateFatwa') + ': ' + fatwaError.message);
          setLoading(false);
          return;
        }

        fatwaMetadataId = newFatwa.id;
      } else {
        const { error: updateError } = await supabase
          .from('fatawa')
          .update(sharedData)
          .eq('id', fatwaMetadataId);

        if (updateError) {
          toast.error(t('failedToUpdateFatwa') + ': ' + updateError.message);
          setLoading(false);
          return;
        }
      }

      // Fatwa translation data
      const fatwaTranslationData = {
        title: values.title,
        slug: values.slug,
        summary: values.summary || null,
        question,
        question_json: questionJson,
        answer,
        answer_json: answerJson,
        status,
        is_original: values.is_original,
        language: values.language,
        fatwa_id: fatwaMetadataId,
        published_at:
          status === 'published' &&
          defaultValues.status?.toLowerCase() !== 'published'
            ? new Date().toISOString()
            : defaultValues.published_at,
        ...(defaultValues.id && { id: defaultValues.id }),
      };

      const { data, error } = await supabase
        .from('fatwa_translations')
        .upsert(fatwaTranslationData)
        .select()
        .single();

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      // Sync tags (fatwa_tags uses fatwa_id referencing fatwa_translations.id)
      const tagsToAdd = selectedTags.filter(
        (tagId) => !selectedTagIds.includes(tagId)
      );
      const tagsToRemove = selectedTagIds.filter(
        (tagId) => !selectedTags.includes(tagId)
      );

      if (tagsToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('fatwa_tags')
          .delete()
          .eq('fatwa_id', data.id)
          .in('tag_id', tagsToRemove);

        if (deleteError) {
          toast.error(t('failedToRemoveTags'));
        }
      }

      if (tagsToAdd.length > 0) {
        const tagData = tagsToAdd.map((tagId) => ({
          fatwa_id: data.id,
          tag_id: tagId,
        }));

        const { error: insertError } = await supabase
          .from('fatwa_tags')
          .upsert(tagData, { onConflict: 'fatwa_id,tag_id' });

        if (insertError) {
          toast.error(t('failedToAddTags'));
        }
      }

      form.reset({
        title: data.title ?? '',
        summary: data.summary ?? '',
        slug: data.slug ?? '',
        classification_id: values.classification_id ?? undefined,
        author_id: values.author_id ?? undefined,
        individual_id: values.individual_id ?? undefined,
        source: values.source ?? '',
        source_url: values.source_url ?? '',
        is_original: data.is_original ?? true,
        language: data.language ?? 'ar',
      });
      initialQuestionRef.current = question;
      initialAnswerRef.current = answer;

      toast.success(toastMessage);

      // Generate embedding for semantic search (non-blocking)
      setEmbeddingStatus('generating');
      supabase.functions
        .invoke('embeddings', {
          body: { action: 'generate_fatwa', fatwa_id: data.id },
        })
        .then((res) => {
          if (res.error || !res.data?.success) {
            setEmbeddingStatus('error');
          } else {
            setEmbeddingStatus('success');
          }
        })
        .catch(() => setEmbeddingStatus('error'));

      await revalidateFatwa(data.slug);

      if (!defaultValues.id) {
        router.push(`/fatawa/${data.slug}`);
        return;
      }

      if (defaultValues.slug !== data.slug) {
        router.push(`/fatawa/${data.slug}`);
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
      toast.error(t('fatwaNotFound'));
      return;
    }

    try {
      const { error } = await supabase
        .from('fatwa_translations')
        .delete()
        .eq('id', defaultValues.id);

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      toast.success(t('fatwaDeleted'));
      await revalidateFatawa();
      router.push('/fatawa');
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error(t('deleteError'));
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const isDirty = form.formState.isDirty ||
    question !== initialQuestionRef.current ||
    answer !== initialAnswerRef.current;

  return (
    <div className="p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
          <fieldset
            disabled={loading}
            className="grid @3xl:grid-cols-[2fr_1fr] gap-4"
          >
            {/* HEADER */}
            <Card>
              <CardHeader className="grid grid-cols-[1fr_auto] items-center gap-4">
                <CardTitle>
                  {defaultValues.id ? defaultValues.title : t('newFatwa')}
                </CardTitle>
                <div className="flex gap-2">
                  {defaultValues.id && (
                    <DeleteButton label={t('deleteFatwa')} fn={onDelete} />
                  )}
                  <Button type="submit">{action}</Button>
                </div>
              </CardHeader>
            </Card>

            {/* SHARED DATA - Right Column */}
            <Card className="@3xl:row-span-2">
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

                {/* Individual (Scholar) */}
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

                {/* Classification */}
                <FormField
                  control={form.control}
                  name="classification_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('classification')}</FormLabel>
                      <FormControl>
                        <ClassificationPickerDialog
                          classifications={classifications}
                          value={field.value}
                          onSelect={field.onChange}
                          placeholder={t('selectClassification')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Source */}
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('source')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('sourcePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Source URL */}
                <FormField
                  control={form.control}
                  name="source_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sourceUrl')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('sourceUrlPlaceholder')} {...field} />
                      </FormControl>
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

                {/* Embedding status */}
                {embeddingStatus !== 'idle' && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Indexation</span>
                      {embeddingStatus === 'generating' && (
                        <Badge variant="secondary" className="gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Indexation...
                        </Badge>
                      )}
                      {embeddingStatus === 'success' && (
                        <Badge variant="default" className="gap-1">
                          <Check className="h-3 w-3" />
                          Indexé
                        </Badge>
                      )}
                      {embeddingStatus === 'error' && (
                        <Badge variant="destructive" className="gap-1">
                          <X className="h-3 w-3" />
                          Erreur
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* FATWA DETAILS */}
            <Card>
              <CardHeader>
                <CardTitle>{t('fatwaDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
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
                      setState={(value) => setStatus(value as FatwaStatus)}
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
                </div>
              </CardContent>
            </Card>

            {/* SUMMARY - Full Width, only visible when Q&A have content */}
            {(question.replace(/<[^>]*>/g, '').trim() || answer.replace(/<[^>]*>/g, '').trim()) && (
              <Card className="@3xl:col-span-2">
                <CardHeader>
                  <CardTitle>{t('summary')}</CardTitle>
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
            )}

            {/* QUESTION - Full Width */}
            <Card className="@3xl:col-span-2">
              <CardHeader>
                <CardTitle>{t('question')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Editor
                  content={question}
                  onChange={(html, json) => {
                    setQuestion(html);
                    if (json) setQuestionJson(json as Json);
                  }}
                />
              </CardContent>
            </Card>

            {/* ANSWER - Full Width */}
            <Card className="@3xl:col-span-2">
              <CardHeader>
                <CardTitle>{t('answer')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Editor
                  content={answer}
                  onChange={(html, json) => {
                    setAnswer(html);
                    if (json) setAnswerJson(json as Json);
                  }}
                />
              </CardContent>
            </Card>

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
                    <div className="space-y-4">
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
                                <Link key={translation.id} href={`/fatawa/${translation.slug}`}>
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
                                {t('sourceFatwa')}
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
          </fieldset>

          {/* Sticky Bottom Action Bar */}
          {isDirty && (
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
                    setQuestion(initialQuestionRef.current);
                    setAnswer(initialAnswerRef.current);
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

export default FatwaForm;
