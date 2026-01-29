import { createClient } from '@/providers/supabase/server';

export interface IndividualGroupOption {
  id: string; // individual_id (UUID)
  name: string; // localized name
  original_name: string | null;
}

export async function getIndividualGroupsForSelect(
  locale: string
): Promise<IndividualGroupOption[]> {
  const supabase = await createClient();

  // Fetch all individual metadata with their translations
  const { data: groups, error } = await supabase
    .from('individuals')
    .select(
      `
      id,
      original_name,
      individual_translations (
        name,
        language
      )
    `
    )
    .order('original_name', { ascending: true });

  if (error) {
    console.error('Error fetching individual groups for select:', error);
    return [];
  }

  if (!groups) {
    return [];
  }

  // Map groups to options with localized names
  const options: IndividualGroupOption[] = groups.map((group) => {
    const translations = group.individual_translations as Array<{
      name: string;
      language: string;
    }> | null;

    // Find name in requested locale, fallback to 'ar', then original_name, then first available
    let name = group.original_name || '';

    if (translations && translations.length > 0) {
      const localeTranslation = translations.find((i) => i.language === locale);
      const arabicTranslation = translations.find((i) => i.language === 'ar');
      const firstTranslation = translations[0];

      if (localeTranslation) {
        name = localeTranslation.name;
      } else if (arabicTranslation) {
        name = arabicTranslation.name;
      } else if (group.original_name) {
        name = group.original_name;
      } else if (firstTranslation) {
        name = firstTranslation.name;
      }
    }

    return {
      id: group.id,
      name,
      original_name: group.original_name,
    };
  });

  // Sort by localized name
  return options.sort((a, b) => a.name.localeCompare(b.name));
}
