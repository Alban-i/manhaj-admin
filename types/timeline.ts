import { TimelineEventRow, TimelineEventTranslationRow } from './types';

export interface TimelineEvent extends TimelineEventRow {
  translations: TimelineEventTranslationRow[];
  translation?: TimelineEventTranslationRow;
  article?: {
    id: string;
    title: string;
    slug: string;
    image_url: string | null;
  } | null;
}
