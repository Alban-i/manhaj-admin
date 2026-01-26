'use client';

import { useState, useTransition } from 'react';
import { ArticleForTimeline } from '@/actions/get-articles-for-timeline';
import { TimelineEvent } from '@/actions/get-timeline-events';
import {
  addArticleToTimeline,
  removeArticleFromTimeline,
  updateTimelineArticleOrder,
} from '@/actions/upsert-timeline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Plus,
  X,
  GripVertical,
  Calendar,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatHijriForDisplay } from '@/lib/hijri-utils';

interface ArticleSelectorProps {
  timelineId: string;
  availableArticles: ArticleForTimeline[];
  timelineEvents: TimelineEvent[];
}

const ArticleSelector: React.FC<ArticleSelectorProps> = ({
  timelineId,
  availableArticles,
  timelineEvents,
}) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [events, setEvents] = useState(timelineEvents);
  const router = useRouter();

  // Get article IDs already in the timeline
  const selectedArticleIds = events.map((e) => e.article_id);

  // Filter available articles (not already in timeline)
  const unselectedArticles = availableArticles.filter(
    (article) => !selectedArticleIds.includes(article.id)
  );

  const handleAddArticle = async (article: ArticleForTimeline) => {
    setOpen(false);

    startTransition(async () => {
      const maxOrder = Math.max(0, ...events.map((e) => e.display_order ?? 0));

      const result = await addArticleToTimeline({
        timeline_id: timelineId,
        article_id: article.id,
        display_order: maxOrder + 1,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to add article');
        return;
      }

      toast.success('Article added to timeline');
      router.refresh();
    });
  };

  const handleRemoveArticle = async (articleId: string) => {
    startTransition(async () => {
      const result = await removeArticleFromTimeline(timelineId, articleId);

      if (!result.success) {
        toast.error(result.error || 'Failed to remove article');
        return;
      }

      setEvents((prev) => prev.filter((e) => e.article_id !== articleId));
      toast.success('Article removed from timeline');
    });
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newEvents = [...events];
    [newEvents[index - 1], newEvents[index]] = [newEvents[index], newEvents[index - 1]];

    // Update display orders
    const updatedItems = newEvents.map((event, idx) => ({
      id: event.id,
      display_order: idx + 1,
    }));

    setEvents(newEvents);

    startTransition(async () => {
      const result = await updateTimelineArticleOrder(updatedItems);
      if (!result.success) {
        toast.error('Failed to reorder');
        setEvents(events); // Revert
      }
    });
  };

  const handleMoveDown = async (index: number) => {
    if (index === events.length - 1) return;

    const newEvents = [...events];
    [newEvents[index], newEvents[index + 1]] = [newEvents[index + 1], newEvents[index]];

    // Update display orders
    const updatedItems = newEvents.map((event, idx) => ({
      id: event.id,
      display_order: idx + 1,
    }));

    setEvents(newEvents);

    startTransition(async () => {
      const result = await updateTimelineArticleOrder(updatedItems);
      if (!result.success) {
        toast.error('Failed to reorder');
        setEvents(events); // Revert
      }
    });
  };

  const formatEventDate = (event: TimelineEvent) => {
    const hijri =
      event.custom_event_date_hijri || event.article.event_date_hijri;
    const gregorian =
      event.custom_event_date_gregorian || event.article.event_date_gregorian;

    if (!hijri && !gregorian) return null;

    const parts = [];
    if (hijri) parts.push(formatHijriForDisplay(hijri));
    if (gregorian) {
      const date = new Date(gregorian);
      parts.push(date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }));
    }

    return parts.join(' / ');
  };

  return (
    <div className="space-y-4">
      {/* Add Article Button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start gap-2"
            disabled={isPending}
          >
            <Plus className="h-4 w-4" />
            Add article to timeline
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search articles..." />
            <CommandList>
              <CommandEmpty>No articles found.</CommandEmpty>
              <CommandGroup>
                {unselectedArticles.map((article) => (
                  <CommandItem
                    key={article.id}
                    value={article.title}
                    onSelect={() => handleAddArticle(article)}
                    className="flex flex-col items-start gap-1"
                  >
                    <span className="font-medium">{article.title}</span>
                    {article.event_date_hijri && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatHijriForDisplay(article.event_date_hijri)}
                        {article.event_date_gregorian && (
                          <> / {article.event_date_gregorian}</>
                        )}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Timeline Events List */}
      <div className="space-y-2">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No articles added to this timeline yet.
          </p>
        ) : (
          events.map((event, index) => {
            const dateDisplay = formatEventDate(event);
            return (
              <div
                key={event.id}
                className={cn(
                  'flex items-center gap-2 p-3 border rounded-lg bg-background',
                  isPending && 'opacity-50'
                )}
              >
                <div className="flex flex-col gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0 || isPending}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === events.length - 1 || isPending}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>

                <GripVertical className="h-4 w-4 text-muted-foreground" />

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {event.custom_title || event.article.title}
                  </p>
                  {dateDisplay && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {dateDisplay}
                    </p>
                  )}
                </div>

                <Badge variant="outline" className="shrink-0">
                  #{index + 1}
                </Badge>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleRemoveArticle(event.article_id)}
                  disabled={isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ArticleSelector;
