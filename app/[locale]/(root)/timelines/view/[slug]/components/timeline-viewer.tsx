'use client';

import { Timeline } from '@/types/types';
import { TimelineEvent } from '@/actions/get-timeline-events';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import TimelineTrack from './timeline-track';
import ArticlePane from './article-pane';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';

interface TimelineViewerProps {
  timeline: Timeline;
  events: TimelineEvent[];
  selectedEventSlug?: string;
}

const TimelineViewer: React.FC<TimelineViewerProps> = ({
  timeline,
  events,
  selectedEventSlug,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Find the initially selected event
  const initialEvent = selectedEventSlug
    ? events.find((e) => e.article.slug === selectedEventSlug)
    : events[0];

  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    initialEvent || null
  );

  // Update URL when event selection changes
  const handleEventSelect = (event: TimelineEvent) => {
    setSelectedEvent(event);
    const params = new URLSearchParams(searchParams.toString());
    params.set('event', event.article.slug);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Navigate to prev/next event
  const currentIndex = selectedEvent
    ? events.findIndex((e) => e.id === selectedEvent.id)
    : -1;

  const prevEvent = currentIndex > 0 ? events[currentIndex - 1] : null;
  const nextEvent =
    currentIndex < events.length - 1 ? events[currentIndex + 1] : null;

  const handlePrevEvent = () => {
    if (prevEvent) handleEventSelect(prevEvent);
  };

  const handleNextEvent = () => {
    if (nextEvent) handleEventSelect(nextEvent);
  };

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <p className="text-muted-foreground">
          No events in this timeline yet.
        </p>
        <Link href={`/timelines/${timeline.slug}`}>
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Timeline
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Link href="/timelines">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{timeline.title}</h1>
            {timeline.description && (
              <p className="text-sm text-muted-foreground">
                {timeline.description}
              </p>
            )}
          </div>
        </div>
        <Link href={`/timelines/${timeline.slug}`}>
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Split View */}
      <ResizablePanelGroup direction="horizontal" className="h-[calc(100%-5rem)]">
        {/* Timeline Track Panel */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
          <TimelineTrack
            events={events}
            selectedEvent={selectedEvent}
            onEventSelect={handleEventSelect}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Article Content Panel */}
        <ResizablePanel defaultSize={70}>
          <ArticlePane
            event={selectedEvent}
            onPrevEvent={prevEvent ? handlePrevEvent : undefined}
            onNextEvent={nextEvent ? handleNextEvent : undefined}
            currentIndex={currentIndex}
            totalEvents={events.length}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default TimelineViewer;
