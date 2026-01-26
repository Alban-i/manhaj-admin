'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import arabic from 'react-date-object/calendars/arabic';
import arabic_ar from 'react-date-object/locales/arabic_ar';
import gregorian from 'react-date-object/calendars/gregorian';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import { format } from 'date-fns';

import { ProfilesWithRoles } from '@/types/types';
import { createArticleForTimeline } from '@/actions/create-article-for-timeline';
import { createHijriDateObject, dateObjectToTimestamp } from '@/lib/hijri-utils';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  author_id: z.string().min(1, 'Author is required'),
  summary: z.string().min(1, 'Summary is required'),
  event_date_hijri: z.string().optional(),
  event_date_hijri_year: z.coerce.number().optional(),
  event_date_gregorian: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateArticleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timelineId: string;
  timelineSlug: string;
  timelineLanguage: string;
  timelineCategoryId?: number | null;
  timelineCategoryName?: string | null;
  authors: ProfilesWithRoles[];
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[\u0600-\u06FF]/g, '') // Remove Arabic characters
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

const CreateArticleSheet: React.FC<CreateArticleSheetProps> = ({
  open,
  onOpenChange,
  timelineId,
  timelineSlug,
  timelineLanguage,
  timelineCategoryId,
  timelineCategoryName,
  authors,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      slug: '',
      author_id: '',
      summary: '',
      event_date_hijri: '',
      event_date_hijri_year: undefined,
      event_date_gregorian: '',
    },
  });

  // Auto-generate slug from title
  const watchTitle = form.watch('title');
  useEffect(() => {
    if (watchTitle) {
      const slug = generateSlug(watchTitle);
      if (slug) {
        form.setValue('slug', slug);
      }
    }
  }, [watchTitle, form]);

  const onSubmit = async (values: FormData) => {
    startTransition(async () => {
      const result = await createArticleForTimeline({
        timeline_id: timelineId,
        timeline_slug: timelineSlug,
        title: values.title,
        slug: values.slug,
        summary: values.summary,
        author_id: values.author_id,
        category_id: timelineCategoryId,
        event_date_hijri: values.event_date_hijri || null,
        event_date_hijri_year: values.event_date_hijri_year || null,
        event_date_gregorian: values.event_date_gregorian || null,
        language: timelineLanguage,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to create article');
        return;
      }

      toast.success('Article created and added to timeline');
      form.reset();
      onOpenChange(false);
      router.refresh();
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Article</SheetTitle>
          <SheetDescription>
            Create a new article for this timeline. The article will be added to the end of the timeline.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
            {/* Category Badge (read-only) */}
            {timelineCategoryName && (
              <div className="space-y-2">
                <FormLabel>Category</FormLabel>
                <div>
                  <Badge variant="secondary">{timelineCategoryName}</Badge>
                </div>
                <FormDescription>
                  Inherited from timeline
                </FormDescription>
              </div>
            )}

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Title
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Article title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Slug
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="article-slug" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL-friendly identifier (auto-generated from title)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Author */}
            <FormField
              control={form.control}
              name="author_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Author
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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

            {/* Summary */}
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Summary
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief summary of the article..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Event Dates */}
            <div className="grid grid-cols-2 gap-4">
              {/* Hijri Date */}
              <FormField
                control={form.control}
                name="event_date_hijri"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hijri Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        calendar={arabic}
                        locale={arabic_ar}
                        value={createHijriDateObject(field.value)}
                        onChange={(date: DateObject | null) => {
                          if (date) {
                            field.onChange(dateObjectToTimestamp(date));
                            form.setValue('event_date_hijri_year', date.year);
                            const gregorianDate = new DateObject(date).convert(
                              gregorian,
                              gregorian_en
                            );
                            form.setValue(
                              'event_date_gregorian',
                              gregorianDate.format('YYYY-MM-DD')
                            );
                          } else {
                            field.onChange('');
                            form.setValue('event_date_hijri_year', undefined);
                            form.setValue('event_date_gregorian', '');
                          }
                        }}
                        format="D MMMM YYYY"
                        placeholder="Select Hijri date"
                        containerClassName="w-full"
                        inputClass="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gregorian Date */}
              <FormField
                control={form.control}
                name="event_date_gregorian"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gregorian Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value || ''}
                        onChange={(e) => {
                          const selectedDate = e.target.value
                            ? new Date(e.target.value)
                            : null;
                          if (selectedDate) {
                            field.onChange(format(selectedDate, 'yyyy-MM-dd'));
                            const hijriDate = new DateObject(
                              selectedDate
                            ).convert(arabic, arabic_ar);
                            form.setValue(
                              'event_date_hijri',
                              dateObjectToTimestamp(hijriDate)
                            );
                            form.setValue(
                              'event_date_hijri_year',
                              hijriDate.year
                            );
                          } else {
                            field.onChange('');
                            form.setValue('event_date_hijri', '');
                            form.setValue('event_date_hijri_year', undefined);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Article
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CreateArticleSheet;
