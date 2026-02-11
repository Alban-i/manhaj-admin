'use client';

import { Theme, ProfilesWithRoles } from '@/types/types';
import { ThemeEvent } from '@/types/theme';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import ThemeTrack from './theme-track';
import ArticlePane from './article-pane';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Plus } from 'lucide-react';
import Link from 'next/link';
import CreateArticleSheet from '@/app/[locale]/(root)/themes/[slug]/components/create-article-sheet';

interface ThemeViewerProps {
  theme: Theme;
  events: ThemeEvent[];
  selectedEventSlug?: string;
  categories: { id: number; name: string }[];
  authors: ProfilesWithRoles[];
}

const ThemeViewer: React.FC<ThemeViewerProps> = ({
  theme,
  events,
  selectedEventSlug,
  categories,
  authors,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  // Get category name from theme's category_id
  const themeCategoryName = theme.category_id
    ? categories.find((c) => c.id === theme.category_id)?.name
    : undefined;

  // Find the initially selected event
  const initialEvent = selectedEventSlug
    ? events.find((e) => e.article.slug === selectedEventSlug)
    : events[0];

  const [selectedEvent, setSelectedEvent] = useState<ThemeEvent | null>(
    initialEvent || null
  );

  // Update URL when event selection changes
  const handleEventSelect = (event: ThemeEvent) => {
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
      <>
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <p className="text-muted-foreground">
            No events in this theme yet.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setCreateSheetOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create First Article
            </Button>
            <Link href={`/themes/${theme.slug}`}>
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Theme
              </Button>
            </Link>
          </div>
        </div>
        <CreateArticleSheet
          open={createSheetOpen}
          onOpenChange={setCreateSheetOpen}
          themeId={theme.id}
          themeSlug={theme.slug}
          themeLanguage={theme.language || 'ar'}
          themeCategoryId={theme.category_id ?? undefined}
          themeCategoryName={themeCategoryName}
          authors={authors}
        />
      </>
    );
  }

  return (
    <>
      <div className="h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <Link href="/themes">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{theme.title}</h1>
              {theme.description && (
                <p className="text-sm text-muted-foreground">
                  {theme.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCreateSheetOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Article
            </Button>
            <Link href={`/themes/${theme.slug}`}>
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {/* Split View */}
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100%-5rem)]">
          {/* Theme Track Panel */}
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <ThemeTrack
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

      <CreateArticleSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        themeId={theme.id}
        themeSlug={theme.slug}
        themeLanguage={theme.language || 'ar'}
        themeCategoryId={theme.category_id ?? undefined}
        themeCategoryName={themeCategoryName}
        authors={authors}
      />
    </>
  );
};

export default ThemeViewer;
