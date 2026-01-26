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
import { generateSlug } from '@/lib/utils';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/providers/supabase/client';

const formSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
});

interface Glossary {
  id: number;
  term: string;
  definition: string;
  created_at: string;
}

interface GlossaryFormProps {
  glossary: Glossary | null;
}

const GlossaryForm: React.FC<GlossaryFormProps> = ({ glossary }) => {
  const defaultValues = glossary || {
    term: '',
    definition: '',
  };

  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      term: defaultValues.term ?? '',
      definition: defaultValues.definition ?? '',
    },
  });

  // Labels
  const toastMessage = glossary ? 'Glossary updated.' : 'Glossary created.';
  const action = glossary ? 'Save changes' : 'Create';

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      if (glossary) {
        // Update existing glossary
        const { error } = await supabase
          .from('glossary')
          .update({
            term: values.term,
            definition: values.definition,
          })
          .eq('id', glossary.id);

        if (error) {
          toast.error(error.message);
          return;
        }
      } else {
        // Create new glossary
        const { data, error } = await supabase
          .from('glossary')
          .insert({
            term: values.term,
            definition: values.definition,
            slug: generateSlug(values.term),
          })
          .select()
          .single();

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data) {
          router.push(`/glossaries/${data.slug}`);
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
    if (!glossary) {
      return;
    }

    try {
      const { error } = await supabase
        .from('glossary')
        .delete()
        .eq('id', glossary.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Glossary deleted successfully.');
      router.push('/glossaries');
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
                  {glossary ? glossary.term : 'New glossary'}
                </CardTitle>
                <div className="flex gap-2">
                  {glossary && (
                    <DeleteButton label="Delete Glossary" fn={onDelete} />
                  )}
                  <Button type="submit">{action}</Button>
                </div>
              </CardHeader>
            </Card>

            {/* DETAILS */}
            <Card>
              <CardHeader>
                <CardTitle>Glossary Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="term"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Term</FormLabel>
                      <FormControl>
                        <Input placeholder="Glossary term" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="definition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Definition</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Term definition"
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

export default GlossaryForm;