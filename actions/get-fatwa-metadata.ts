import { createClient } from '@/providers/supabase/server';

export interface FatwaMetadataData {
  id: string;
  author_id: string | null;
  classification_id: number | null;
  individual_id: string | null;
  source: string | null;
  source_url: string | null;
  media_id: string | null;
  tags: number[];
}

export default async function getFatwaMetadata(
  fatwaId: string | null
): Promise<FatwaMetadataData | null> {
  if (!fatwaId) {
    return null;
  }

  const supabase = await createClient();

  const { data: fatwa, error: fatwaError } = await supabase
    .from('fatawa')
    .select('id, author_id, classification_id, individual_id, source, source_url, media_id')
    .eq('id', fatwaId)
    .single();

  if (fatwaError || !fatwa) {
    console.error('Error fetching fatwa metadata:', fatwaError);
    return null;
  }

  // Get tags for this fatwa translation (we need to find the original)
  const { data: originalTranslation } = await supabase
    .from('fatwa_translations')
    .select('id')
    .eq('fatwa_id', fatwaId)
    .eq('is_original', true)
    .single();

  let tags: number[] = [];
  if (originalTranslation) {
    const { data: tagData } = await supabase
      .from('fatwa_tags')
      .select('tag_id')
      .eq('fatwa_id', originalTranslation.id);

    tags = tagData?.map((t) => t.tag_id) ?? [];
  }

  return {
    ...fatwa,
    tags,
  };
}
