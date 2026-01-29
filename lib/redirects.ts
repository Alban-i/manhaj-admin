import { createClient } from '@/providers/supabase/server';

/**
 * Utility functions to handle ID-to-slug redirects for backward compatibility
 */

export async function getArticleSlugById(id: string): Promise<string | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('article_translations')
    .select('slug')
    .eq('id', id)
    .single();
    
  if (error || !data) return null;
  return data.slug;
}

export async function getPostSlugById(id: string): Promise<string | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('posts')
    .select('slug')
    .eq('id', parseInt(id))
    .single();
    
  if (error || !data) return null;
  return data.slug;
}

export async function getMediaSlugById(id: string): Promise<string | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('media')
    .select('slug')
    .eq('id', id)
    .single();
    
  if (error || !data) return null;
  return data.slug;
}

export async function getCategorySlugById(id: string): Promise<string | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('categories')
    .select('slug')
    .eq('id', parseInt(id))
    .single();
    
  if (error || !data) return null;
  return data.slug;
}

export async function getTagSlugById(id: string): Promise<string | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('tags')
    .select('slug')
    .eq('id', parseInt(id))
    .single();
    
  if (error || !data) return null;
  return data.slug;
}

export async function getRoleSlugById(id: string): Promise<string | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('roles')
    .select('slug')
    .eq('id', parseInt(id))
    .single();
    
  if (error || !data) return null;
  return data.slug;
}

export async function getTypeSlugById(id: string): Promise<string | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('types')
    .select('slug')
    .eq('id', parseInt(id))
    .single();
    
  if (error || !data) return null;
  return data.slug;
}

export async function getIndividualSlugById(id: string): Promise<string | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('individual_translations')
    .select('slug')
    .eq('id', parseInt(id))
    .single();
    
  if (error || !data) return null;
  return data.slug;
}