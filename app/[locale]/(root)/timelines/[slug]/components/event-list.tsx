'use client';

import { useState } from 'react';
import { TimelineEvent } from '@/types/timeline';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, Pencil, Trash2, Calendar, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  deleteTimelineEvent,
  updateTimelineEventOrder,
} from '@/actions/upsert-timeline';
import EventFormInline from './event-form-dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';

interface EventListProps {
  timelineId: string;
  language: string;
  events: TimelineEvent[];
}

interface SortableEventItemProps {
  event: TimelineEvent;
  onEdit: (event: TimelineEvent) => void;
  onDelete: (eventId: string) => void;
}

function SortableEventItem({ event, onEdit, onDelete }: SortableEventItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const translation = event.translation;
  const dateDisplay = event.event_date_hijri || event.event_date_gregorian || null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-md border bg-background p-3 group"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">
            {translation?.title || 'Untitled event'}
          </span>
          {event.article && (
            <Badge variant="outline" className="gap-1 text-xs shrink-0">
              <LinkIcon className="h-3 w-3" />
              Article
            </Badge>
          )}
        </div>
        {(dateDisplay || translation?.source) && (
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            {dateDisplay && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {dateDisplay}
              </span>
            )}
            {translation?.source && (
              <span className="truncate">{translation.source}</span>
            )}
          </div>
        )}
        {translation?.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {translation.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(event)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(event.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

const EventList: React.FC<EventListProps> = ({
  timelineId,
  language,
  events: initialEvents,
}) => {
  const router = useRouter();
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAdd = () => {
    setEditingEvent(null);
    setFormOpen(true);
  };

  const handleEdit = (event: TimelineEvent) => {
    setEditingEvent(event);
    setFormOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    const result = await deleteTimelineEvent(eventId);
    if (!result.success) {
      toast.error(result.error || 'Failed to delete event');
      return;
    }
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    toast.success('Event deleted.');
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = events.findIndex((e) => e.id === active.id);
    const newIndex = events.findIndex((e) => e.id === over.id);

    const reordered = arrayMove(events, oldIndex, newIndex);
    setEvents(reordered);

    const items = reordered.map((e, i) => ({ id: e.id, display_order: i }));
    const result = await updateTimelineEventOrder(items);
    if (!result.success) {
      toast.error(result.error || 'Failed to update order');
      setEvents(initialEvents);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingEvent(null);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={events.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          {events.map((event) => (
            <SortableEventItem
              key={event.id}
              event={event}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </SortableContext>
      </DndContext>

      {events.length === 0 && !formOpen && (
        <div className="text-center py-8 text-muted-foreground">
          No events yet. Add the first event to this timeline.
        </div>
      )}

      {formOpen && (
        <EventFormInline
          onClose={handleFormClose}
          timelineId={timelineId}
          language={language}
          event={editingEvent}
          nextOrder={events.length}
        />
      )}

      {!formOpen && (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-1"
          onClick={handleAdd}
        >
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      )}
    </div>
  );
};

export default EventList;
