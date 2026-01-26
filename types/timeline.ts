import { Json } from '@/types/types_db';

// Base timeline event interface
export interface TimelineEvent {
  id: string;
  timeline_id: string;
  article_id: string;
  display_order: number | null;
  custom_event_date_hijri: string | null;
  custom_event_date_gregorian: string | null;
  custom_title: string | null;
  created_at: string | null;
  parent_id: string | null;
  article: {
    id: string;
    title: string;
    slug: string;
    summary: string;
    content: string;
    content_json: Json | null;
    image_url: string | null;
    event_date_hijri: string | null;
    event_date_hijri_year: number | null;
    event_date_gregorian: string | null;
    event_date_precision: string | null;
    language: string;
  };
}

// Extended type for nested events (with children array)
export interface TimelineEventNested extends TimelineEvent {
  children: TimelineEvent[];
}

// Helper function to build nested structure from flat list
export function nestEvents(events: TimelineEvent[]): TimelineEventNested[] {
  // Create a map for quick lookup
  const eventMap = new Map<string, TimelineEventNested>();

  // First pass: create nested versions of all events
  events.forEach(event => {
    eventMap.set(event.id, { ...event, children: [] });
  });

  // Second pass: build the tree structure
  const rootEvents: TimelineEventNested[] = [];

  events.forEach(event => {
    const nestedEvent = eventMap.get(event.id)!;

    if (event.parent_id && eventMap.has(event.parent_id)) {
      // This is a child event, add to parent's children
      const parent = eventMap.get(event.parent_id)!;
      parent.children.push(nestedEvent);
    } else {
      // This is a root event (no parent or parent not found)
      rootEvents.push(nestedEvent);
    }
  });

  // Sort children by display_order
  rootEvents.forEach(event => {
    event.children.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  });

  return rootEvents;
}
