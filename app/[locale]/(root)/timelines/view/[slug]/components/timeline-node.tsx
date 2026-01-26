'use client';

import { TimelineEvent } from '@/types/timeline';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface TimelineNodeProps {
  event: TimelineEvent;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  isChild?: boolean;
  hasChildren?: boolean;
  onClick: () => void;
}

const TimelineNode: React.FC<TimelineNodeProps> = ({
  event,
  isSelected,
  isFirst,
  isLast,
  isChild = false,
  hasChildren = false,
  onClick,
}) => {
  // Get the date to display (custom or from article)
  const hijriDate =
    event.custom_event_date_hijri || event.article.event_date_hijri;
  const gregorianDate =
    event.custom_event_date_gregorian || event.article.event_date_gregorian;

  // Format Gregorian date
  const formatGregorianDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const title = event.custom_title || event.article.title;

  // Node size - same for all nodes (parent and child)
  const nodeSize = 'w-6 h-6';
  const innerDotSize = 'w-2 h-2';

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-start gap-3 w-full text-left p-3 rounded-lg transition-colors hover:bg-muted/50',
        isSelected && 'bg-muted'
      )}
    >
      {/* Node dot */}
      <div
        className={cn(
          'relative z-10 flex-shrink-0 rounded-full border-2 bg-background flex items-center justify-center',
          nodeSize,
          isSelected
            ? 'border-primary bg-primary'
            : 'border-muted-foreground/30'
        )}
      >
        {hasChildren ? (
          <Plus className={cn('text-muted-foreground', isSelected ? 'text-primary-foreground' : '')} size={12} />
        ) : (
          <div
            className={cn(
              'rounded-full',
              innerDotSize,
              isSelected ? 'bg-primary-foreground' : 'bg-muted-foreground/30'
            )}
          />
        )}
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
            <div className="italic">No date</div>
          )}
        </div>

        {/* Title */}
        <p
          className={cn(
            'font-medium truncate text-sm',
            isSelected && 'text-primary'
          )}
        >
          {title}
        </p>
      </div>
    </button>
  );
};

export default TimelineNode;
