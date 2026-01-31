import { Database } from './types_db';

// Base types from database
export type ImagePreset = Database['public']['Tables']['image_presets']['Row'];
export type ImagePresetInsert = Database['public']['Tables']['image_presets']['Insert'];
export type ImagePresetUpdate = Database['public']['Tables']['image_presets']['Update'];

export type ImageProject = Database['public']['Tables']['image_projects']['Row'];
export type ImageProjectInsert = Database['public']['Tables']['image_projects']['Insert'];
export type ImageProjectUpdate = Database['public']['Tables']['image_projects']['Update'];

// Common size presets
export interface SizePreset {
  name: string;
  width: number;
  height: number;
}

export const SIZE_PRESETS: SizePreset[] = [
  { name: 'HD 16:9', width: 1600, height: 900 },
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
}

export interface ImageProjectFormData {
  name: string;
  preset_id?: string | null;
  width: number;
  height: number;
  generation_prompt?: string | null;
  style_reference_url?: string | null;
  // Generation parameters
  aspect_ratio?: string | null;
  person_generation?: PersonGeneration;
  enhance_prompt?: boolean;
  seed?: number | null;
  image_size?: ImageSize;
  ai_model?: AIGenerationModel;
  reference_images?: ReferenceImageRow[];
}

// AI Image Generation Models
export type AIGenerationModel = 'nano-banana' | 'nano-banana-pro' | 'gemini-flash' | 'gemini-pro';

// Person generation options for Imagen
export type PersonGeneration = 'dont_allow' | 'allow_adult' | 'allow_all';

// Image size options for Gemini
export type ImageSize = '1K' | '2K' | '4K';

// Aspect ratio options per model family
export const IMAGEN_ASPECT_RATIOS = ['1:1', '3:4', '4:3', '16:9', '9:16'] as const;
export const GEMINI_ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'] as const;

export interface AIModelOption {
  value: AIGenerationModel;
  labelKey: string; // Translation key
  descriptionKey: string; // Translation key for description
  supportsReferenceImages: boolean;
  maxReferenceImages: number;
  estimatedCost: number; // USD per generation
  // Capability flags
  supportsPersonGeneration: boolean;
  supportsSeed: boolean;
  supportsEnhancePrompt: boolean;
  supportsImageSize: boolean;
  aspectRatioOptions: readonly string[];
  imageSizeOptions: readonly ImageSize[]; // Available image sizes for this model
}

export const AI_MODEL_OPTIONS: AIModelOption[] = [
  {
    value: 'nano-banana',
    labelKey: 'nanoBanana',
    descriptionKey: 'nanoBananaDesc',
    supportsReferenceImages: false,
    maxReferenceImages: 0,
    estimatedCost: 0.02,
    supportsPersonGeneration: true,
    supportsSeed: true,
    supportsEnhancePrompt: true,
    supportsImageSize: true,
    aspectRatioOptions: IMAGEN_ASPECT_RATIOS,
    imageSizeOptions: ['1K', '2K'],
  },
  {
    value: 'nano-banana-pro',
    labelKey: 'nanoBananaPro',
    descriptionKey: 'nanoBananaProDesc',
    supportsReferenceImages: false,
    maxReferenceImages: 0,
    estimatedCost: 0.04,
    supportsPersonGeneration: true,
    supportsSeed: true,
    supportsEnhancePrompt: true,
    supportsImageSize: true,
    aspectRatioOptions: IMAGEN_ASPECT_RATIOS,
    imageSizeOptions: ['1K', '2K'],
  },
  {
    value: 'gemini-flash',
    labelKey: 'geminiFlashImage',
    descriptionKey: 'geminiFlashImageDesc',
    supportsReferenceImages: true,
    maxReferenceImages: 3,
    estimatedCost: 0.04,
    supportsPersonGeneration: false,
    supportsSeed: false,
    supportsEnhancePrompt: false,
    supportsImageSize: true,
    aspectRatioOptions: GEMINI_ASPECT_RATIOS,
    imageSizeOptions: ['1K'], // Flash only supports 1K
  },
  {
    value: 'gemini-pro',
    labelKey: 'geminiProImage',
    descriptionKey: 'geminiProImageDesc',
    supportsReferenceImages: true,
    maxReferenceImages: 14,
    estimatedCost: 0.15,
    supportsPersonGeneration: false,
    supportsSeed: false,
    supportsEnhancePrompt: false,
    supportsImageSize: true,
    aspectRatioOptions: GEMINI_ASPECT_RATIOS,
    imageSizeOptions: ['1K', '2K', '4K'], // Pro supports up to 4K
  },
];

// Reference image row for flexible reference images
export interface ReferenceImageRow {
  id: string;
  url: string;          // For preview
  base64?: string;      // For API
  mimeType?: string;    // For API
  description: string;  // User's description of how to use this image
}

// Prompt snippets for reference image descriptions
export interface ReferenceImageSnippet {
  id: string;
  labelKey: string; // Translation key
  text: string;     // Text to append
}

export const REFERENCE_IMAGE_SNIPPETS: ReferenceImageSnippet[] = [
  {
    id: 'style',
    labelKey: 'snippetStyle',
    text: 'Use the artistic style and color palette from this image. ',
  },
  {
    id: 'expand',
    labelKey: 'snippetExpand',
    text: 'Extend this image to show more of the surrounding scene. ',
  },
  {
    id: 'variation',
    labelKey: 'snippetVariation',
    text: 'Create a similar composition but with different elements. ',
  },
];
