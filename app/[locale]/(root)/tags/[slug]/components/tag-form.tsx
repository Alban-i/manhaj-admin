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
import { Tags } from '@/types/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/providers/supabase/client';
import { generateSlug } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { revalidateTags } from '@/actions/revalidate';

const formSchema = z.object({
  name: z.string().min(1),
});

interface TagFormProps {
  tag: Tags | null;
}

const TagForm: React.FC<TagFormProps> = ({ tag }) => {
  const defaultValues = tag || {
    name: '',
    description: '',
  };

  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues.name ?? '',
    },
  });

  // Labels
  const toastMessage = tag ? 'Tag updated.' : 'Tag created.';
  const action = tag ? 'Save changes' : 'Create';

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      if (tag) {
        // Update existing tag
        const { error } = await supabase
          .from('tags')
          .update({
            name: values.name,
          })
          .eq('id', tag.id);

        if (error) {
          toast.error(error.message);
          return;
        }
      } else {
        // Create new tag
        const { data, error } = await supabase
          .from('tags')
          .insert({
            name: values.name,
            slug: generateSlug(values.name),
          })
          .select()
          .single();

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data) {
          router.push(`/tags/${data.slug}`);
        }
      }

      toast.success(toastMessage);

      // Revalidate frontend cache
      await revalidateTags();

      router.refresh();
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!tag) {
      return;
    }

    try {
      const { error } = await supabase.from('tags').delete().eq('id', tag.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Tag deleted successfully.');

      // Revalidate frontend cache
      await revalidateTags();

      router.push('/tags');
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
                <CardTitle>{tag ? tag.name : 'New tag'}</CardTitle>
                <div className="flex gap-2">
                  {tag && <DeleteButton label="Delete Tag" fn={onDelete} />}
                  <Button type="submit">{action}</Button>
                </div>
              </CardHeader>
            </Card>

            {/* DETAILS */}
            <Card>
              <CardHeader>
                <CardTitle>Tag Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-x-2 gap-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Tag name" {...field} />
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

export default TagForm;
