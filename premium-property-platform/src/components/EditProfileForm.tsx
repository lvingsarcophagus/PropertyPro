// src/components/EditProfileForm.tsx
'use client';

import { UserProfile } from '@/types';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useState, ChangeEvent } from 'react';
import Image from 'next/image';

type EditProfileFormProps = {
  userProfile: UserProfile;
};

type FormValues = {
  name: string;
  phone: string;
  profile_picture_file?: FileList | null;
};

const EditProfileForm: React.FC<EditProfileFormProps> = ({ userProfile }) => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile.profile_picture || null);

  const { register, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      name: userProfile.name || '',
      phone: userProfile.phone || '',
    },
  });

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setValue('profile_picture_file', event.target.files);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // Clear preview if no file is selected or selection is cancelled
      // setValue('profile_picture_file', null); // react-hook-form handles null FileList
      // setAvatarPreview(userProfile.profile_picture || null); // Revert to original or default
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      let newAvatarUrl = userProfile.profile_picture;

      if (data.profile_picture_file && data.profile_picture_file.length > 0) {
        const file = data.profile_picture_file[0];
        const filePath = `${userProfile.id}/avatar-${Date.now()}.${file.name.split('.').pop()}`;

        // Ensure 'profile-pictures' bucket exists and has appropriate policies
        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true, // Overwrite if file with same name exists
          });

        if (uploadError) throw new Error(`Avatar Upload Error: ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(filePath);

        newAvatarUrl = publicUrlData.publicUrl;
      }

      const updates = {
        name: data.name,
        phone: data.phone,
        profile_picture: newAvatarUrl,
        // id and email should not be updated here
      };

      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userProfile.id);

      if (updateError) throw new Error(`Profile Update Error: ${updateError.message}`);

      setFormSuccess('Profile updated successfully!');
      router.refresh(); // Refresh server components on the page
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setFormError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 shadow-md rounded-lg mt-6">
      {formError && <p className="text-red-500 bg-red-100 p-3 rounded-md">{formError}</p>}
      {formSuccess && <p className="text-green-500 bg-green-100 p-3 rounded-md">{formSuccess}</p>}

      <div className="flex flex-col items-center space-y-4">
         {avatarPreview ? (
             <Image src={avatarPreview} alt="Avatar preview" width={128} height={128} className="rounded-full object-cover w-32 h-32" />
         ) : (
             <div className="w-32 h-32 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                 No Image
             </div>
         )}
         <div>
             <label htmlFor="profile_picture_file" className="cursor-pointer text-sm font-medium text-amber-600 hover:text-amber-500 bg-slate-100 hover:bg-slate-200 py-2 px-4 rounded-md">
                 Change Picture
             </label>
             <input
                 type="file"
                 id="profile_picture_file"
                 {...register('profile_picture_file')}
                 onChange={handleAvatarChange}
                 accept="image/png, image/jpeg, image/webp"
                 className="hidden"
             />
         </div>
      </div>


      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
        <input
          type="text"
          id="name"
          {...register('name')}
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone Number</label>
        <input
          type="tel"
          id="phone"
          {...register('phone')}
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2"
        />
      </div>

      <div>
         <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email (cannot change)</label>
         <input
             type="email"
             id="email"
             value={userProfile.email}
             disabled
             className="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-slate-50 text-slate-500 sm:text-sm p-2"
         />
      </div>


      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-slate-400"
      >
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
};

export default EditProfileForm;
