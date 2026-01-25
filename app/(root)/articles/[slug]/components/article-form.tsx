'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
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
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/providers/supabase/client';
import Editor from '@/components/tiptap/editor';
import { TabToggle } from '@/components/ui/tab-toggle';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Globe, Plus, Star, Link2 } from 'lucide-react';
import ImageUpload from '@/components/image-upload';
import { UsedMediaCard } from '@/components/media/used-media-card';
import { revalidateArticle, revalidateArticles } from '@/actions/revalidate';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const initialData = {
  title: '',
  summary: '',
  content: '',
  slug: '',
  status: 'draft',
  category_id: null,
  author_id: null,
  id: undefined,
  published_at: null,
  is_featured: false,
  image_url: '',
  language: 'ar',
  translation_group_id: null,
  is_original: true,
} as const;

const formSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  slug: z.string().min(1),
  category_id: z.string().optional(),
  author_id: z.string().min(1, 'Author is required'),
  is_featured: z.boolean(),
  is_original: z.boolean(),
  image_url: z.string().optional(),
  language: z.string().min(1, 'Language is required'),
});

interface ArticleFormProps {
  article: (Omit<Articles, 'is_published'> & { id?: string }) | null;
  categories: { id: number; name: string }[];
  tags: { id: number; name: string; created_at: string; updated_at: string }[];
  selectedTagIds: number[];
  authors: ProfilesWithRoles[];
  languages: Language[];
  translations: ArticleTranslation[];
}

const ArticleForm: React.FC<ArticleFormProps> = ({
  article,
  categories,
  tags,
  selectedTagIds,
  authors,
  languages,
  translations,
}) => {
  const defaultValues = article ?? { ...initialData, is_featured: false };
  const [content, setContent] = useState<string>(defaultValues.content ?? '');
  const [contentJson, setContentJson] = useState<Json | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [selectedTags, setSelectedTags] = useState<number[]>(selectedTagIds);
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
      is_featured: defaultValues.is_featured ?? false,
      is_original: defaultValues.is_original ?? true,
      image_url: defaultValues.image_url ?? '',
      language: defaultValues.language ?? 'ar',
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
      translation_group_id: defaultValues.translation_group_id ?? defaultValues.id,
      language: targetLanguage,
      slug: newSlug,
      category_id: defaultValues.category_id?.toString() ?? '',
    });

    router.push(`/articles/new?${params.toString()}`);
  };

  // Labels
  const toastMessage = defaultValues.id
    ? 'Article updated.'
    : 'Article created.';
  const action = defaultValues.id ? 'Save changes' : 'Create';

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      let translationGroupId = defaultValues.translation_group_id;

      // Shared data that goes to translation_groups
      const sharedData = {
        author_id: values.author_id || null,
        category_id: values.category_id ? Number(values.category_id) : null,
        image_url: values.image_url || null,
        updated_at: new Date().toISOString(),
      };

      // For new articles without translation_group_id, create a new translation_group
      if (!translationGroupId) {
        const { data: newGroup, error: groupError } = await supabase
          .from('translation_groups')
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
          .from('translation_groups')
          .update(sharedData)
          .eq('id', translationGroupId);

        if (updateGroupError) {
          toast.error('Failed to update translation group: ' + updateGroupError.message);
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
        translation_group_id: translationGroupId,
        published_at:
          status === 'published' &&
          defaultValues.status?.toLowerCase() !== 'published'
            ? new Date().toISOString()
            : defaultValues.published_at,
        // Keep these for backward compatibility but they're managed via translation_groups now
        category_id: values.category_id ? Number(values.category_id) : null,
        author_id: values.author_id || null,
        image_url: values.image_url || null,
        ...(defaultValues.id && { id: defaultValues.id }),
      };

      const { data, error } = await supabase
        .from('articles')
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
          .from('translation_group_tags')
          .delete()
          .eq('translation_group_id', translationGroupId)
          .in('tag_id', tagsToRemove);

        if (deleteError) {
          toast.error('Failed to remove tags');
          console.error('Error removing tags:', deleteError);
        }
      }

      if (tagsToAdd.length > 0) {
        const tagData = tagsToAdd.map((tagId) => ({
          translation_group_id: translationGroupId,
          tag_id: tagId,
        }));

        const { error: insertError } = await supabase
          .from('translation_group_tags')
          .upsert(tagData, { onConflict: 'translation_group_id,tag_id' });

        if (insertError) {
          toast.error('Failed to add new tags');
          console.error('Error adding tags:', insertError);
        }
      }

      form.reset({
        title: data.title ?? '',
        summary: data.summary ?? '',
        slug: data.slug ?? '',
        category_id: values.category_id ?? undefined,
        author_id: values.author_id ?? undefined,
        is_featured: data.is_featured ?? false,
        is_original: data.is_original ?? true,
        image_url: values.image_url ?? '',
        language: data.language ?? 'ar',
      });

      toast.success(toastMessage);

      // Revalidate frontend cache
      await revalidateArticle(data.slug);

      if (!defaultValues.id) {
        router.push(`/articles/${data.slug}`);
        return; // Exit early - the new page will load fresh
      }

      router.refresh();
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!defaultValues.id) {
      toast.error('Article not found');
      return;
    }

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', defaultValues.id);

      if (error) {
        toast.error(error.message);
        setLoading(false);
      }

      toast.success('Article deleted.');

      // Revalidate frontend cache
      await revalidateArticles();

      router.push('/articles');

      form.reset();
      router.refresh();
    } catch (error) {
      toast.error('Something went wrong when trying to delete');
    }
  };

  const generateSummary = async () => {
    if (!content) {
      toast.error('Please add some content first');
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
      toast.success('Summary generated successfully');
    } catch (error) {
      toast.error('Failed to generate summary');
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

              {/* DETAILS */}
              <Card>
                <CardHeader>
                  <CardTitle>Article Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-2 gap-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Article Title" {...field} />
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
                          <Input placeholder="article-slug" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="">
                    <FormLabel className="mb-2">Status</FormLabel>
                    <TabToggle
                      state={status}
                      setState={(value) => setStatus(value as FormStatus)}
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

                  <FormField
                    control={form.control}
                    name="is_featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0 border rounded-md p-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Feature this article</FormLabel>
                          <FormDescription>
                            The featured article will be displayed on home page
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                </CardContent>
              </Card>

              {/* SUMMARY */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Summary</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateSummary}
                      disabled={isGeneratingSummary}
                    >
                      {isGeneratingSummary ? (
                        'Generating...'
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Generate with AI
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
                            placeholder="Article summary..."
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
                  {/* Author */}
                  <FormField
                    control={form.control}
                    name="author_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          Author
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl className="w-full">
                            <SelectTrigger>
                              <SelectValue placeholder="Select an author" />
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

                  {/* Category */}
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

                  <Separator />

                  {/* Tags */}
                  <div className="space-y-2">
                    <FormLabel>Tags</FormLabel>
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
                          {tag.name}
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
                        <FormLabel>Cover Image</FormLabel>
                        <FormDescription>
                          1200 x 630
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

              {/* USED MEDIA */}
              <UsedMediaCard
                articleId={defaultValues.id}
                onMediaRemoved={() => {
                  // Refresh can be added here if needed
                }}
              />
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
                                <Link key={translation.id} href={`/articles/${translation.slug}`}>
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
                                Source article for translations
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

            {/* Full Width Content Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Content</CardTitle>
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
        </form>
      </Form>
    </div>
  );
};

export default ArticleForm;
