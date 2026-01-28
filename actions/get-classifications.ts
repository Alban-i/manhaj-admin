import { createClient } from '@/providers/supabase/server';
import {
  Classification,
  ClassificationTranslation,
  ClassificationWithTranslations,
} from '@/types/types';

export default async function getClassifications(): Promise<
  ClassificationWithTranslations[]
> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('classifications')
      .select(
        `
        *,
        translations:classification_translations(*)
      `
      )
      .order('id');

    if (error) {
      console.error('Error fetching classifications:', error);
      return [];
    }

    return data as ClassificationWithTranslations[];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export async function getClassificationById(
  id: number
): Promise<ClassificationWithTranslations | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('classifications')
      .select(
        `
        *,
        translations:classification_translations(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching classification:', error);
      return null;
    }

    return data as ClassificationWithTranslations;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function getClassificationBySlug(
  slug: string
): Promise<ClassificationWithTranslations | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('classifications')
      .select(
        `
        *,
        translations:classification_translations(*)
      `
      )
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching classification:', error);
      return null;
    }

    return data as ClassificationWithTranslations;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function getClassificationTranslations(
  classificationId: number
): Promise<ClassificationTranslation[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('classification_translations')
      .select('*')
      .eq('classification_id', classificationId);

    if (error) {
      console.error('Error fetching classification translations:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}
