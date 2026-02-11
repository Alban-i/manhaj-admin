'use client';

import { useMemo } from 'react';
import { ThemeEvent, ThemeEventNested, nestEvents } from '@/types/theme';
import { ScrollArea } from '@/components/ui/scroll-area';
import ThemeNode from './theme-node';

interface ThemeTrackProps {
  events: ThemeEvent[];
  selectedEvent: ThemeEvent | null;
  onEventSelect: (event: ThemeEvent) => void;
}

const ThemeTrack: React.FC<ThemeTrackProps> = ({
  events,
  selectedEvent,
  onEventSelect,
}) => {
  // Build nested structure
  const nestedEvents = useMemo(() => nestEvents(events), [events]);

  // Render a single event node with its children
  const renderEventWithChildren = (
    event: ThemeEventNested,
    index: number,
    totalAtLevel: number,
    isChild: boolean = false
  ) => {
    const hasChildren = event.children.length > 0;

    return (
      <div key={event.id} className="relative">
        <ThemeNode
          event={event}
          isSelected={selectedEvent?.id === event.id}
          isFirst={index === 0 && !isChild}
          isLast={index === totalAtLevel - 1 && !isChild && !hasChildren}
          isChild={isChild}
          hasChildren={hasChildren}
          onClick={() => onEventSelect(event)}
        />

        {/* Children - rendered with horizontal branches */}
        {hasChildren &&
          event.children.map((child, childIndex) => (
            <div key={child.id} className="relative">
              {/* Horizontal branch line from main vertical to child node */}
              <div className="absolute left-[11px] top-[22px] w-8 h-0.5 bg-border" />

              {/* Child node - positioned after the horizontal branch */}
              <div className="ml-8">
                <ThemeNode
                  event={child}
                  isSelected={selectedEvent?.id === child.id}
                  isFirst={childIndex === 0}
                  isLast={childIndex === event.children.length - 1}
                  isChild={true}
                  hasChildren={false}
                  onClick={() => onEventSelect(child)}
                />
              </div>
            </div>
          ))}
      </div>
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="relative">
          {/* Main vertical line */}
          <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-border" />

          {/* Timeline nodes */}
          <div className="space-y-0">
            {nestedEvents.map((event, index) =>
              renderEventWithChildren(event, index, nestedEvents.length)
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default ThemeTrack;
