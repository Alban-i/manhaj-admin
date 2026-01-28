import { Database } from './types_db';

// Base types from database
export type ImagePreset = Database['public']['Tables']['image_presets']['Row'];
export type ImagePresetInsert = Database['public']['Tables']['image_presets']['Insert'];
export type ImagePresetUpdate = Database['public']['Tables']['image_presets']['Update'];

export type ImageProject = Database['public']['Tables']['image_projects']['Row'];
export type ImageProjectInsert = Database['public']['Tables']['image_projects']['Insert'];
export type ImageProjectUpdate = Database['public']['Tables']['image_projects']['Update'];

// Text position options
export type TextPosition = 'top' | 'center' | 'bottom';
export type TextAlignment = 'left' | 'center' | 'right';

// Text configuration interface (stored as JSONB)
export interface TextConfig {
  fontFamily: string;
  fontSize: number;
  color: string;
  position: TextPosition;
  alignment: TextAlignment;
  bgColor: string;
  bgOpacity: number;
}

// Default text configuration
export const DEFAULT_TEXT_CONFIG: TextConfig = {
  fontFamily: 'Inter',
  fontSize: 48,
  color: '#ffffff',
  position: 'center',
  alignment: 'center',
  bgColor: '#000000',
  bgOpacity: 0.5,
};

// Common size presets
export interface SizePreset {
  name: string;
  width: number;
  height: number;
}

export const SIZE_PRESETS: SizePreset[] = [
  { name: 'OG Image', width: 1200, height: 630 },
  { name: 'Twitter Card', width: 1200, height: 600 },
  { name: 'Instagram Post', width: 1080, height: 1080 },
  { name: 'Facebook Cover', width: 820, height: 312 },
];

// Extended preset with creator info (for display)
export interface ImagePresetWithCreator extends ImagePreset {
  creator?: {
    id: string;
    full_name: string | null;
  } | null;
}

// Extended project with preset and creator info (for display)
export interface ImageProjectWithRelations extends ImageProject {
  preset?: ImagePreset | null;
  creator?: {
    id: string;
    full_name: string | null;
  } | null;
}

// Form data types for creating/updating
export interface ImagePresetFormData {
  name: string;
  prompt_template: string;
  style_reference_url?: string | null;
  width: number;
  height: number;
  text_config: TextConfig;
}

export interface ImageProjectFormData {
  name: string;
  preset_id?: string | null;
  width: number;
  height: number;
  generation_prompt?: string | null;
  style_reference_url?: string | null;
  text_content: string;
  text_config: TextConfig;
}

// Available font families for text overlay
export const FONT_FAMILIES = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Amiri', label: 'Amiri (Arabic)' },
  { value: 'Scheherazade New', label: 'Scheherazade New (Arabic)' },
  { value: 'Noto Sans Arabic', label: 'Noto Sans Arabic' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Arial', label: 'Arial' },
];

// AI Image Generation Models
export type AIGenerationModel = 'regular' | 'pro';

export interface AIModelOption {
  value: AIGenerationModel;
  labelKey: string; // Translation key
}

export const AI_MODEL_OPTIONS: AIModelOption[] = [
  { value: 'regular', labelKey: 'regularModel' },
  { value: 'pro', labelKey: 'proModel' },
];
