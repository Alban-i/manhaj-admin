import { Database } from './types_db';

export type Roles = Database['public']['Tables']['roles']['Row'];
export type Role = 'admin' | 'author' | 'reader' | 'banned';

export type Language = Database['public']['Tables']['languages']['Row'];
export type LanguageCode = 'ar' | 'en' | 'fr' | 'de' | 'es';
export type TextDirection = 'ltr' | 'rtl';

export type ArticleStatus = 'Draft' | 'Published' | 'System' | 'Archived';
export type ThemeStatus = 'draft' | 'published' | 'archived';

// Article translation (the actual article content in a specific language)
export type ArticleTranslation = Database['public']['Tables']['article_translations']['Row'];
// Article metadata (shared across translations)
export type Article = Database['public']['Tables']['articles']['Row'];
// Legacy alias for compatibility
export type Articles = Omit<ArticleTranslation, 'status' | 'category_id'> & {
  status: ArticleStatus;
  category_id: string | null;
  is_published: boolean;
};

export type Posts = Database['public']['Tables']['posts']['Row'];

export type Users = Database['public']['Tables']['profiles']['Row'];
export type Profiles = Database['public']['Tables']['profiles']['Row'];

export type ProfilesWithRoles = Profiles & {
  role_id: Roles;
};

export type Tags = Database['public']['Tables']['tags']['Row'];

export type TagTranslation =
  Database['public']['Tables']['tag_translations']['Row'];

export type TagWithTranslations = Tags & {
  translations: TagTranslation[];
};

export type Tasks = Omit<
  Database['public']['Tables']['tasks']['Row'],
  'owner_id'
> & {
  owner_id: null | {
    id: string;
    full_name: string;
  };
};

export type ClassificationSlug =
  | 'individual'
  | 'organization'
  | 'institution'
  | 'collective';

export type Classification =
  Database['public']['Tables']['classifications']['Row'];

export type ClassificationTranslation =
  Database['public']['Tables']['classification_translations']['Row'];

export type ClassificationWithTranslations = Classification & {
  translations: ClassificationTranslation[];
};

export type TypeTranslation =
  Database['public']['Tables']['type_translations']['Row'];

export type Type = Database['public']['Tables']['types']['Row'];

export type TypeWithTranslations = Type & {
  translations: TypeTranslation[];
  classification: ClassificationWithTranslations;
};

// Theme translation (the theme content in a specific language)
export type ThemeTranslation = Database['public']['Tables']['theme_translations']['Row'];
// Theme metadata (shared across translations)
export type ThemeMetadata = Database['public']['Tables']['themes']['Row'];
// Legacy alias for compatibility
export type Theme = ThemeTranslation;

export type ThemeArticle = Database['public']['Tables']['theme_articles']['Row'];

export type EventDatePrecision = 'day' | 'month' | 'year' | 'decade' | 'century';

// Timeline types (new lightweight timelines)
export type TimelineStatus = 'draft' | 'published' | 'archived';
export type TimelineMetadata = Database['public']['Tables']['timelines']['Row'];
export type TimelineTranslation = Database['public']['Tables']['timeline_translations']['Row'];
export type Timeline = TimelineTranslation;
export type TimelineEventRow = Database['public']['Tables']['timeline_events']['Row'];
export type TimelineEventTranslationRow = Database['public']['Tables']['timeline_event_translations']['Row'];

export type ImagePreset = Database['public']['Tables']['image_presets']['Row'];
export type ImageProject = Database['public']['Tables']['image_projects']['Row'];

// Fatawa types
export type FatwaStatus = 'draft' | 'published' | 'archived';

export type FatwaClassification = Database['public']['Tables']['fatwa_classifications']['Row'];
export type FatwaClassificationTranslation = Database['public']['Tables']['fatwa_classification_translations']['Row'];
export type FatwaClassificationWithTranslations = FatwaClassification & {
  fatwa_classification_translations: FatwaClassificationTranslation[];
};

export type Fatwa = Database['public']['Tables']['fatawa']['Row'];
export type FatwaTranslation = Database['public']['Tables']['fatwa_translations']['Row'];

export type FatwaInList = Omit<FatwaTranslation, 'status'> & {
  status: FatwaStatus;
};
