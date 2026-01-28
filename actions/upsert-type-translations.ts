'use server';

import { createClient } from '@/providers/supabase/server';
import { revalidatePath } from 'next/cache';

type TranslationInput = {
  language: string;
  name: string;
  description?: string;
};

export async function upsertTypeTranslations(
  typeId: number,
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
    type_id: typeId,
    language: t.language,
    name: t.name.trim(),
    description: t.description?.trim() || null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('type_translations')
    .upsert(upsertData, {
      onConflict: 'type_id,language',
    });

  if (error) {
    console.error('Error upserting type translations:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/[locale]/types', 'page');
  revalidatePath('/[locale]/types/[slug]', 'page');

  return { success: true };
}
