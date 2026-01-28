'use server';

import { createClient } from '@/providers/supabase/server';
import { revalidatePath } from 'next/cache';

type TranslationInput = {
  language: string;
  name: string;
};

export async function upsertTagTranslations(
  tagId: number,
  translations: TranslationInput[]
) {
  const supabase = await createClient();

  // Filter out empty translations
  const validTranslations = translations.filter(
    (t) => t.name && t.name.trim() !== ''
  );

  if (validTranslations.length === 0) {
    return { success: false, error: 'At least one translation is required' };
  }

  // Upsert each translation
  const upsertData = validTranslations.map((t) => ({
    tag_id: tagId,
    language: t.language,
    name: t.name.trim(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('tag_translations')
    .upsert(upsertData, {
      onConflict: 'tag_id,language',
    });

  if (error) {
    console.error('Error upserting tag translations:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/[locale]/tags', 'page');
  revalidatePath('/[locale]/tags/[slug]', 'page');

  return { success: true };
}
