'use client';

import { TimelineEvent } from '@/types/timeline';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface ArticlePaneProps {
  event: TimelineEvent | null;
  onPrevEvent?: () => void;
  onNextEvent?: () => void;
  currentIndex: number;
  totalEvents: number;
}

const ArticlePane: React.FC<ArticlePaneProps> = ({
  event,
  onPrevEvent,
  onNextEvent,
  currentIndex,
  totalEvents,
}) => {
  // Use the stored HTML content directly
  const htmlContent = event?.article.content || '';

  if (!event) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select an event from the timeline
      </div>
    );
  }

  const hijriDate =
    event.custom_event_date_hijri || event.article.event_date_hijri;
  const gregorianDate =
    event.custom_event_date_gregorian || event.article.event_date_gregorian;

  const formatGregorianDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const title = event.custom_title || event.article.title;

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

      {/* Article content */}
      <ScrollArea className="flex-1">
        <article className="p-6 max-w-3xl mx-auto">
          {/* Cover image */}
          {event.article.image_url && (
            <div className="mb-6 rounded-lg overflow-hidden">
              <img
                src={event.article.image_url}
                alt={title}
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
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl font-bold mb-4">{title}</h1>

          {/* Summary */}
          {event.article.summary && (
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              {event.article.summary}
            </p>
          )}

          {/* Content */}
          <div
            className="prose prose-slate dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Link to full article */}
          <div className="mt-8 pt-4 border-t">
            <Link href={`/articles/${event.article.slug}`}>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Edit Article
              </Button>
            </Link>
          </div>
        </article>
      </ScrollArea>
    </div>
  );
};

export default ArticlePane;
