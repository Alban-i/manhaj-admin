import { Database } from './types_db';

export type Roles = Database['public']['Tables']['roles']['Row'];
export type Role = 'admin' | 'author' | 'reader' | 'banned';

export type Language = Database['public']['Tables']['languages']['Row'];
export type LanguageCode = 'ar' | 'en' | 'fr' | 'de' | 'es';
export type TextDirection = 'ltr' | 'rtl';

export type ArticleStatus = 'Draft' | 'Published' | 'System' | 'Archived';
export type TimelineStatus = 'draft' | 'published' | 'archived';

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

// Timeline translation (the timeline content in a specific language)
export type TimelineTranslation = Database['public']['Tables']['timeline_translations']['Row'];
// Timeline metadata (shared across translations)
export type TimelineMetadata = Database['public']['Tables']['timelines']['Row'];
// Legacy alias for compatibility
export type Timeline = TimelineTranslation;

export type TimelineArticle = Database['public']['Tables']['timeline_articles']['Row'];

export type EventDatePrecision = 'day' | 'month' | 'year' | 'decade' | 'century';

export type ImagePreset = Database['public']['Tables']['image_presets']['Row'];
export type ImageProject = Database['public']['Tables']['image_projects']['Row'];
