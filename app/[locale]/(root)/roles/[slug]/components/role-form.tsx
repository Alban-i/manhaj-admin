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
import { Roles } from '@/types/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/providers/supabase/client';
import { generateSlug } from '@/lib/utils';

const formSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  order: z.coerce.number().min(0),
});

interface RoleFormProps {
  role: Roles | null;
}

const RoleForm: React.FC<RoleFormProps> = ({ role }) => {
  const defaultValues = role || {
    label: '',
    value: '',
    order: 0,
  };

  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: defaultValues.label ?? '',
      value: defaultValues.value ?? '',
      order: defaultValues.order ?? 0,
    },
  });

  // Labels
  const toastMessage = role ? 'Role updated.' : 'Role created.';
  const action = role ? 'Save changes' : 'Create';

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      if (role) {
        // Update existing role
        const { error } = await supabase
          .from('roles')
          .update({
            label: values.label,
            value: values.value,
            order: values.order,
          })
          .eq('id', role.id);

        if (error) {
          toast.error(error.message);
          return;
        }
      } else {
        // Create new role
        const { data, error } = await supabase
          .from('roles')
          .insert({
            label: values.label,
            value: values.value,
            order: values.order,
            slug: generateSlug(values.label),
          })
          .select()
          .single();

        if (error) {
          toast.error(error.message);
          return;
        }

        if (data) {
          router.push(`/roles/${data.slug}`);
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
    if (!role) {
      return;
    }

    try {
      const { error } = await supabase.from('roles').delete().eq('id', role.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Role deleted successfully.');
      router.push('/roles');
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
                <CardTitle>{role ? role.label : 'New role'}</CardTitle>
                <div className="flex gap-2">
                  {role && <DeleteButton label="Delete Role" fn={onDelete} />}
                  <Button type="submit">{action}</Button>
                </div>
              </CardHeader>
            </Card>

            {/* DETAILS */}
            <Card>
              <CardHeader>
                <CardTitle>Role Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-2 gap-y-4">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input placeholder="Label" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input placeholder="Value" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Order" {...field} />
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

export default RoleForm;
