import { createClient } from '@/providers/supabase/server';
import { FatwaInList } from '@/types/types';

type FatwaWithMetadata = FatwaInList & {
  classification_id: number | null;
  author_id: string | null;
  individual_id: string | null;
  source: string | null;
  source_url: string | null;
  media_id: string | null;
};

const getFatwa = async (
  identifier: string
): Promise<FatwaWithMetadata | null | 'error'> => {
  if (identifier === 'new') {
    return null;
  }

  const supabase = await createClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

  let query = supabase
    .from('fatwa_translations')
    .select(`
      *,
      fatawa (
        author_id,
        classification_id,
        individual_id,
        source,
        source_url,
        media_id
      )
    `);

  if (isUuid) {
    query = query.eq('id', identifier);
  } else {
    query = query.eq('slug', identifier);
  }

  const { data, error } = await query.single();

  if (error) {
    console.error('Error fetching fatwa:', error);
    return 'error';
  }

  if (!data) return null;

  const fatwaMetadata = data.fatawa as {
    author_id: string | null;
    classification_id: number | null;
    individual_id: string | null;
    source: string | null;
    source_url: string | null;
    media_id: string | null;
  } | null;

  return {
    ...data,
    author_id: fatwaMetadata?.author_id ?? null,
    classification_id: fatwaMetadata?.classification_id ?? null,
    individual_id: fatwaMetadata?.individual_id ?? null,
    source: fatwaMetadata?.source ?? null,
    source_url: fatwaMetadata?.source_url ?? null,
    media_id: fatwaMetadata?.media_id ?? null,
  };
};

export default getFatwa;
