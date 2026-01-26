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
import { ProfilesWithRoles, Roles } from '@/types/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/providers/supabase/client';
import { PhoneInput } from '@/components/ui/phone-input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Phone } from 'lucide-react';

const initialData = {
  username: '',
  full_name: '',
  phone: '',
  role_id: undefined,
  id: undefined,
};

const formSchema = z.object({
  username: z.string().min(1),
  full_name: z.string().min(1),
  phone: z.string().min(1),
  role_id: z.string().min(1),
});

interface ProfileFormProps {
  profile: ProfilesWithRoles;
  roles: Roles[];
}

// #################################################
// #################################################
// #################################################
const ProfileForm: React.FC<ProfileFormProps> = ({ profile, roles }) => {
  const defaultValues = {
    ...initialData,
    ...profile,
    role_id: profile?.role_id ? profile.role_id.id.toString() : '',
  };

  console.log('Profile Data:', profile);
  console.log('Default Values:', defaultValues);

  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: defaultValues.username ?? '',
      full_name: defaultValues.full_name ?? '',
      phone: defaultValues.phone ?? '',
      role_id: defaultValues.role_id,
    },
  });

  // Labels
  const toastMessage = defaultValues.id
    ? 'Profile updated.'
    : 'Profile created.';
  const action = defaultValues.id ? 'Save changes' : 'Create';

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log('Form Values:', values);
    console.log('Profile ID being used:', defaultValues.id);

    try {
      setLoading(true);

      const updateQuery = supabase
        .from('profiles')
        .update({
          username: values.username,
          full_name: values.full_name,
          phone: values.phone,
          role_id: parseInt(values.role_id),
        })
        .eq('id', defaultValues.id)
        .select();

      const { data, error } = await updateQuery;

      console.log('Update Response:', { data, error });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        toast.error('No profile was updated. The profile may not exist.');
        setLoading(false);
        return;
      }

      // Update the form with the new data (using first result)
      const updatedProfile = data[0];
      if (updatedProfile) {
        form.reset({
          username: updatedProfile.username ?? '',
          full_name: updatedProfile.full_name ?? '',
          phone: updatedProfile.phone ?? '',
          role_id: updatedProfile.role_id
            ? updatedProfile.role_id.toString()
            : '',
        });
      }

      toast.success(toastMessage);

      if (!defaultValues.id) {
        router.push(`/profiles/${updatedProfile.username || updatedProfile.id}`);
      }

      form.reset();
      router.refresh();
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!defaultValues.id) {
      toast.error('Profile not found');
      return;
    }

    try {
      // First delete the user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(
        defaultValues.id.toString()
      );

      if (authError) {
        toast.error('Failed to delete user authentication');
        return;
      }

      // Then delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', defaultValues.id.toString());

      if (profileError) {
        toast.error(profileError.message);
        return;
      }

      toast.success('Profile and user deleted successfully.');

      router.push('/profiles');
      form.reset();
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
                  {defaultValues.id ? defaultValues.email : 'New profile'}
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => {
                      if (!defaultValues.phone) {
                        toast.error('No phone number found');
                        return;
                      }

                      const phone = defaultValues.phone.replace('+', '');
                      const whatsappLink = `https://wa.me/${phone}`;

                      navigator.clipboard.writeText(whatsappLink);

                      toast.info(`Link ${whatsappLink} copied to clipboard`);
                    }}
                  >
                    <Phone />
                  </Button>
                </CardTitle>
                <div className="flex gap-2">
                  {defaultValues.id && (
                    <DeleteButton label="Delete Profile" fn={onDelete} />
                  )}
                  <Button type="submit">{action}</Button>
                </div>
              </CardHeader>
            </Card>

            {/* DETAILS */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-2 gap-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PHONE NUMBER */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-start">
                      <FormLabel className="text-left">Phone Number</FormLabel>
                      <FormControl className="w-full">
                        <PhoneInput
                          placeholder="Enter a phone number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ROLE */}
                <FormField
                  control={form.control}
                  name="role_id"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value)}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem
                              key={role.id}
                              value={role.id.toString()}
                            >
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

export default ProfileForm;
