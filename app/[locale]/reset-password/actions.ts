'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/providers/supabase/server';

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  const password = formData.get('password') as string;

  try {
    // Update the user's password
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    // Revalidate the layout to update auth state
    revalidatePath('/', 'layout');

    return { ok: true, message: 'Mot de passe mis à jour avec succès.' };
  } catch (err) {
    return { ok: false, status: 500, message: (err as Error).message };
  }
}
