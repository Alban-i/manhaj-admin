import { createClient } from '@/providers/supabase/server';

export interface IndividualGroupOption {
  id: string; // translation_group_id (UUID)
  name: string; // localized name
  original_name: string | null;
}

export async function getIndividualGroupsForSelect(
  locale: string
): Promise<IndividualGroupOption[]> {
  const supabase = await createClient();

  // Fetch all individual translation groups with their individuals
  const { data: groups, error } = await supabase
    .from('individual_translation_groups')
    .select(
      `
      id,
      original_name,
      individuals (
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
    const individuals = group.individuals as Array<{
      name: string;
      language: string;
    }> | null;

    // Find name in requested locale, fallback to 'ar', then original_name, then first available
    let name = group.original_name || '';

    if (individuals && individuals.length > 0) {
      const localeIndividual = individuals.find((i) => i.language === locale);
      const arabicIndividual = individuals.find((i) => i.language === 'ar');
      const firstIndividual = individuals[0];

      if (localeIndividual) {
        name = localeIndividual.name;
      } else if (arabicIndividual) {
        name = arabicIndividual.name;
      } else if (group.original_name) {
        name = group.original_name;
      } else if (firstIndividual) {
        name = firstIndividual.name;
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
