import { createClient } from '@/providers/supabase/server';
import { Type, TypeWithTranslations } from '@/types/types';

export default async function getTypes(): Promise<Type[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('types')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching types:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export async function getTypesWithTranslations(): Promise<
  TypeWithTranslations[]
> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('types')
      .select(
        `
        *,
        translations:type_translations(*),
        classification:classifications(
          *,
          translations:classification_translations(*)
        )
      `
      )
      .order('name');

    if (error) {
      console.error('Error fetching types with translations:', error);
      return [];
    }

    return data as TypeWithTranslations[];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export async function getTypeBySlug(slug: string): Promise<Type | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('types')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching type:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function getTypeBySlugWithTranslations(
  slug: string
): Promise<TypeWithTranslations | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('types')
      .select(
        `
        *,
        translations:type_translations(*),
        classification:classifications(
          *,
          translations:classification_translations(*)
        )
      `
      )
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching type with translations:', error);
      return null;
    }

    return data as TypeWithTranslations;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function getTypeById(identifier: string): Promise<Type | null> {
  const supabase = await createClient();

  try {
    // Check if identifier is numeric (types use numeric IDs)
    const isNumeric = /^\d+$/.test(identifier);

    let query = supabase.from('types').select('*');

    if (isNumeric) {
      query = query.eq('id', parseInt(identifier));
    } else {
      query = query.eq('slug', identifier);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error('Error fetching type:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function getTypeByIdWithTranslations(
  identifier: string
): Promise<TypeWithTranslations | null> {
  const supabase = await createClient();

  try {
    // Check if identifier is numeric (types use numeric IDs)
    const isNumeric = /^\d+$/.test(identifier);

    let query = supabase.from('types').select(
      `
        *,
        translations:type_translations(*),
        classification:classifications(
          *,
          translations:classification_translations(*)
        )
      `
    );

    if (isNumeric) {
      query = query.eq('id', parseInt(identifier));
    } else {
      query = query.eq('slug', identifier);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error('Error fetching type with translations:', error);
      return null;
    }

    return data as TypeWithTranslations;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
