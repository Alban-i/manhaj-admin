'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TimelineEvent } from '@/types/timeline';
import { upsertTimelineEvent } from '@/actions/upsert-timeline';
import { toast } from 'sonner';

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

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { HijriGregorianDateFields } from '@/components/hijri-gregorian-date-fields';

const eventFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  source: z.string().optional(),
  source_url: z.string().optional(),
  event_date_hijri: z.string().optional(),
  event_date_hijri_year: z.coerce.number().optional(),
  event_date_gregorian: z.string().optional(),
  event_date_precision: z.string().optional(),
  image_url: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormInlineProps {
  onClose: () => void;
  timelineId: string;
  language: string;
  event: TimelineEvent | null;
  nextOrder: number;
}

const EventFormInline: React.FC<EventFormInlineProps> = ({
  onClose,
  timelineId,
  language,
  event,
  nextOrder,
}) => {
  const [loading, setLoading] = useState(false);

  const translation = event?.translation;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: translation?.title ?? '',
      description: translation?.description ?? '',
      source: translation?.source ?? '',
      source_url: translation?.source_url ?? '',
      event_date_hijri: event?.event_date_hijri ?? '',
      event_date_hijri_year: event?.event_date_hijri_year ?? undefined,
      event_date_gregorian: event?.event_date_gregorian ?? '',
      event_date_precision: event?.event_date_precision ?? 'day',
      image_url: event?.image_url ?? '',
    },
  });

  // Reset form when the edited event changes
  useEffect(() => {
    const t = event?.translation;
    form.reset({
      title: t?.title ?? '',
      description: t?.description ?? '',
      source: t?.source ?? '',
      source_url: t?.source_url ?? '',
      event_date_hijri: event?.event_date_hijri ?? '',
      event_date_hijri_year: event?.event_date_hijri_year ?? undefined,
      event_date_gregorian: event?.event_date_gregorian ?? '',
      event_date_precision: event?.event_date_precision ?? 'day',
      image_url: event?.image_url ?? '',
    });
  }, [event, form]);

  const onSubmit = async (values: EventFormValues) => {
    try {
      setLoading(true);

      const result = await upsertTimelineEvent({
        id: event?.id,
        timeline_id: timelineId,
        display_order: event?.display_order ?? nextOrder,
        event_date_hijri: values.event_date_hijri || null,
        event_date_hijri_year: values.event_date_hijri_year || null,
        event_date_gregorian: values.event_date_gregorian || null,
        event_date_precision: values.event_date_precision || 'day',
        image_url: values.image_url || null,
        translations: [
          {
            language,
            title: values.title,
            description: values.description || null,
            source: values.source || null,
            source_url: values.source_url || null,
            is_original: true,
          },
        ],
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to save event');
        return;
      }

      toast.success(event?.id ? 'Event updated.' : 'Event created.');
      onClose();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <h4 className="text-sm font-semibold mb-3">
        {event?.id ? 'Edit Event' : 'New Event'}
      </h4>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <fieldset disabled={loading} className="space-y-4">
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
                    <Input placeholder="Event title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Event description..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Source + Source URL */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. WhatsApp message" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source_url"
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
            </div>

            {/* Dates */}
            <HijriGregorianDateFields form={form} />

            {/* Date Precision */}
            <FormField
              control={form.control}
              name="event_date_precision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Precision</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || 'day'}
                  >
                    <FormControl className="w-full">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                      <SelectItem value="decade">Decade</SelectItem>
                      <SelectItem value="century">Century</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image URL */}
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </fieldset>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {event?.id ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EventFormInline;
