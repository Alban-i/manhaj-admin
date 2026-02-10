'use server';

import { createClient } from '@/providers/supabase/server';
import { revalidatePath } from 'next/cache';

export async function reorderFatwaClassifications(
  items: { id: number; display_order: number }[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  for (const item of items) {
    const { error } = await supabase
      .from('fatwa_classifications')
      .update({ display_order: item.display_order })
      .eq('id', item.id);

    if (error) {
      console.error('Error updating fatwa classification order:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  revalidatePath('/fatwa-classifications');
  return { success: true };
}
