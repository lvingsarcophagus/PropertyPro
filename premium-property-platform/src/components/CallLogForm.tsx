// src/components/CallLogForm.tsx
'use client';

import { CallLog, Client, Property } from '@/types';
import { useForm, SubmitHandler } from 'react-hook-form';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { useI18n } from '@/lib/i18n/index';

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
  call_time: string;
  description: string;
  duration_minutes?: number | null;
  outcome?: string;
  reminder_at?: string | null;
};

const formatDateTimeForInput = (isoString?: string | null): string => {
  if (!isoString) return '';
  const date = parseISO(isoString);
  if (!isValid(date)) return '';
  return format(date, "yyyy-MM-dd'T'HH:mm");
};

export default function CallLogForm({ log, userId, clients, properties, onSave }: CallLogFormProps) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const { t } = useI18n();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      client_id: log?.client_id || null,
      property_id: log?.property_id || null,
      call_time: formatDateTimeForInput(log?.call_time || new Date().toISOString()),
      description: log?.description || '',
      duration_minutes: log?.duration_minutes || undefined, // Use undefined for empty number input
      outcome: log?.outcome || '',
      reminder_at: formatDateTimeForInput(log?.reminder_at),
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (formData) => {
    setFormError(null);
    setFormSuccess(null);

    const callTime = parseISO(formData.call_time);
    if (!isValid(callTime)) {
        setFormError(t('forms.invalid_time_format_error')); // Assuming this key exists or create specific one
        return;
    }

    let reminderAtTime: Date | null = null;
    if (formData.reminder_at) {
        reminderAtTime = parseISO(formData.reminder_at);
        if (!isValid(reminderAtTime)) {
            setFormError(t('forms.invalid_time_format_error')); // Assuming this key exists
            return;
        }
         if (reminderAtTime <= callTime) {
            setFormError(t('forms.reminder_after_call_error'));
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
      if (log?.id) {
        const { data: updatedLog, error } = await supabase
          .from('calls')
          .update(submissionData)
          .eq('id', log.id)
          .eq('broker_id', userId)
          .select()
          .single();
        if (error) throw error;
        setFormSuccess(t('forms.success_log_updated'));
        if (onSave && updatedLog) onSave(updatedLog);
      } else {
        const { data: newLog, error } = await supabase
          .from('calls')
          .insert(submissionData)
          .select()
          .single();
        if (error) throw error;
        setFormSuccess(t('forms.success_log_added'));
        if (onSave && newLog) onSave(newLog);
      }

      router.refresh();
      setTimeout(() => {
        router.push('/dashboard/calls');
      }, 1000);

    } catch (error: any) {
      console.error('Error saving call log:', error);
      setFormError(error.message || t('forms.generic_error'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 shadow-lg rounded-xl border border-slate-200">
      {formError && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{t('forms.error_prefix')} {formError}</p>}
      {formSuccess && <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md">{t('forms.success_prefix')} {formSuccess}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="client_id" className="block text-sm font-medium text-slate-700 mb-1">{t('forms.link_client_label')}</label>
          <select
            id="client_id"
            {...register('client_id')}
            className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">{t('forms.option_none')}</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="property_id" className="block text-sm font-medium text-slate-700 mb-1">{t('forms.link_property_label')}</label>
          <select
            id="property_id"
            {...register('property_id')}
            className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">{t('forms.option_none')}</option>
            {properties.map(prop => (
              <option key={prop.id} value={prop.id}>{prop.street}, {prop.city}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="call_time" className="block text-sm font-medium text-slate-700 mb-1">{t('forms.call_time_label')}</label>
        <input
          type="datetime-local"
          id="call_time"
          {...register('call_time', { required: t('forms.call_time_required') })}
          className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
        {errors.call_time && <p className="text-xs text-red-500 mt-1">{errors.call_time.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">{t('forms.call_description_label')}</label>
        <textarea
          id="description"
          {...register('description', { required: t('forms.call_description_required') })}
          rows={4}
          className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        ></textarea>
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="duration_minutes" className="block text-sm font-medium text-slate-700 mb-1">{t('forms.duration_label')}</label>
          <input
            type="number"
            id="duration_minutes"
            {...register('duration_minutes', { valueAsNumber: true, min: { value: 0, message: t('forms.duration_positive_error') }})}
            className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          {errors.duration_minutes && <p className="text-xs text-red-500 mt-1">{errors.duration_minutes.message}</p>}
        </div>

        <div>
          <label htmlFor="outcome" className="block text-sm font-medium text-slate-700 mb-1">{t('forms.outcome_label')}</label>
          <input
            type="text"
            id="outcome"
            {...register('outcome')}
            placeholder={t('forms.outcome_placeholder')}
            className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="reminder_at" className="block text-sm font-medium text-slate-700 mb-1">{t('forms.reminder_at_label')}</label>
        <input
          type="datetime-local"
          id="reminder_at"
          {...register('reminder_at')}
          className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
         {/* No specific error display for reminder_at here, but formError will catch it if logic above sets it */}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => router.push('/dashboard/calls')}
          className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors text-sm"
        >
            {t('forms.button_cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:bg-slate-400"
        >
          {isSubmitting
            ? (log?.id ? t('forms.button_saving_log') : t('forms.button_adding_log'))
            : (log?.id ? t('forms.button_save_changes_log') : t('forms.button_log_call'))}
        </button>
      </div>
    </form>
  );
}
