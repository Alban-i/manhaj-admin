import { createClient } from '@/providers/supabase/server';

export interface TranslationGroupData {
  id: string;
  author_id: string | null;
  category_id: number | null;
  individual_id: number | null;
  image_url: string | null;
  tags: number[];
}

export default async function getTranslationGroup(
  translationGroupId: string | null
): Promise<TranslationGroupData | null> {
  if (!translationGroupId) {
    return null;
  }

  const supabase = await createClient();

  // Get translation group data
  const { data: group, error: groupError } = await supabase
    .from('translation_groups')
    .select('id, author_id, category_id, individual_id, image_url')
    .eq('id', translationGroupId)
    .single();

  if (groupError || !group) {
    console.error('Error fetching translation group:', groupError);
    return null;
  }

  // Get tags for this translation group
  const { data: tags, error: tagsError } = await supabase
    .from('translation_group_tags')
    .select('tag_id')
    .eq('translation_group_id', translationGroupId);

  if (tagsError) {
    console.error('Error fetching translation group tags:', tagsError);
    return {
      ...group,
      tags: [],
    };
  }

  return {
    ...group,
    tags: tags.map((t) => t.tag_id),
  };
}
