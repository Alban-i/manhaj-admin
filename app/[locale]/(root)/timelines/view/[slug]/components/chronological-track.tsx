'use client';

import { TimelineEvent } from '@/types/timeline';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface ChronologicalTrackProps {
  events: TimelineEvent[];
  selectedEvent: TimelineEvent | null;
  onEventSelect: (event: TimelineEvent) => void;
}

const ChronologicalTrack: React.FC<ChronologicalTrackProps> = ({
  events,
  selectedEvent,
  onEventSelect,
}) => {
  const formatGregorianDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="relative">
          {/* Main vertical line */}
          <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-border" />

          {/* Timeline nodes */}
          <div className="space-y-0">
            {events.map((event) => {
              const translation = event.translation;
              const hijriDate = event.event_date_hijri;
              const gregorianDate = event.event_date_gregorian;
              const isSelected = selectedEvent?.id === event.id;

              return (
                <button
                  key={event.id}
                  onClick={() => onEventSelect(event)}
                  className={cn(
                    'relative flex items-start gap-3 w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50',
                    isSelected && 'bg-muted'
                  )}
                >
                  {/* Node dot */}
                  <div
                    className={cn(
                      'relative z-10 flex-shrink-0 rounded-full border-2 bg-background flex items-center justify-center w-6 h-6',
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-full w-2 h-2',
                        isSelected ? 'bg-primary-foreground' : 'bg-muted-foreground/30'
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    {/* Date display */}
                    <div className="text-xs text-muted-foreground space-y-0.5 mb-1">
                      {hijriDate && (
                        <div className="font-medium text-foreground/80">{hijriDate}</div>
                      )}
                      {gregorianDate && (
                        <div>{formatGregorianDate(gregorianDate)}</div>
                      )}
                      {!hijriDate && !gregorianDate && (
                        <div className="flex items-center gap-1 italic">
                          <Calendar className="h-3 w-3" />
                          No date
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <p
                      className={cn(
                        'font-medium truncate text-sm',
                        isSelected && 'text-primary'
                      )}
                    >
                      {translation?.title || 'Untitled event'}
                    </p>

                    {/* Source */}
                    {translation?.source && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {translation.source}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default ChronologicalTrack;
