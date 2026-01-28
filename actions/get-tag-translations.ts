import { createClient } from '@/providers/supabase/server';
import { TagTranslation } from '@/types/types';

export async function getTagTranslations(tagId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tag_translations')
    .select('*')
    .eq('tag_id', tagId)
    .order('language');

  if (error) {
    console.error('Error fetching tag translations:', error);
    return [];
  }

  return data as TagTranslation[];
}

export async function getTagTranslationsByLanguage(
  tagId: number,
  language: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tag_translations')
    .select('*')
    .eq('tag_id', tagId)
    .eq('language', language)
    .single();

  if (error) {
    console.error('Error fetching tag translation:', error);
    return null;
  }

  return data as TagTranslation;
}
