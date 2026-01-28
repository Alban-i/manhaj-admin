'use server';

import { createClient } from '@/providers/supabase/server';
import { revalidatePath } from 'next/cache';

interface DeleteProjectResult {
  success: boolean;
  error?: string;
}

const deleteImageProject = async (id: string): Promise<DeleteProjectResult> => {
  const supabase = await createClient();

  const { error } = await supabase
    .from('image_projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting image project:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/images');
  return { success: true };
};

export default deleteImageProject;
