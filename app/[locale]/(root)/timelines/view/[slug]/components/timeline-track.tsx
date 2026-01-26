'use client';

import { TimelineEvent } from '@/actions/get-timeline-events';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import TimelineNode from './timeline-node';

interface TimelineTrackProps {
  events: TimelineEvent[];
  selectedEvent: TimelineEvent | null;
  onEventSelect: (event: TimelineEvent) => void;
}

const TimelineTrack: React.FC<TimelineTrackProps> = ({
  events,
  selectedEvent,
  onEventSelect,
}) => {
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-border" />

          {/* Timeline nodes */}
          <div className="space-y-0">
            {events.map((event, index) => (
              <TimelineNode
                key={event.id}
                event={event}
                isSelected={selectedEvent?.id === event.id}
                isFirst={index === 0}
                isLast={index === events.length - 1}
                onClick={() => onEventSelect(event)}
              />
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default TimelineTrack;
