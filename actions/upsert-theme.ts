'use server';

import { createClient } from '@/providers/supabase/server';
import { revalidatePath } from 'next/cache';

export interface UpsertThemeInput {
  id?: string;
  slug: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  status?: string;
  language?: string | null;
  category_id?: number | null;
  is_original?: boolean;
  theme_id?: string | null;
}

export interface UpsertThemeResult {
  success: boolean;
  data?: {
    id: string;
    slug: string;
  };
  error?: string;
}

export async function upsertTheme(
  input: UpsertThemeInput
): Promise<UpsertThemeResult> {
  const supabase = await createClient();

  const themeData = {
    slug: input.slug,
    title: input.title,
    description: input.description || null,
    image_url: input.image_url || null,
    status: input.status ?? 'draft',
    language: input.language || 'ar',
    category_id: input.category_id || null,
    is_original: input.is_original ?? true,
    theme_id: input.theme_id || null,
    ...(input.id && { id: input.id }),
  };

  const { data, error } = await supabase
    .from('theme_translations')
    .upsert(themeData)
    .select('id, slug')
    .single();

  if (error) {
    console.error('Error upserting theme:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath('/themes');
  revalidatePath(`/themes/${data.slug}`);

  return {
    success: true,
    data: {
      id: data.id,
      slug: data.slug,
    },
  };
}

export interface AddArticleToThemeInput {
  theme_id: string;
  article_id: string;
  display_order?: number;
  custom_event_date_hijri?: string | null;
  custom_event_date_gregorian?: string | null;
  custom_title?: string | null;
  parent_id?: string | null;
}

export async function addArticleToTheme(
  input: AddArticleToThemeInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from('theme_articles').upsert(
    {
      theme_id: input.theme_id,
      article_id: input.article_id,
      display_order: input.display_order ?? 0,
      custom_event_date_hijri: input.custom_event_date_hijri || null,
      custom_event_date_gregorian: input.custom_event_date_gregorian || null,
      custom_title: input.custom_title || null,
      parent_id: input.parent_id || null,
    },
    { onConflict: 'theme_id,article_id' }
  );

  if (error) {
    console.error('Error adding article to theme:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}

export async function removeArticleFromTheme(
  themeId: string,
  articleId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // First, get the theme_article id for this article
  const { data: eventData, error: fetchError } = await supabase
    .from('theme_articles')
    .select('id')
    .eq('theme_id', themeId)
    .eq('article_id', articleId)
    .single();

  if (fetchError) {
    console.error('Error fetching theme article:', fetchError);
    return {
      success: false,
      error: fetchError.message,
    };
  }

  // Promote any children to top level by setting their parent_id to null
  const { error: promoteError } = await supabase
    .from('theme_articles')
    .update({ parent_id: null })
    .eq('parent_id', eventData.id);

  if (promoteError) {
    console.error('Error promoting children:', promoteError);
  }

  // Now delete the event
  const { error } = await supabase
    .from('theme_articles')
    .delete()
    .eq('theme_id', themeId)
    .eq('article_id', articleId);

  if (error) {
    console.error('Error removing article from theme:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}

// Set or change the parent of an event (for indent/outdent operations)
export async function setEventParent(
  eventId: string,
  parentId: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // If setting a parent, verify it's not already a child (max 2 levels)
  if (parentId) {
    const { data: parentData, error: parentCheckError } = await supabase
      .from('theme_articles')
      .select('parent_id')
      .eq('id', parentId)
      .single();

    if (parentCheckError) {
      console.error('Error checking parent:', parentCheckError);
      return {
        success: false,
        error: 'Could not verify parent event.',
      };
    }

    if (parentData.parent_id !== null) {
      return {
        success: false,
        error: 'Cannot nest more than 2 levels deep.',
      };
    }

    // Also verify this event doesn't have children (a parent can't become a child)
    const { data: childrenData, error: childrenError } = await supabase
      .from('theme_articles')
      .select('id')
      .eq('parent_id', eventId)
      .limit(1);

    if (childrenError) {
      console.error('Error checking children:', childrenError);
      return {
        success: false,
        error: 'Could not verify event children.',
      };
    }

    if (childrenData && childrenData.length > 0) {
      return {
        success: false,
        error: 'Cannot make an event with children into a child.',
      };
    }
  }

  const { error } = await supabase
    .from('theme_articles')
    .update({ parent_id: parentId })
    .eq('id', eventId);

  if (error) {
    console.error('Error setting event parent:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}

export async function updateThemeArticleOrder(
  items: { id: string; display_order: number }[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Update each item's display order
  for (const item of items) {
    const { error } = await supabase
      .from('theme_articles')
      .update({ display_order: item.display_order })
      .eq('id', item.id);

    if (error) {
      console.error('Error updating theme article order:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  return { success: true };
}

export async function deleteTheme(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from('theme_translations').delete().eq('id', id);

  if (error) {
    console.error('Error deleting theme:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath('/themes');

  return { success: true };
}
