'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import DeleteButton from '@/components/delete-btn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/providers/supabase/client';
import type { Classification } from '@/types/types';
import { generateSlug } from '@/lib/utils';
import { revalidateTypes } from '@/actions/revalidate';

const formSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  classification: z.enum([
    'individual',
    'organization',
    'institution',
    'collective',
  ]),
});

interface Type {
  id: number;
  name: string;
  description: string;
  created_at: string;
  classification: Classification;
}

interface TypeFormProps {
  type: Type | null;
}

const TypeForm: React.FC<TypeFormProps> = ({ type }) => {
  const defaultValues = type || {
    name: '',
    description: '',
    classification: 'individual',
  };

  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues.name ?? '',
      description: defaultValues.description ?? '',
      classification: defaultValues.classification ?? 'individual',
    },
  });

  // Labels
  const toastMessage = type ? 'Type updated.' : 'Type created.';
  const action = type ? 'Save changes' : 'Create';

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      if (type) {
        // Update existing type
        const { error } = await supabase
          .from('types')
          .update({
            name: values.name,
            description: values.description,
            classification: values.classification,
          })
          .eq('id', type.id);

        if (error) {
          toast.error(error.message);
          return;
        }
      } else {
        // Create new type
        const { data, error } = await supabase
          .from('types')
          .insert({
            name: values.name,
            description: values.description,
            classification: values.classification,
            slug: generateSlug(values.name),
          })
          .select()
          .single();

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data) {
          router.push(`/types/${data.slug}`);
        }
      }

      toast.success(toastMessage);

      // Revalidate frontend cache
      await revalidateTypes();

      router.refresh();
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!type) {
      return;
    }

    try {
      const { error } = await supabase.from('types').delete().eq('id', type.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Type deleted successfully.');

      // Revalidate frontend cache
      await revalidateTypes();

      router.push('/types');
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
                <CardTitle>{type ? type.name : 'New type'}</CardTitle>
                <div className="flex gap-2">
                  {type && <DeleteButton label="Delete Type" fn={onDelete} />}
                  <Button type="submit">{action}</Button>
                </div>
              </CardHeader>
            </Card>

            {/* DETAILS */}
            <Card>
              <CardHeader>
                <CardTitle>Type Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Type name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="classification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Classification</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={field.disabled}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select classification" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="individual">
                                Individual
                              </SelectItem>
                              <SelectItem value="organization">
                                Organization
                              </SelectItem>
                              <SelectItem value="institution">
                                Institution
                              </SelectItem>
                              <SelectItem value="collective">
                                Collective
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Type description"
                          {...field}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
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

export default TypeForm;
