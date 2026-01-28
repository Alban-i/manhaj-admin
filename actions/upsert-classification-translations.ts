'use server';

import { createClient } from '@/providers/supabase/server';
import { revalidatePath } from 'next/cache';

type TranslationInput = {
  language: string;
  name: string;
};

export async function upsertClassificationTranslations(
  classificationId: number,
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
    classification_id: classificationId,
    language: t.language,
    name: t.name.trim(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('classification_translations')
    .upsert(upsertData, {
      onConflict: 'classification_id,language',
    });

  if (error) {
    console.error('Error upserting classification translations:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/[locale]/classifications', 'page');
  revalidatePath('/[locale]/classifications/[slug]', 'page');
  revalidatePath('/[locale]/types', 'page');
  revalidatePath('/[locale]/types/[slug]', 'page');

  return { success: true };
}
