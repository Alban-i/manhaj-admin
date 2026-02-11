'use client';

import { useState, useTransition, useMemo } from 'react';
import { ArticleForTheme } from '@/actions/get-articles-for-theme';
import { ThemeEvent, ThemeEventNested, nestEvents } from '@/types/theme';
import { ProfilesWithRoles } from '@/types/types';
import {
  addArticleToTheme,
  removeArticleFromTheme,
  updateThemeArticleOrder,
  setEventParent,
} from '@/actions/upsert-theme';
import { Button } from '@/components/ui/button';
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
  ChevronRight,
  ChevronLeft,
  FilePlus,
  ChevronDown as CollapseIcon,
  ChevronRight as ExpandIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatHijriForDisplay } from '@/lib/hijri-utils';
import CreateArticleSheet from './create-article-sheet';

interface ArticleSelectorProps {
  themeId: string;
  themeSlug: string;
  themeLanguage: string;
  themeCategoryId?: number;
  themeCategoryName?: string;
  availableArticles: ArticleForTheme[];
  themeEvents: ThemeEvent[];
  authors: ProfilesWithRoles[];
}

const ArticleSelector: React.FC<ArticleSelectorProps> = ({
  themeId,
  themeSlug,
  themeLanguage,
  themeCategoryId,
  themeCategoryName,
  availableArticles,
  themeEvents,
  authors,
}) => {
  const [open, setOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [events, setEvents] = useState(themeEvents);
  const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Build nested structure from flat events
  const nestedEvents = useMemo(() => nestEvents(events), [events]);

  // Flatten nested events for display (respecting collapsed state)
  const flattenedForDisplay = useMemo(() => {
    const result: { event: ThemeEvent; isChild: boolean; parentId: string | null; flatIndex: number }[] = [];
    let flatIndex = 0;

    nestedEvents.forEach((parent) => {
      result.push({ event: parent, isChild: false, parentId: null, flatIndex: flatIndex++ });

      if (!collapsedParents.has(parent.id) && parent.children.length > 0) {
        parent.children.forEach((child) => {
          result.push({ event: child, isChild: true, parentId: parent.id, flatIndex: flatIndex++ });
        });
      }
    });

    return result;
  }, [nestedEvents, collapsedParents]);

  // Toggle collapsed state
  const toggleCollapsed = (eventId: string) => {
    setCollapsedParents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  // Get article IDs already in the theme
  const selectedArticleIds = events.map((e) => e.article_id);

  // Filter available articles:
  // 1. Not already in theme
  // 2. Same language as theme
  // 3. Same category as theme (if theme has a category)
  const unselectedArticles = availableArticles.filter((article) => {
    // Already in theme
    if (selectedArticleIds.includes(article.id)) return false;

    // Must match theme language
    if (article.language !== themeLanguage) return false;

    // Must match theme category (if theme has a category set)
    if (themeCategoryId && article.category_id !== themeCategoryId) return false;

    return true;
  });

  const handleAddArticle = async (article: ArticleForTheme) => {
    setOpen(false);

    startTransition(async () => {
      const maxOrder = Math.max(0, ...events.map((e) => e.display_order ?? 0));

      const result = await addArticleToTheme({
        theme_id: themeId,
        article_id: article.id,
        display_order: maxOrder + 1,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to add article');
        return;
      }

      toast.success('Article added to theme');
      router.refresh();
    });
  };

  const handleRemoveArticle = async (articleId: string) => {
    startTransition(async () => {
      const result = await removeArticleFromTheme(themeId, articleId);

      if (!result.success) {
        toast.error(result.error || 'Failed to remove article');
        return;
      }

      setEvents((prev) => prev.filter((e) => e.article_id !== articleId));
      toast.success('Article removed from theme');
    });
  };

  // Get the event above in the flat list (for indent operation)
  const getEventAbove = (flatIndex: number): ThemeEvent | null => {
    if (flatIndex <= 0) return null;
    return flattenedForDisplay[flatIndex - 1].event;
  };

  // Check if an event can be indented (made a child of the event above)
  const canIndent = (flatIndex: number): boolean => {
    const item = flattenedForDisplay[flatIndex];
    if (item.isChild) return false; // Already a child, can't go deeper

    const eventAbove = getEventAbove(flatIndex);
    if (!eventAbove) return false;

    // Check if event above is a child (can't make a child of a child)
    const itemAbove = flattenedForDisplay[flatIndex - 1];
    if (itemAbove.isChild) return false;

    // Check if current event has children (can't make a parent into a child)
    const nestedEvent = nestedEvents.find(e => e.id === item.event.id);
    if (nestedEvent && nestedEvent.children.length > 0) return false;

    return true;
  };

  // Check if an event can be outdented (promoted to top level)
  const canOutdent = (item: { isChild: boolean }): boolean => {
    return item.isChild;
  };

  // Handle indent (make event a child of the event above)
  const handleIndent = async (flatIndex: number) => {
    const item = flattenedForDisplay[flatIndex];
    const eventAbove = flattenedForDisplay[flatIndex - 1];
    if (!eventAbove || item.isChild) return;

    startTransition(async () => {
      const result = await setEventParent(item.event.id, eventAbove.event.id);
      if (!result.success) {
        toast.error(result.error || 'Failed to indent');
        return;
      }

      // Update local state
      setEvents(prev => prev.map(e =>
        e.id === item.event.id ? { ...e, parent_id: eventAbove.event.id } : e
      ));
      toast.success('Event indented');
    });
  };

  // Handle outdent (promote child to top level)
  const handleOutdent = async (flatIndex: number) => {
    const item = flattenedForDisplay[flatIndex];
    if (!item.isChild) return;

    startTransition(async () => {
      const result = await setEventParent(item.event.id, null);
      if (!result.success) {
        toast.error(result.error || 'Failed to outdent');
        return;
      }

      // Update local state
      setEvents(prev => prev.map(e =>
        e.id === item.event.id ? { ...e, parent_id: null } : e
      ));
      toast.success('Event moved to top level');
    });
  };

  // Move within same level (up)
  const handleMoveUp = async (flatIndex: number) => {
    const item = flattenedForDisplay[flatIndex];

    if (item.isChild) {
      // Find siblings (other children of the same parent)
      const parentEvent = nestedEvents.find(e => e.id === item.parentId);
      if (!parentEvent) return;

      const siblingIndex = parentEvent.children.findIndex(c => c.id === item.event.id);
      if (siblingIndex <= 0) return;

      // Swap with sibling above
      const newChildren = [...parentEvent.children];
      [newChildren[siblingIndex - 1], newChildren[siblingIndex]] = [newChildren[siblingIndex], newChildren[siblingIndex - 1]];

      const updatedItems = newChildren.map((child, idx) => ({
        id: child.id,
        display_order: idx + 1,
      }));

      // Optimistic update
      setEvents(prev => {
        const updated = [...prev];
        newChildren.forEach((child, idx) => {
          const eventIndex = updated.findIndex(e => e.id === child.id);
          if (eventIndex !== -1) {
            updated[eventIndex] = { ...updated[eventIndex], display_order: idx + 1 };
          }
        });
        return updated;
      });

      startTransition(async () => {
        const result = await updateThemeArticleOrder(updatedItems);
        if (!result.success) {
          toast.error('Failed to reorder');
          router.refresh();
        }
      });
    } else {
      // Move top-level event
      const topLevelIndex = nestedEvents.findIndex(e => e.id === item.event.id);
      if (topLevelIndex <= 0) return;

      const newTopLevel = [...nestedEvents];
      [newTopLevel[topLevelIndex - 1], newTopLevel[topLevelIndex]] = [newTopLevel[topLevelIndex], newTopLevel[topLevelIndex - 1]];

      // Get all top-level events for reordering (excluding children)
      const updatedItems = newTopLevel.map((event, idx) => ({
        id: event.id,
        display_order: idx + 1,
      }));

      // Optimistic update
      setEvents(prev => {
        const updated = [...prev];
        newTopLevel.forEach((event, idx) => {
          const eventIndex = updated.findIndex(e => e.id === event.id);
          if (eventIndex !== -1) {
            updated[eventIndex] = { ...updated[eventIndex], display_order: idx + 1 };
          }
        });
        return updated;
      });

      startTransition(async () => {
        const result = await updateThemeArticleOrder(updatedItems);
        if (!result.success) {
          toast.error('Failed to reorder');
          router.refresh();
        }
      });
    }
  };

  // Move within same level (down)
  const handleMoveDown = async (flatIndex: number) => {
    const item = flattenedForDisplay[flatIndex];

    if (item.isChild) {
      // Find siblings (other children of the same parent)
      const parentEvent = nestedEvents.find(e => e.id === item.parentId);
      if (!parentEvent) return;

      const siblingIndex = parentEvent.children.findIndex(c => c.id === item.event.id);
      if (siblingIndex >= parentEvent.children.length - 1) return;

      // Swap with sibling below
      const newChildren = [...parentEvent.children];
      [newChildren[siblingIndex], newChildren[siblingIndex + 1]] = [newChildren[siblingIndex + 1], newChildren[siblingIndex]];

      const updatedItems = newChildren.map((child, idx) => ({
        id: child.id,
        display_order: idx + 1,
      }));

      // Optimistic update
      setEvents(prev => {
        const updated = [...prev];
        newChildren.forEach((child, idx) => {
          const eventIndex = updated.findIndex(e => e.id === child.id);
          if (eventIndex !== -1) {
            updated[eventIndex] = { ...updated[eventIndex], display_order: idx + 1 };
          }
        });
        return updated;
      });

      startTransition(async () => {
        const result = await updateThemeArticleOrder(updatedItems);
        if (!result.success) {
          toast.error('Failed to reorder');
          router.refresh();
        }
      });
    } else {
      // Move top-level event
      const topLevelIndex = nestedEvents.findIndex(e => e.id === item.event.id);
      if (topLevelIndex >= nestedEvents.length - 1) return;

      const newTopLevel = [...nestedEvents];
      [newTopLevel[topLevelIndex], newTopLevel[topLevelIndex + 1]] = [newTopLevel[topLevelIndex + 1], newTopLevel[topLevelIndex]];

      // Get all top-level events for reordering (excluding children)
      const updatedItems = newTopLevel.map((event, idx) => ({
        id: event.id,
        display_order: idx + 1,
      }));

      // Optimistic update
      setEvents(prev => {
        const updated = [...prev];
        newTopLevel.forEach((event, idx) => {
          const eventIndex = updated.findIndex(e => e.id === event.id);
          if (eventIndex !== -1) {
            updated[eventIndex] = { ...updated[eventIndex], display_order: idx + 1 };
          }
        });
        return updated;
      });

      startTransition(async () => {
        const result = await updateThemeArticleOrder(updatedItems);
        if (!result.success) {
          toast.error('Failed to reorder');
          router.refresh();
        }
      });
    }
  };

  // Check if move up is possible
  const canMoveUp = (flatIndex: number): boolean => {
    const item = flattenedForDisplay[flatIndex];
    if (item.isChild) {
      const parentEvent = nestedEvents.find(e => e.id === item.parentId);
      if (!parentEvent) return false;
      const siblingIndex = parentEvent.children.findIndex(c => c.id === item.event.id);
      return siblingIndex > 0;
    } else {
      const topLevelIndex = nestedEvents.findIndex(e => e.id === item.event.id);
      return topLevelIndex > 0;
    }
  };

  // Check if move down is possible
  const canMoveDown = (flatIndex: number): boolean => {
    const item = flattenedForDisplay[flatIndex];
    if (item.isChild) {
      const parentEvent = nestedEvents.find(e => e.id === item.parentId);
      if (!parentEvent) return false;
      const siblingIndex = parentEvent.children.findIndex(c => c.id === item.event.id);
      return siblingIndex < parentEvent.children.length - 1;
    } else {
      const topLevelIndex = nestedEvents.findIndex(e => e.id === item.event.id);
      return topLevelIndex < nestedEvents.length - 1;
    }
  };

  const formatEventDate = (event: ThemeEvent) => {
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
      {/* Action Buttons */}
      <div className="flex gap-2">
        {/* Create New Article Button */}
        <Button
          type="button"
          variant="default"
          className="gap-2"
          onClick={() => setCreateSheetOpen(true)}
          disabled={isPending}
        >
          <FilePlus className="h-4 w-4" />
          Create New Article
        </Button>

        {/* Add Existing Article Button */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-start gap-2"
              disabled={isPending}
            >
              <Plus className="h-4 w-4" />
              Add existing article
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
      </div>

      {/* Create Article Sheet */}
      <CreateArticleSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        themeId={themeId}
        themeSlug={themeSlug}
        themeLanguage={themeLanguage}
        themeCategoryId={themeCategoryId}
        themeCategoryName={themeCategoryName}
        authors={authors}
      />

      {/* Theme Events List */}
      <div className="space-y-2">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No articles added to this theme yet.
          </p>
        ) : (
          flattenedForDisplay.map(({ event, isChild, parentId, flatIndex }) => {
            const dateDisplay = formatEventDate(event);
            const nestedEvent = nestedEvents.find(e => e.id === event.id);
            const hasChildren = nestedEvent && nestedEvent.children.length > 0;
            const isCollapsed = collapsedParents.has(event.id);

            return (
              <div
                key={event.id}
                className={cn(
                  'flex items-center gap-2 p-3 border rounded-lg bg-background',
                  isPending && 'opacity-50',
                  isChild && 'ml-8 border-l-4 border-l-muted-foreground/30'
                )}
              >
                {/* Expand/Collapse for parents */}
                {hasChildren ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => toggleCollapsed(event.id)}
                    disabled={isPending}
                  >
                    {isCollapsed ? (
                      <ExpandIcon className="h-4 w-4" />
                    ) : (
                      <CollapseIcon className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  <div className="w-6 shrink-0" />
                )}

                {/* Move up/down arrows */}
                <div className="flex flex-col gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleMoveUp(flatIndex)}
                    disabled={!canMoveUp(flatIndex) || isPending}
                    title="Move up"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleMoveDown(flatIndex)}
                    disabled={!canMoveDown(flatIndex) || isPending}
                    title="Move down"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>

                {/* Indent/Outdent arrows */}
                <div className="flex flex-col gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleIndent(flatIndex)}
                    disabled={!canIndent(flatIndex) || isPending}
                    title="Make sub-event (indent)"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleOutdent(flatIndex)}
                    disabled={!canOutdent({ isChild }) || isPending}
                    title="Promote to top level (outdent)"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                </div>

                <GripVertical className="h-4 w-4 text-muted-foreground" />

                <div className="flex-1 min-w-0">
                  <p className={cn('font-medium truncate', isChild && 'text-sm')}>
                    {event.custom_title || event.article.title}
                  </p>
                  {dateDisplay && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {dateDisplay}
                    </p>
                  )}
                </div>

                {/* Badge showing position and hierarchy info */}
                <div className="flex items-center gap-1 shrink-0">
                  {hasChildren && (
                    <Badge variant="secondary" className="text-xs">
                      {nestedEvent.children.length} sub
                    </Badge>
                  )}
                  {isChild && (
                    <Badge variant="outline" className="text-xs bg-muted">
                      sub
                    </Badge>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleRemoveArticle(event.article_id)}
                  disabled={isPending}
                  title={hasChildren ? 'Delete (children will be promoted)' : 'Remove'}
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
