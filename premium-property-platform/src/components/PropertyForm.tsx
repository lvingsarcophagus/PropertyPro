// src/components/PropertyForm.tsx
'use client';

import { Property } from '@/types';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ChangeEvent, useState } from 'react';
import Image from 'next/image'; // Added for Image preview

type PropertyFormProps = {
  property?: Property | null; // For editing existing property
  userId: string | null; // Current logged-in user's ID
};

type FormValues = Omit<Property, 'id' | 'created_at' | 'updated_at' | 'broker_id' | 'agency_id' | 'images' | 'fts'> & {
   // For file uploads
   imageFiles?: FileList | null;
};


const PropertyForm: React.FC<PropertyFormProps> = ({ property, userId }) => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      city: property?.city || '',
      district: property?.district || '',
      street: property?.street || '',
      house_number: property?.house_number || '',
      heating_type: property?.heating_type || '',
      floor_number: property?.floor_number || undefined,
      num_rooms: property?.num_rooms || undefined,
      area_m2: property?.area_m2 || undefined,
      price: property?.price || undefined,
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
      setImagePreviews(prev => [...prev, ...newPreviews]); // Add new previews
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setFormError(null);
    if (!userId) {
      setFormError("You must be logged in to create or edit a property.");
      return;
    }

    let uploadedImageUrls: string[] = property?.images || [];

    if (filesToUpload.length > 0 && userId) {
       const uploadPromises = filesToUpload.map(async (file) => {
           const fileName = `${userId}/${Date.now()}-${file.name}`;
           const { data: uploadData, error: uploadError } = await supabase.storage
           .from('property_images')
           .upload(fileName, file);

           if (uploadError) {
           console.error('Error uploading image:', uploadError);
           throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
           }
           // Get public URL
           const { data: publicUrlData } = supabase.storage
           .from('property_images')
           .getPublicUrl(fileName);

           return publicUrlData.publicUrl;
       });

       try {
           const urls = await Promise.all(uploadPromises);
           uploadedImageUrls = [...uploadedImageUrls, ...urls];
       } catch (error: any) {
           setFormError(error.message || "An error occurred during image upload.");
           return;
       }
    }


    const propertyData = {
      ...data,
      broker_id: userId,
      // agency_id: null, // TODO: Link to agency if applicable
      images: uploadedImageUrls,
      floor_number: data.floor_number ? parseInt(String(data.floor_number), 10) : null,
      num_rooms: data.num_rooms ? parseInt(String(data.num_rooms), 10) : null,
      area_m2: data.area_m2 ? parseFloat(String(data.area_m2)) : null,
      price: data.price ? parseFloat(String(data.price)) : null,
    };

    if (property?.id) { // Editing existing property
      const { error: updateError } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', property.id);
      if (updateError) {
        console.error('Error updating property:', updateError);
        setFormError(`Failed to update property: ${updateError.message}`);
      } else {
        router.push(`/properties/${property.id}`);
        router.refresh(); // Refresh server components
      }
    } else { // Creating new property
      const { data: newProperty, error: insertError } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();
      if (insertError) {
        console.error('Error creating property:', insertError);
        setFormError(`Failed to create property: ${insertError.message}`);
      } else if (newProperty) {
        router.push(`/properties/${newProperty.id}`);
        router.refresh();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 shadow-md rounded-lg">
      {formError && <p className="text-red-500">{formError}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form fields - Add all relevant fields from Property type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Property Type</label>
          <select {...register('type')} id="type" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2">
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>
        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">Purpose</label>
          <select {...register('purpose')} id="purpose" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2">
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
        </div>
      </div>

       {/* Location Fields */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
               <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
               <input type="text" {...register('city', { required: 'City is required' })} id="city" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
               {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
           </div>
           <div>
               <label htmlFor="district" className="block text-sm font-medium text-gray-700">District</label>
               <input type="text" {...register('district')} id="district" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
           </div>
       </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
               <label htmlFor="street" className="block text-sm font-medium text-gray-700">Street</label>
               <input type="text" {...register('street')} id="street" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
           </div>
           <div>
               <label htmlFor="house_number" className="block text-sm font-medium text-gray-700">House/Flat Number</label>
               <input type="text" {...register('house_number')} id="house_number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
           </div>
       </div>


       {/* Property Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <div>
               <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price ($)</label>
               <input type="number" step="0.01" {...register('price', { required: 'Price is required', valueAsNumber: true, min: { value: 0, message: "Price must be positive" } })} id="price" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
               {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
           </div>
           <div>
               <label htmlFor="area_m2" className="block text-sm font-medium text-gray-700">Area (m²)</label>
               <input type="number" step="0.1" {...register('area_m2', { valueAsNumber: true, min: { value: 0, message: "Area must be positive" } })} id="area_m2" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
               {errors.area_m2 && <p className="text-red-500 text-xs mt-1">{errors.area_m2.message}</p>}
           </div>
           <div>
               <label htmlFor="num_rooms" className="block text-sm font-medium text-gray-700">Number of Rooms</label>
               <input type="number" {...register('num_rooms', { valueAsNumber: true, min: { value: 0, message: "Rooms must be non-negative" } })} id="num_rooms" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
               {errors.num_rooms && <p className="text-red-500 text-xs mt-1">{errors.num_rooms.message}</p>}
           </div>
            <div>
               <label htmlFor="floor_number" className="block text-sm font-medium text-gray-700">Floor Number</label>
               <input type="number" {...register('floor_number', { valueAsNumber: true })} id="floor_number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
            </div>
            <div>
               <label htmlFor="heating_type" className="block text-sm font-medium text-gray-700">Heating Type</label>
               <input type="text" {...register('heating_type')} id="heating_type" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
            </div>
        </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea {...register('description')} id="description" rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"></textarea>
      </div>

       {/* Image Upload */}
       <div>
           <label htmlFor="imageFiles" className="block text-sm font-medium text-gray-700">Property Images</label>
           <input
               type="file"
               id="imageFiles"
               multiple
               accept="image/*"
               onChange={handleImageChange}
               className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
           />
           {/* Image Previews */}
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
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
        <select {...register('status')} id="status" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2">
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
      >
        {isSubmitting ? (property?.id ? 'Saving...' : 'Creating...') : (property?.id ? 'Save Changes' : 'Create Property')}
      </button>
    </form>
  );
};

export default PropertyForm;
