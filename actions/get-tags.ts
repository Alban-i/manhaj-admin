import { createClient } from '@/providers/supabase/server';
import { Tags, TagWithTranslations } from '@/types/types';

/**
 * Get all tags with their Arabic translation as the display name.
 * This is a convenience function that returns tags with `localizedName` field
 * using Arabic as the default display language.
 */
export default async function getTags() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tags')
    .select(
      `
      *,
      translations:tag_translations(*)
    `
    )
    .order('slug');

  if (error) {
    console.error('Error fetching tags:', error);
    return [];
  }

  // Transform data to include Arabic name as the default display name
  return (data as TagWithTranslations[]).map((tag) => {
    const arabicTranslation = tag.translations.find((t) => t.language === 'ar');
    return {
      ...tag,
      // For backward compatibility, expose Arabic name as 'name'
      name: arabicTranslation?.name ?? tag.slug,
      localizedName: arabicTranslation?.name ?? tag.slug,
    };
  });
}

export async function getTagBySlug(slug: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching tag:', error);
      return null;
    }

    return data as Tags;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function getTagById(identifier: string) {
  const supabase = await createClient();

  try {
    // Check if identifier is numeric (tags use numeric IDs)
    const isNumeric = /^\d+$/.test(identifier);

    let query = supabase.from('tags').select('*');

    if (isNumeric) {
      query = query.eq('id', parseInt(identifier));
    } else {
      query = query.eq('slug', identifier);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error('Error fetching tag:', error);
      return null;
    }

    return data as Tags;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function getTagsWithTranslations(locale: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tags')
    .select(
      `
      *,
      translations:tag_translations(*)
    `
    )
    .order('slug');

  if (error) {
    console.error('Error fetching tags with translations:', error);
    return [];
  }

  // Transform data to include localized name
  return (data as TagWithTranslations[]).map((tag) => {
    const translation = tag.translations.find((t) => t.language === locale);
    const arabicTranslation = tag.translations.find((t) => t.language === 'ar');
    return {
      ...tag,
      // Fallback: requested locale -> Arabic -> slug
      localizedName: translation?.name ?? arabicTranslation?.name ?? tag.slug,
    };
  });
}

export async function getTagByIdWithTranslations(identifier: string) {
  const supabase = await createClient();

  try {
    const isNumeric = /^\d+$/.test(identifier);

    let query = supabase.from('tags').select(`
      *,
      translations:tag_translations(*)
    `);

    if (isNumeric) {
      query = query.eq('id', parseInt(identifier));
    } else {
      query = query.eq('slug', identifier);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error('Error fetching tag with translations:', error);
      return null;
    }

    return data as TagWithTranslations;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
