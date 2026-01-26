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
import { revalidateCategories } from '@/actions/revalidate';

const formSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface CategoryFormProps {
  category: Category | null;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category }) => {
  const defaultValues = category || {
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
      description: defaultValues.description ?? '',
    },
  });

  // Labels
  const toastMessage = category ? 'Category updated.' : 'Category created.';
  const action = category ? 'Save changes' : 'Create';

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      if (category) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: values.name,
            description: values.description,
          })
          .eq('id', category.id);

        if (error) {
          toast.error(error.message);
          return;
        }
      } else {
        // Create new category
        const { data, error } = await supabase
          .from('categories')
          .insert({
            name: values.name,
            description: values.description,
            slug: generateSlug(values.name),
          })
          .select()
          .single();

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data) {
          router.push(`/categories/${data.slug}`);
        }
      }

      toast.success(toastMessage);

      // Revalidate frontend cache
      await revalidateCategories();

      router.refresh();
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!category) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Category deleted successfully.');

      // Revalidate frontend cache
      await revalidateCategories();

      router.push('/categories');
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
                  {category ? category.name : 'New category'}
                </CardTitle>
                <div className="flex gap-2">
                  {category && (
                    <DeleteButton label="Delete Category" fn={onDelete} />
                  )}
                  <Button type="submit">{action}</Button>
                </div>
              </CardHeader>
            </Card>

            {/* DETAILS */}
            <Card>
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Category name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Category description"
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

export default CategoryForm;
