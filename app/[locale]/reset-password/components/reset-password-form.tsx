'use client';

import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { toast } from 'sonner';
import { updatePassword } from '../actions';

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, {
        message: 'Le mot de passe doit contenir au moins 8 caractères.',
      })
      .regex(/[a-zA-Z]/, {
        message: 'Le mot de passe doit contenir au moins une lettre.',
      })
      .regex(/[0-9]/, {
        message: 'Le mot de passe doit contenir au moins un chiffre.',
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  });

export default function ResetPasswordForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const formData = new FormData();
    formData.append('password', values.password);

    try {
      const response = await updatePassword(formData);

      if (response && !response.ok) {
        setLoading(false);
        return toast.error(response.message);
      }

      toast.success(
        'Mot de passe mis à jour avec succès. Vous êtes maintenant connecté.'
      );

      // Small delay to let the user see the success message
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error) {
      setLoading(false);
      toast.error(
        'Une erreur est survenue lors de la mise à jour du mot de passe.'
      );
    }
  }

  return (
    <Card className="mx-auto max-w-sm min-w-80">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          Nouveau mot de passe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset disabled={loading}>
              <div className="grid gap-4">
                {/* NEW PASSWORD */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">
                        Nouveau mot de passe
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Entrez votre nouveau mot de passe"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CONFIRM PASSWORD */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">
                        Confirmer le mot de passe
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirmez votre nouveau mot de passe"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full mt-2">
                  {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="underline"
                  onClick={() => router.push('/login')}
                >
                  Retour à la connexion
                </Button>
              </div>
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
