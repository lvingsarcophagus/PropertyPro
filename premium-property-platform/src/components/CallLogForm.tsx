// src/components/CallLogForm.tsx
'use client';

import { CallLog, Client, Property } from '@/types';
import { useForm, SubmitHandler } from 'react-hook-form';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';

type CallLogFormProps = {
  log?: CallLog | null;
  userId: string;
  clients: Pick<Client, 'id' | 'name'>[];
  properties: Pick<Property, 'id' | 'street' | 'city'>[];
  onSave?: (savedLog: Partial<CallLog>) => void;
};

type FormValues = {
  client_id?: string | null;
  property_id?: string | null;
  call_time: string; // Store as string for datetime-local input
  description: string;
  duration_minutes?: number | null;
  outcome?: string;
  reminder_at?: string | null; // Store as string for datetime-local input
};

// Helper to format date for datetime-local input
const formatDateTimeForInput = (isoString?: string | null): string => {
  if (!isoString) return '';
  const date = parseISO(isoString);
  if (!isValid(date)) return '';
  return format(date, "yyyy-MM-dd'T'HH:mm");
};

export default function CallLogForm({ log, userId, clients, properties, onSave }: CallLogFormProps) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      client_id: log?.client_id || null,
      property_id: log?.property_id || null,
      call_time: formatDateTimeForInput(log?.call_time || new Date().toISOString()), // Default to now for new logs
      description: log?.description || '',
      duration_minutes: log?.duration_minutes || null,
      outcome: log?.outcome || '',
      reminder_at: formatDateTimeForInput(log?.reminder_at),
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (formData) => {
    setFormError(null);
    setFormSuccess(null);

    const callTime = parseISO(formData.call_time);
    if (!isValid(callTime)) {
        setFormError('Invalid Call Time format.');
        return;
    }
    
    let reminderAtTime: Date | null = null;
    if (formData.reminder_at) {
        reminderAtTime = parseISO(formData.reminder_at);
        if (!isValid(reminderAtTime)) {
            setFormError('Invalid Reminder Time format.');
            return;
        }
         if (reminderAtTime <= callTime) {
            setFormError('Reminder time must be after the call time.');
            return;
        }
    }


    const submissionData = {
      broker_id: userId,
      client_id: formData.client_id === '' ? null : formData.client_id,
      property_id: formData.property_id === '' ? null : formData.property_id,
      call_time: callTime.toISOString(),
      description: formData.description,
      duration_minutes: formData.duration_minutes ? Number(formData.duration_minutes) : null,
      outcome: formData.outcome || null,
      reminder_at: reminderAtTime ? reminderAtTime.toISOString() : null,
    };

    try {
      if (log?.id) { // Editing existing log
        const { data: updatedLog, error } = await supabase
          .from('calls')
          .update(submissionData)
          .eq('id', log.id)
          .eq('broker_id', userId) 
          .select()
          .single();
        if (error) throw error;
        setFormSuccess('Call log updated successfully!');
        if (onSave && updatedLog) onSave(updatedLog);
      } else { // Adding new log
        const { data: newLog, error } = await supabase
          .from('calls')
          .insert(submissionData)
          .select()
          .single();
        if (error) throw error;
        setFormSuccess('Call log added successfully!');
        if (onSave && newLog) onSave(newLog);
      }
      
      router.refresh();
      setTimeout(() => {
        router.push('/dashboard/calls');
      }, 1000);

    } catch (error: any) {
      console.error('Error saving call log:', error);
      setFormError(error.message || 'An unexpected error occurred.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 shadow-lg rounded-xl border border-slate-200">
      {formError && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">Error: {formError}</p>}
      {formSuccess && <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md">Success: {formSuccess}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="client_id" className="block text-sm font-medium text-slate-700 mb-1">Link Client (Optional)</label>
          <select 
            id="client_id" 
            {...register('client_id')}
            className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">None</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="property_id" className="block text-sm font-medium text-slate-700 mb-1">Link Property (Optional)</label>
          <select 
            id="property_id" 
            {...register('property_id')}
            className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">None</option>
            {properties.map(prop => (
              <option key={prop.id} value={prop.id}>{prop.street}, {prop.city}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="call_time" className="block text-sm font-medium text-slate-700 mb-1">Call Time</label>
        <input 
          type="datetime-local" 
          id="call_time" 
          {...register('call_time', { required: 'Call time is required' })}
          className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
        {errors.call_time && <p className="text-xs text-red-500 mt-1">{errors.call_time.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Call Description / Notes</label>
        <textarea 
          id="description" 
          {...register('description', { required: 'Description is required' })} 
          rows={4} 
          className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        ></textarea>
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="duration_minutes" className="block text-sm font-medium text-slate-700 mb-1">Duration (Minutes, Optional)</label>
          <input 
            type="number" 
            id="duration_minutes" 
            {...register('duration_minutes', { valueAsNumber: true, min: { value: 0, message: 'Duration must be positive' }})} 
            className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          {errors.duration_minutes && <p className="text-xs text-red-500 mt-1">{errors.duration_minutes.message}</p>}
        </div>

        <div>
          <label htmlFor="outcome" className="block text-sm font-medium text-slate-700 mb-1">Call Outcome (Optional)</label>
          <input 
            type="text" 
            id="outcome" 
            {...register('outcome')} 
            placeholder="e.g., Scheduled viewing, Follow-up needed"
            className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="reminder_at" className="block text-sm font-medium text-slate-700 mb-1">Set Follow-up Reminder (Optional)</label>
        <input 
          type="datetime-local" 
          id="reminder_at" 
          {...register('reminder_at')}
          className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
      </div>


      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        <button 
          type="button" 
          onClick={() => router.push('/dashboard/calls')}
          className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors text-sm"
        >
            Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:bg-slate-400"
        >
          {isSubmitting ? (log?.id ? 'Saving Log...' : 'Adding Log...') : (log?.id ? 'Save Changes' : 'Log Call')}
        </button>
      </div>
    </form>
  );
}
