'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import DeleteButton from '@/components/delete-btn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/providers/supabase/client';
import { Language } from '@/types/types';

const formSchema = z.object({
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(5, 'Code must be at most 5 characters')
    .regex(/^[a-z]+$/, 'Code must be lowercase letters only'),
  name: z.string().min(1, 'Name is required'),
  native_name: z.string().min(1, 'Native name is required'),
  direction: z.enum(['ltr', 'rtl']),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
});

interface LanguageFormProps {
  language: Language | null;
}

const LanguageForm: React.FC<LanguageFormProps> = ({ language }) => {
  const defaultValues = language || {
    code: '',
    name: '',
    native_name: '',
    direction: 'ltr' as const,
    is_active: true,
    sort_order: 0,
  };

  const [loading, setLoading] = useState(false);
  const isEditing = !!language;

  const supabase = createClient();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: defaultValues.code ?? '',
      name: defaultValues.name ?? '',
      native_name: defaultValues.native_name ?? '',
      direction: (defaultValues.direction as 'ltr' | 'rtl') ?? 'ltr',
      is_active: defaultValues.is_active ?? true,
      sort_order: defaultValues.sort_order ?? 0,
    },
  });

  // Labels
  const toastMessage = language ? 'Language updated.' : 'Language created.';
  const action = language ? 'Save changes' : 'Create';

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      if (language) {
        // Update existing language
        const { error } = await supabase
          .from('languages')
          .update({
            name: values.name,
            native_name: values.native_name,
            direction: values.direction,
            is_active: values.is_active,
            sort_order: values.sort_order,
            updated_at: new Date().toISOString(),
          })
          .eq('code', language.code);

        if (error) {
          toast.error(error.message);
          return;
        }
      } else {
        // Create new language
        const { data, error } = await supabase
          .from('languages')
          .insert({
            code: values.code,
            name: values.name,
            native_name: values.native_name,
            direction: values.direction,
            is_active: values.is_active,
            sort_order: values.sort_order,
          })
          .select()
          .single();

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data) {
          router.push(`/languages/${data.code}`);
        }
      }

      toast.success(toastMessage);
      router.refresh();
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!language) {
      return;
    }

    try {
      const { error } = await supabase
        .from('languages')
        .delete()
        .eq('code', language.code);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Language deleted successfully.');
      router.push('/languages');
      router.refresh();
    } catch (error) {
      toast.error('Something went wrong when trying to delete');
    }
  };

  return (
    <div className="p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <fieldset disabled={loading} className="grid grid-cols-1 gap-2">
            {/* HEADER */}
            <Card>
              <CardHeader className="grid grid-cols-[1fr_auto] items-center gap-4">
                <CardTitle>
                  {language ? `${language.native_name} (${language.code})` : 'New language'}
                </CardTitle>
                <div className="flex gap-2">
                  {language && (
                    <DeleteButton label="Delete Language" fn={onDelete} />
                  )}
                  <Button type="submit">{action}</Button>
                </div>
              </CardHeader>
            </Card>

            {/* DETAILS */}
            <Card>
              <CardHeader>
                <CardTitle>Language Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="en"
                          {...field}
                          disabled={isEditing}
                          className={isEditing ? 'bg-muted' : ''}
                        />
                      </FormControl>
                      <FormDescription>
                        ISO 639-1 code (e.g., en, fr, ar)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="English" {...field} />
                      </FormControl>
                      <FormDescription>
                        Name in English
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="native_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Native Name</FormLabel>
                      <FormControl>
                        <Input placeholder="English" {...field} />
                      </FormControl>
                      <FormDescription>
                        Name in the language itself
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="direction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Text Direction</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl className="w-full">
                          <SelectTrigger>
                            <SelectValue placeholder="Select direction" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ltr">Left to Right (LTR)</SelectItem>
                          <SelectItem value="rtl">Right to Left (RTL)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Display order in lists (lower = first)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0 border rounded-md p-3 h-fit mt-auto">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Available for content creation
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </fieldset>
        </form>
      </Form>
    </div>
  );
};

export default LanguageForm;
