'use client';

import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';

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
import { login, resetPassword, signup } from '../actions';
import { createClient } from '@/providers/supabase/client';

const url =
  process.env.NODE_ENV === 'development'
    ? process.env.NEXT_PUBLIC_FRONTEND_URL_DEV
    : process.env.NEXT_PUBLIC_SITE_URL;

export function LoginForm() {
  const t = useTranslations('auth');
  const pathname = '/';
  const [scenario, setScenario] = useState<
    'login' | 'signup' | 'resetpassword'
  >('login');
  const [loading, setLoading] = useState(false);

  const formSchema = z.object({
    email: z.string().email({ message: t('validation.invalidEmail') }),
    password: z
      .string()
      .min(8, {
        message: t('validation.passwordMinLength'),
      })
      .regex(/[a-zA-Z]/, {
        message: t('validation.passwordLetter'),
      })
      .regex(/[0-9]/, {
        message: t('validation.passwordNumber'),
      })
      .refine((val) => scenario === 'resetpassword' || val !== '', {
        message: t('validation.passwordRequired'),
      })
      .or(z.literal('')), // Allow empty password if scenario is 'resetpassword'
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const formData = new FormData();
    formData.append('email', values.email);
    formData.append('password', values.password);

    let response;
    if (scenario === 'login') {
      response = await login(formData);
    } else if (scenario === 'signup') {
      response = await signup(formData);
    } else if (scenario === 'resetpassword') {
      response = await resetPassword(formData);
    }

    if (response && !response.ok) {
      setLoading(false);
      return toast.error(response ? response.message : 'Unknown error');
    }

    if (scenario === 'signup' || scenario === 'resetpassword') {
      toast.success(response?.message);
    } else {
      setLoading(false);
    }
  }

  // Login with Google
  async function signInWithGoogle() {
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: url + '/api/auth/callback?next=' + pathname,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  }

  // Login with Microsoft
  async function signInWithAzure() {
    const supabase = await createClient();

    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: url + '/api/auth/callback?next=' + pathname,
        scopes: 'email GroupMember.Read.All openid profile User.Read',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  }

  const title =
    scenario === 'login'
      ? t('login')
      : scenario === 'signup'
      ? t('signup')
      : t('resetPassword');

  return (
    <Card className="mx-auto max-w-sm min-w-80">
      <CardHeader>
        <CardTitle className="text-2xl text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset disabled={loading}>
              <div className="grid gap-4">
                {/* EMAIL */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">{t('email')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('emailPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PASSWORD */}
                {scenario !== 'resetpassword' && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">
                          {t('password')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={t('passwordPlaceholder')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {scenario === 'login' && (
                  <Button type="submit" className="w-full mt-2">
                    {t('loginButton')}
                  </Button>
                )}

                {scenario === 'signup' && (
                  <Button type="submit" className="w-full mt-2 bg-sky-700">
                    {t('signupButton')}
                  </Button>
                )}

                {scenario === 'resetpassword' && (
                  <Button type="submit" className="w-full mt-2 bg-sky-700">
                    {t('resetPasswordButton')}
                  </Button>
                )}

                {/* FOOTER */}
                <div className="grid grid-cols-1 gap-2">
                  {(scenario === 'login' || scenario === 'signup') && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="underline"
                      onClick={() => setScenario('resetpassword')}
                    >
                      {t('forgotPassword')}
                    </Button>
                  )}

                  {(scenario === 'login' || scenario === 'resetpassword') && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="underline"
                      onClick={() => setScenario('signup')}
                    >
                      {t('createAccount')}
                    </Button>
                  )}

                  {(scenario === 'signup' || scenario === 'resetpassword') && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="underline"
                      onClick={() => setScenario('login')}
                    >
                      {t('existingAccount')}
                    </Button>
                  )}
                </div>
              </div>
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
