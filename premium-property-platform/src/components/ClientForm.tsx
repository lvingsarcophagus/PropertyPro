// src/components/ClientForm.tsx
'use client';

import { Client } from '@/types';
import { useForm, SubmitHandler } from 'react-hook-form';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ClientFormProps = {
  client?: Client | null;
  userId: string;
  onSave?: (savedClient: Partial<Client>) => void; // Partial because new client won't have ID until insert
};

type FormValues = {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
};

export default function ClientForm({ client, userId, onSave }: ClientFormProps) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      name: client?.name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      notes: client?.notes || '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (formData) => {
    setFormError(null);
    setFormSuccess(null);

    try {
      if (client?.id) { // Editing existing client
        const { data: updatedClient, error } = await supabase
          .from('clients')
          .update({
            name: formData.name,
            email: formData.email || null, // Ensure null if empty
            phone: formData.phone || null, // Ensure null if empty
            notes: formData.notes || null, // Ensure null if empty
            // broker_id should not change on edit, and is implicitly checked by RLS
          })
          .eq('id', client.id)
          .eq('broker_id', userId) // Ensure user can only update their own client via RLS, this is an extra check
          .select()
          .single();
        if (error) throw error;
        setFormSuccess('Client updated successfully!');
        if (onSave && updatedClient) onSave(updatedClient);
        // Wait for a bit before redirecting so user can see success message
        setTimeout(() => {
            router.push('/dashboard/clients');
            router.refresh();
        }, 1000);


      } else { // Adding new client
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert({
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null,
            notes: formData.notes || null,
            broker_id: userId,
          })
          .select()
          .single();
        if (error) throw error;
        setFormSuccess('Client added successfully!');
        if (onSave && newClient) onSave(newClient);
        setTimeout(() => {
            router.push('/dashboard/clients');
            router.refresh();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error saving client:', error);
      setFormError(error.message || 'An unexpected error occurred.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 shadow-lg rounded-xl border border-slate-200">
      {formError && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">Error: {formError}</p>}
      {formSuccess && <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md">Success: {formSuccess}</p>}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
        <input 
          type="text" 
          id="name" 
          {...register('name', { required: 'Client name is required' })} 
          className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
        <input 
          type="email" 
          id="email" 
          {...register('email', { pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email format' }})} 
          className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
        />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
        <input 
          type="tel" 
          id="phone" 
          {...register('phone')} 
          className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea 
          id="notes" 
          {...register('notes')} 
          rows={4} 
          className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
        ></textarea>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        <button 
          type="button" 
          onClick={() => router.push('/dashboard/clients')}
          className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors text-sm"
        >
            Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:bg-slate-400"
        >
          {isSubmitting ? (client?.id ? 'Saving Changes...' : 'Adding Client...') : (client?.id ? 'Save Changes' : 'Add Client')}
        </button>
      </div>
    </form>
  );
}
