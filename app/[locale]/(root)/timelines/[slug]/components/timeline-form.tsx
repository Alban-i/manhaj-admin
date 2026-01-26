'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Timeline, Language, ProfilesWithRoles } from '@/types/types';
import { ArticleForTimeline } from '@/actions/get-articles-for-timeline';
import { TimelineEvent } from '@/types/timeline';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TabToggle } from '@/components/ui/tab-toggle';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Globe, Eye, Star, Plus, FileEdit, Archive } from 'lucide-react';
import ImageUpload from '@/components/image-upload';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FormDescription } from '@/components/ui/form';
import { getLanguageWithFlag } from '@/i18n/config';
import { TimelineTranslation } from '@/actions/get-timeline-translations';
import {
  upsertTimeline,
  deleteTimeline,
} from '@/actions/upsert-timeline';
import ArticleSelector from './article-selector';
import Link from 'next/link';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  image_url: z.string().optional(),
  language: z.string().min(1, 'Language is required'),
  category_id: z.string().optional(),
  is_original: z.boolean(),
});

interface TimelineFormProps {
  timeline: (Omit<Timeline, 'id'> & { id?: string; is_original?: boolean }) | null;
  languages: Language[];
  availableArticles: ArticleForTimeline[];
  timelineEvents: TimelineEvent[];
  categories: { id: number; name: string }[];
  authors: ProfilesWithRoles[];
  translations: TimelineTranslation[];
}

const TimelineForm: React.FC<TimelineFormProps> = ({
  timeline,
  languages,
  availableArticles,
  timelineEvents,
  categories,
  authors,
  translations,
}) => {
  const defaultValues = {
    id: timeline?.id,
    title: timeline?.title ?? '',
    slug: timeline?.slug ?? '',
    description: timeline?.description ?? '',
    image_url: timeline?.image_url ?? '',
    language: timeline?.language ?? 'ar',
    category_id: timeline?.category_id?.toString() ?? undefined,
    is_original: timeline?.is_original ?? true,
    translation_group_id: timeline?.translation_group_id ?? null,
  };

  type FormStatus = 'draft' | 'published' | 'archived';
  const [status, setStatus] = useState<FormStatus>(
    (timeline?.status?.toLowerCase() as FormStatus) ?? 'draft'
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues.title,
      slug: defaultValues.slug,
      description: defaultValues.description,
      image_url: defaultValues.image_url,
      language: defaultValues.language,
      category_id: defaultValues.category_id,
      is_original: defaultValues.is_original,
    },
  });

  // Get available languages for translation (excluding existing translation languages)
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

    // Navigate to new timeline page with translation params
    const params = new URLSearchParams({
      translate_from: defaultValues.id,
      translation_group_id: defaultValues.translation_group_id ?? defaultValues.id,
      language: targetLanguage,
      slug: newSlug,
    });

    // Include category_id if it exists
    if (defaultValues.category_id) {
      params.set('category_id', defaultValues.category_id);
    }

    router.push(`/timelines/new?${params.toString()}`);
  };

  // Labels
  const toastMessage = timeline?.id
    ? 'Timeline updated.'
    : 'Timeline created.';
  const action = timeline?.id ? 'Save changes' : 'Create';

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      const result = await upsertTimeline({
        id: timeline?.id,
        slug: values.slug,
        title: values.title,
        description: values.description || null,
        image_url: values.image_url || null,
        status: status,
        language: values.language,
        category_id: values.category_id ? Number(values.category_id) : null,
        is_original: values.is_original,
        translation_group_id: defaultValues.translation_group_id,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to save timeline');
        setLoading(false);
        return;
      }

      toast.success(toastMessage);

      if (!timeline?.id) {
        router.push(`/timelines/${result.data?.slug}`);
        return;
      }

      router.refresh();
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!timeline?.id) {
      toast.error('Timeline not found');
      return;
    }

    try {
      const result = await deleteTimeline(timeline.id);

      if (!result.success) {
        toast.error(result.error || 'Failed to delete timeline');
        return;
      }

      toast.success('Timeline deleted.');
      router.push('/timelines');
      router.refresh();
    } catch (error) {
      toast.error('Something went wrong when trying to delete');
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
                    {timeline?.id ? timeline.title : 'New timeline'}
                  </CardTitle>
                  <div className="flex gap-2">
                    {timeline?.id && (
                      <>
                        <Link href={`/timelines/view/${timeline.slug}`}>
                          <Button type="button" variant="outline" className="gap-1">
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </Link>
                        <DeleteButton label="Delete Timeline" fn={onDelete} />
                      </>
                    )}
                    <Button type="submit">{action}</Button>
                  </div>
                </CardHeader>
              </Card>

              {/* DETAILS */}
              <Card>
                <CardHeader>
                  <CardTitle>Timeline Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-2 gap-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          Title
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Timeline Title" {...field} />
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
                        <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          Slug
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="timeline-slug" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl className="w-full">
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
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

                  <div>
                    <FormLabel className="mb-2">Status</FormLabel>
                    <TabToggle
                      state={status}
                      setState={(value) => setStatus(value as FormStatus)}
                      picklist={[
                        { value: 'draft', label: <span className="flex items-center gap-1.5"><FileEdit className="h-3.5 w-3.5" />Draft</span> },
                        { value: 'published', label: <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Published</span> },
                        { value: 'archived', label: <span className="flex items-center gap-1.5"><Archive className="h-3.5 w-3.5" />Archived</span> },
                      ]}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Timeline description..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* ARTICLES */}
              {timeline?.id && (
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline Events</CardTitle>
                    <CardDescription>
                      Add and arrange articles in this timeline
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ArticleSelector
                      timelineId={timeline.id}
                      timelineSlug={timeline.slug}
                      timelineLanguage={form.watch('language')}
                      timelineCategoryId={form.watch('category_id') ? Number(form.watch('category_id')) : undefined}
                      timelineCategoryName={
                        form.watch('category_id')
                          ? categories.find((c) => c.id.toString() === form.watch('category_id'))?.name
                          : undefined
                      }
                      availableArticles={availableArticles}
                      timelineEvents={timelineEvents}
                      authors={authors}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Cover Image */}
              <Card>
                <CardHeader>
                  <CardTitle>Cover Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
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

              {/* Translations */}
              {defaultValues.id && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Translations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                              <Link key={translation.id} href={`/timelines/${translation.slug}`}>
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
                              {getLanguageWithFlag(lang.code, lang.native_name)}
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

                    {/* Mark as original */}
                    <div className="pt-2 border-t">
                      <FormField
                        control={form.control}
                        name="is_original"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Mark as original</FormLabel>
                              <FormDescription>
                                Source timeline for translations
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </fieldset>
        </form>
      </Form>
    </div>
  );
};

export default TimelineForm;
