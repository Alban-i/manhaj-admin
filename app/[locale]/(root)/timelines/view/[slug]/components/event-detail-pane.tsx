'use client';

import { TimelineEvent } from '@/types/timeline';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, ExternalLink, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface EventDetailPaneProps {
  event: TimelineEvent | null;
  onPrevEvent?: () => void;
  onNextEvent?: () => void;
  currentIndex: number;
  totalEvents: number;
}

const EventDetailPane: React.FC<EventDetailPaneProps> = ({
  event,
  onPrevEvent,
  onNextEvent,
  currentIndex,
  totalEvents,
}) => {
  if (!event) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select an event from the timeline
      </div>
    );
  }

  const translation = event.translation;
  const hijriDate = event.event_date_hijri;
  const gregorianDate = event.event_date_gregorian;

  const formatGregorianDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Navigation header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevEvent}
          disabled={!onPrevEvent}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} of {totalEvents}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNextEvent}
          disabled={!onNextEvent}
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Event content */}
      <ScrollArea className="flex-1">
        <article className="p-6 max-w-3xl mx-auto">
          {/* Cover image */}
          {event.image_url && (
            <div className="mb-6 rounded-lg overflow-hidden">
              <img
                src={event.image_url}
                alt={translation?.title || 'Event image'}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Date badge */}
          {(hijriDate || gregorianDate) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Calendar className="h-4 w-4" />
              <span>
                {hijriDate}
                {hijriDate && gregorianDate && ' / '}
                {gregorianDate && formatGregorianDate(gregorianDate)}
              </span>
              {event.event_date_precision && event.event_date_precision !== 'day' && (
                <Badge variant="outline" className="text-xs">
                  ~{event.event_date_precision}
                </Badge>
              )}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl font-bold mb-4">
            {translation?.title || 'Untitled event'}
          </h1>

          {/* Source */}
          {translation?.source && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <LinkIcon className="h-4 w-4" />
              <span>{translation.source}</span>
              {translation.source_url && (
                <a
                  href={translation.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Description */}
          {translation?.description && (
            <div className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap">
              {translation.description}
            </div>
          )}

          {/* Linked article */}
          {event.article && (
            <div className="mt-8 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Linked article:</p>
              <Link href={`/articles/${event.article.slug}`}>
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  {event.article.title}
                </Button>
              </Link>
            </div>
          )}
        </article>
      </ScrollArea>
    </div>
  );
};

export default EventDetailPane;
