'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Posts, ProfilesWithRoles, Language } from '@/types/types';
import { PostTranslation } from '@/actions/get-post-translations';
import { Json } from '@/types/types_db';

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

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/providers/supabase/client';
import Editor from '@/components/tiptap/editor';
import { TabToggle } from '@/components/ui/tab-toggle';
import { Textarea } from '@/components/ui/textarea';
import ImageUpload from '@/components/image-upload';
import { revalidatePosts } from '@/actions/revalidate';
import { Globe, Plus, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const initialData: Omit<Posts, 'id'> & { id: null } = {
  id: null,
  title: '',
  content: '',
  content_json: null,
  status: 'draft',
  slug: '',
  type: 'global',
  created_at: null,
  updated_at: null,
  author_id: null,
  category_id: null,
  image_url: null,
  source: null,
  language: 'ar',
  translation_group_id: null,
  is_original: true,
};

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  slug: z.string().min(1, 'Slug is required'),
  category_id: z.string().optional(),
  author_id: z.string().min(1, 'Author is required'),
  source: z.string().optional(),
  image_url: z.string().optional(),
  type: z.enum(['twitter', 'global']),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  language: z.string().min(1, 'Language is required'),
  is_original: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface PostFormProps {
  post: Posts | null;
  categories: { id: number; name: string }[];
  authors: ProfilesWithRoles[];
  languages: Language[];
  translations: PostTranslation[];
}

const PostForm: React.FC<PostFormProps> = ({ post, categories, authors, languages, translations }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string>(post?.content || '');
  const [contentJson, setContentJson] = useState<Json | null>(null);
  type FormStatus = 'draft' | 'published' | 'archived';
  const [status, setStatus] = useState<FormStatus>(
    (post?.status?.toLowerCase() as FormStatus) ?? 'draft'
  );

  const defaultValues = post || initialData;
  const action = post ? 'Save changes' : 'Create';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues.title || '',
      content: defaultValues.content || '',
      slug: defaultValues.slug || '',
      category_id: defaultValues.category_id?.toString() || undefined,
      author_id: defaultValues.author_id?.toString() || undefined,
      source: defaultValues.source || '',
      image_url: defaultValues.image_url || '',
      type: (defaultValues.type as 'twitter' | 'global') || 'global',
      status: defaultValues.status as FormStatus,
      language: defaultValues.language || 'ar',
      is_original: defaultValues.is_original ?? true,
    },
    mode: 'onChange',
  });

  // Get available languages for translation (excluding current post's language)
  const availableLanguagesForTranslation = languages.filter(
    (lang) => !translations.some((t) => t.language === lang.code)
  );

  // Create translation function
  const createTranslation = (targetLanguage: string) => {
    const targetLang = languages.find((l) => l.code === targetLanguage);
    if (!targetLang || !defaultValues.id) return;

    // Generate slug with language suffix
    const baseSlug = defaultValues.slug || '';
    const newSlug = `${baseSlug}-${targetLanguage}`;

    // Navigate to new post page with translation params
    const params = new URLSearchParams({
      translate_from: defaultValues.id.toString(),
      translation_group_id: defaultValues.translation_group_id || '',
      language: targetLanguage,
      slug: newSlug,
      category_id: defaultValues.category_id?.toString() || '',
    });

    router.push(`/posts/new?${params.toString()}`);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      const supabase = createClient();

      const postData = {
        ...values,
        content,
        content_json: contentJson,
        status,
        category_id: values.category_id ? Number(values.category_id) : null,
        updated_at: new Date().toISOString(),
        language: values.language,
        translation_group_id: defaultValues.translation_group_id,
        is_original: values.is_original,
      };

      console.log('Submitting post data:', postData);

      if (post?.id) {
        // Update existing post
        const { data, error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', post.id);

        if (error) {
          console.error('Error updating post:', error);
          toast.error(error.message);
          return;
        }

        toast.success('Post updated successfully');

        // Revalidate frontend cache
        await revalidatePosts();
      } else {
        // Create new post
        const { data, error } = await supabase
          .from('posts')
          .insert(postData)
          .select('id, slug')
          .single();

        if (error) {
          console.error('Error creating post:', error);
          toast.error(error.message);
          return;
        }

        toast.success('Post created successfully');

        // Revalidate frontend cache
        await revalidatePosts();

        // Redirect to the new post's edit page
        if (data) {
          router.push(`/posts/${data.slug}`);
          return;
        }
      }

      router.refresh();
    } catch (error) {
      console.error('Form submission error:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!post?.id) return;

    try {
      setLoading(true);
      const supabase = createClient();

      const { error } = await supabase.from('posts').delete().eq('id', post.id);

      if (error) throw error;

      toast.success('Post deleted successfully');

      // Revalidate frontend cache
      await revalidatePosts();

      router.refresh();
      router.push('/posts');
    } catch (error) {
      toast.error('Something went wrong');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Form {...form}>
        <form
          onSubmit={(e) => {
            console.log('Form submission triggered');
            form.handleSubmit(onSubmit)(e);
          }}
          className="space-y-6"
        >
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
                    {defaultValues.id ? defaultValues.title : 'New post'}
                  </CardTitle>
                  <div className="flex gap-2">
                    {defaultValues.id && (
                      <DeleteButton label="Delete Post" fn={onDelete} />
                    )}
                    <Button type="submit">{action}</Button>
                  </div>
                </CardHeader>
              </Card>

              {/* DETAILS */}
              <Card>
                <CardHeader>
                  <CardTitle>Post Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-2 gap-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Post Title" {...field} />
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
                          <Input placeholder="post-slug" {...field} />
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

                  <FormField
                    control={form.control}
                    name="type"
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
                            <SelectItem value="twitter">Twitter</SelectItem>
                            <SelectItem value="global">Global</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
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
                    name="is_original"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0 border rounded-md p-2 col-span-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Mark as original</FormLabel>
                          <FormDescription>
                            This is the source post for all translations in this group
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* COVER IMAGE */}
              <Card>
                <CardHeader>
                  <CardTitle>Cover Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem className="border p-2 rounded-md">
                        <FormLabel className="font-semibold ml-2">
                          Cover Image
                        </FormLabel>
                        <FormDescription className="ml-2">
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

              {/* TRANSLATIONS */}
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
                        <p className="text-sm text-muted-foreground">
                          Available translations:
                        </p>
                        <div className="space-y-2">
                          {translations.map((translation) => {
                            const lang = languages.find(
                              (l) => l.code === translation.language
                            );
                            const isCurrent = translation.id === defaultValues.id;
                            return (
                              <div
                                key={translation.id}
                                className={`flex items-center justify-between p-2 rounded-md border ${
                                  isCurrent ? 'bg-muted' : 'bg-background'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={isCurrent ? 'default' : 'outline'}
                                    className="text-xs"
                                  >
                                    {lang?.native_name || translation.language.toUpperCase()}
                                  </Badge>
                                  {translation.is_original && (
                                    <Badge variant="secondary" className="text-xs">
                                      Original
                                    </Badge>
                                  )}
                                  <span className="text-sm truncate max-w-[120px]">
                                    {translation.title}
                                  </span>
                                </div>
                                {!isCurrent && (
                                  <Link href={`/posts/${translation.slug}`}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      type="button"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Create new translation */}
                    {availableLanguagesForTranslation.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Create translation:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {availableLanguagesForTranslation.map((lang) => (
                            <Button
                              key={lang.code}
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => createTranslation(lang.code)}
                              className="gap-1"
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
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Full Width Content Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Editor
                          content={content}
                          onChange={(html, json) => {
                            setContent(html);
                            if (json) setContentJson(json as Json);
                            field.onChange(html);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </fieldset>
        </form>
      </Form>
    </div>
  );
};

export default PostForm;
