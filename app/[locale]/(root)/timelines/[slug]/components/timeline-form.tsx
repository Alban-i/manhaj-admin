'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Timeline, Language } from '@/types/types';
import { ArticleForTimeline } from '@/actions/get-articles-for-timeline';
import { TimelineEvent } from '@/actions/get-timeline-events';

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
import { Checkbox } from '@/components/ui/checkbox';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Globe, Eye } from 'lucide-react';
import ImageUpload from '@/components/image-upload';
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
  is_published: z.boolean(),
  language: z.string().min(1, 'Language is required'),
});

interface TimelineFormProps {
  timeline: Timeline | null;
  languages: Language[];
  availableArticles: ArticleForTimeline[];
  timelineEvents: TimelineEvent[];
}

const TimelineForm: React.FC<TimelineFormProps> = ({
  timeline,
  languages,
  availableArticles,
  timelineEvents,
}) => {
  const defaultValues = {
    title: timeline?.title ?? '',
    slug: timeline?.slug ?? '',
    description: timeline?.description ?? '',
    image_url: timeline?.image_url ?? '',
    is_published: timeline?.is_published ?? false,
    language: timeline?.language ?? 'ar',
  };

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

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
        is_published: values.is_published,
        language: values.language,
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
                    name="is_published"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0 border rounded-md p-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Publish timeline</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

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
                      availableArticles={availableArticles}
                      timelineEvents={timelineEvents}
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
            </div>
          </fieldset>
        </form>
      </Form>
    </div>
  );
};

export default TimelineForm;
