// src/components/PropertyForm.tsx
'use client';

import { Property } from '@/types';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ChangeEvent, useState } from 'react';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n/index'; // Import useI18n

type PropertyFormProps = {
  property?: Property | null;
  userId: string | null;
};

type FormValues = Omit<Property, 'id' | 'created_at' | 'updated_at' | 'broker_id' | 'agency_id' | 'images' | 'fts'> & {
   imageFiles?: FileList | null;
};


const PropertyForm: React.FC<PropertyFormProps> = ({ property, userId }) => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { t } = useI18n(); // Initialize translations

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      city: property?.city || '',
      district: property?.district || '',
      street: property?.street || '',
      house_number: property?.house_number || '',
      heating_type: property?.heating_type || '',
      floor_number: property?.floor_number ?? undefined, // Ensure undefined for empty number fields
      num_rooms: property?.num_rooms ?? undefined,
      area_m2: property?.area_m2 ?? undefined,
      price: property?.price ?? undefined,
      purpose: property?.purpose || 'sale',
      type: property?.type || 'apartment',
      description: property?.description || '',
      status: property?.status || 'pending',
    },
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>(property?.images || []);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);


  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setFilesToUpload(files);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      // Clean up old object URLs for previews that are not from existing property.images
      imagePreviews.forEach(preview => {
          if (preview.startsWith('blob:')) {
              URL.revokeObjectURL(preview);
          }
      });
      // If editing, keep existing images that weren't changed, add new previews
      const existingImages = property?.images || [];
      setImagePreviews([...existingImages.filter(img => !imagePreviews.includes(img) || filesToUpload.length === 0), ...newPreviews]);
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setFormError(null);
    if (!userId) {
      setFormError(t('property_form.error_must_be_logged_in'));
      return;
    }

    let uploadedImageUrls: string[] = property?.images || [];

    if (filesToUpload.length > 0 && userId) {
       const uploadPromises = filesToUpload.map(async (file) => {
           const fileName = `${userId}/${Date.now()}-${file.name}`;
           const { error: uploadError } = await supabase.storage
           .from('property_images')
           .upload(fileName, file);

           if (uploadError) {
             console.error('Error uploading image:', uploadError);
             throw new Error(t('property_form.error_image_upload', { message: uploadError.message }));
           }
           const { data: publicUrlData } = supabase.storage
           .from('property_images')
           .getPublicUrl(fileName);
           return publicUrlData.publicUrl;
       });
       try {
           const urls = await Promise.all(uploadPromises);
           uploadedImageUrls = [...uploadedImageUrls.filter(url => !url.startsWith('blob:')), ...urls]; // Keep existing non-blob URLs
       } catch (error: any) {
           setFormError(error.message || t('forms.generic_error'));
           return;
       }
    }

    const propertyData = {
      ...data,
      broker_id: userId,
      images: uploadedImageUrls,
      floor_number: data.floor_number ? parseInt(String(data.floor_number), 10) : null,
      num_rooms: data.num_rooms ? parseInt(String(data.num_rooms), 10) : null,
      area_m2: data.area_m2 ? parseFloat(String(data.area_m2)) : null,
      price: data.price ? parseFloat(String(data.price)) : null,
    };

    try {
        if (property?.id) {
            const { error: updateError } = await supabase
                .from('properties')
                .update(propertyData)
                .eq('id', property.id);
            if (updateError) throw updateError;
            router.push(`/properties/${property.id}`);
        } else {
            const { data: newProperty, error: insertError } = await supabase
                .from('properties')
                .insert(propertyData)
                .select()
                .single();
            if (insertError) throw insertError;
            if (newProperty) router.push(`/properties/${newProperty.id}`);
        }
        router.refresh();
    } catch (error: any) {
        console.error('Error saving property:', error);
        const messageKey = property?.id ? 'property_form.error_failed_to_update' : 'property_form.error_failed_to_create';
        setFormError(t(messageKey, { message: error.message }));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 shadow-md rounded-lg">
      {formError && <p className="text-red-500 bg-red-100 p-3 rounded-md">{formError}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">{t('property_form.label_property_type')}</label>
          <select {...register('type')} id="type" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2">
            <option value="apartment">{t('property_form.option_apartment')}</option>
            <option value="house">{t('property_form.option_house')}</option>
            <option value="commercial">{t('property_form.option_commercial')}</option>
          </select>
        </div>
        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">{t('property_form.label_purpose')}</label>
          <select {...register('purpose')} id="purpose" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2">
            <option value="sale">{t('property_form.option_sale')}</option>
            <option value="rent">{t('property_form.option_rent')}</option>
          </select>
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
               <label htmlFor="city" className="block text-sm font-medium text-gray-700">{t('property_form.label_city')}</label>
               <input type="text" {...register('city', { required: t('property_form.validation_city_required') })} id="city" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
               {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
           </div>
           <div>
               <label htmlFor="district" className="block text-sm font-medium text-gray-700">{t('property_form.label_district')}</label>
               <input type="text" {...register('district')} id="district" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
           </div>
       </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
               <label htmlFor="street" className="block text-sm font-medium text-gray-700">{t('property_form.label_street')}</label>
               <input type="text" {...register('street')} id="street" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
           </div>
           <div>
               <label htmlFor="house_number" className="block text-sm font-medium text-gray-700">{t('property_form.label_house_number')}</label>
               <input type="text" {...register('house_number')} id="house_number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
           </div>
       </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <div>
               <label htmlFor="price" className="block text-sm font-medium text-gray-700">{t('property_form.label_price')}</label>
               <input type="number" step="0.01" {...register('price', { required: t('property_form.validation_price_required'), valueAsNumber: true, min: { value: 0, message: t('property_form.validation_price_positive') } })} id="price" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
               {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
           </div>
           <div>
               <label htmlFor="area_m2" className="block text-sm font-medium text-gray-700">{t('property_form.label_area_m2')}</label>
               <input type="number" step="0.1" {...register('area_m2', { valueAsNumber: true, min: { value: 0, message: t('property_form.validation_area_positive') } })} id="area_m2" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
               {errors.area_m2 && <p className="text-red-500 text-xs mt-1">{errors.area_m2.message}</p>}
           </div>
           <div>
               <label htmlFor="num_rooms" className="block text-sm font-medium text-gray-700">{t('property_form.label_num_rooms')}</label>
               <input type="number" {...register('num_rooms', { valueAsNumber: true, min: { value: 0, message: t('property_form.validation_rooms_non_negative') } })} id="num_rooms" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
               {errors.num_rooms && <p className="text-red-500 text-xs mt-1">{errors.num_rooms.message}</p>}
           </div>
            <div>
               <label htmlFor="floor_number" className="block text-sm font-medium text-gray-700">{t('property_form.label_floor_number')}</label>
               <input type="number" {...register('floor_number', { valueAsNumber: true })} id="floor_number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
            </div>
            <div>
               <label htmlFor="heating_type" className="block text-sm font-medium text-gray-700">{t('property_form.label_heating_type')}</label>
               <input type="text" {...register('heating_type')} id="heating_type" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
            </div>
        </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">{t('property_form.label_description')}</label>
        <textarea {...register('description')} id="description" rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"></textarea>
      </div>

       <div>
           <label htmlFor="imageFiles" className="block text-sm font-medium text-gray-700">{t('property_form.label_images')}</label>
           <input
               type="file"
               id="imageFiles"
               multiple
               accept="image/*"
               onChange={handleImageChange}
               className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
           />
           {imagePreviews.length > 0 && (
           <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
               {imagePreviews.map((previewUrl, index) => (
               <div key={index} className="relative w-full h-32">
                   <Image src={previewUrl} alt={`Preview ${index + 1}`} layout="fill" objectFit="cover" className="rounded-md" />
               </div>
               ))}
           </div>
           )}
       </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">{t('property_form.label_status')}</label>
        <select {...register('status')} id="status" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2">
          <option value="pending">{t('property_form.option_pending')}</option>
          <option value="active">{t('property_form.option_active')}</option>
          <option value="sold">{t('property_form.option_sold')}</option>
          <option value="rented">{t('property_form.option_rented')}</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
      >
        {isSubmitting
            ? (property?.id ? t('property_form.button_saving') : t('property_form.button_creating'))
            : (property?.id ? t('property_form.button_save_changes') : t('property_form.button_create_property'))}
      </button>
    </form>
  );
};

export default PropertyForm;
