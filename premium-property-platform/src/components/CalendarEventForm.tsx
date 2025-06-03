// src/components/CalendarEventForm.tsx
'use client';

import { CalendarEvent, Client, Property, CalendarEventType } from '@/types';
import { useForm, SubmitHandler } from 'react-hook-form';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { useI18n } from '@/lib/i18n/index';

type CalendarEventFormProps = {
  event?: CalendarEvent | null;
  userId: string;
  clients: Pick<Client, 'id' | 'name'>[];
  properties: Pick<Property, 'id' | 'street' | 'city'>[];
  onSave?: (savedEvent: Partial<CalendarEvent>) => void;
};

type FormValues = {
  title: string;
  event_type: CalendarEventType;
  description?: string;
  start_time: string;
  end_time: string;
  client_id?: string | null;
  property_id?: string | null;
  reminder: boolean;
};

const formatDateTimeForInput = (isoString?: string | null): string => {
  if (!isoString) return '';
  const date = parseISO(isoString);
  if (!isValid(date)) return '';
  return format(date, "yyyy-MM-dd'T'HH:mm");
};


export default function CalendarEventForm({ event, userId, clients, properties, onSave }: CalendarEventFormProps) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const { t } = useI18n();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<FormValues>({
    defaultValues: {
      title: event?.title || '',
      event_type: event?.event_type || 'appointment',
      description: event?.description || '',
      start_time: formatDateTimeForInput(event?.start_time || new Date().toISOString()), // Default to now for new events
      end_time: formatDateTimeForInput(event?.end_time),
      client_id: event?.client_id || null,
      property_id: event?.property_id || null,
      reminder: event?.reminder || false,
    },
  });

  const watchedStartTime = watch("start_time");

  useEffect(() => {
    if (watchedStartTime && event?.end_time) {
        const start = parseISO(watchedStartTime);
        const end = parseISO(formatDateTimeForInput(event.end_time));
        if (isValid(start) && isValid(end) && start > end) {
            // Auto-adjust logic can be added here if desired
        }
    }
  }, [watchedStartTime, event?.end_time]);


  const onSubmit: SubmitHandler<FormValues> = async (formData) => {
    setFormError(null);
    setFormSuccess(null);

    const startTime = parseISO(formData.start_time);
    const endTime = parseISO(formData.end_time);

    if (!isValid(startTime) || !isValid(endTime)) {
        setFormError(t('forms.invalid_time_format_error'));
        return;
    }
    if (endTime <= startTime) {
        setFormError(t('forms.end_time_after_start_error'));
        return;
    }

    const submissionData = {
      ...formData, // title, event_type, description, reminder
      broker_id: userId,
      client_id: formData.client_id === '' ? null : formData.client_id,
      property_id: formData.property_id === '' ? null : formData.property_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    };

    try {
      if (event?.id) {
        const { data: updatedEvent, error } = await supabase
          .from('calendar')
          .update(submissionData)
          .eq('id', event.id)
          .eq('broker_id', userId)
          .select()
          .single();
        if (error) throw error;
        setFormSuccess(t('forms.success_event_updated'));
        if (onSave && updatedEvent) onSave(updatedEvent);
      } else {
        const { data: newEvent, error } = await supabase
          .from('calendar')
          .insert(submissionData)
          .select()
          .single();
        if (error) throw error;
        setFormSuccess(t('forms.success_event_added'));
        if (onSave && newEvent) onSave(newEvent);
      }

      router.refresh();
      setTimeout(() => {
        router.push('/dashboard/calendar');
      }, 1000);

    } catch (error: any) {
      console.error('Error saving event:', error);
      setFormError(error.message || t('forms.generic_error'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 shadow-lg rounded-xl border border-slate-200">
      {formError && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{t('forms.error_prefix')} {formError}</p>}
      {formSuccess && <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md">{t('forms.success_prefix')} {formSuccess}</p>}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">{t('forms.event_title_label')}</label>
        <input
          type="text"
          id="title"
          {...register('title', { required: t('forms.event_title_required') })}
          className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label htmlFor="event_type" className="block text-sm font-medium text-slate-700 mb-1">{t('forms.event_type_label')}</label>
        <select
          id="event_type"
          {...register('event_type', { required: t('forms.event_type_required') })}
          className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        >
          <option value="appointment">{t('calendar.event_type_appointment')}</option>
          <option value="viewing">{t('calendar.event_type_viewing')}</option>
          <option value="task">{t('calendar.event_type_task')}</option>
        </select>
        {errors.event_type && <p className="text-xs text-red-500 mt-1">{errors.event_type.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="start_time" className="block text-sm font-medium text-slate-700 mb-1">{t('forms.start_time_label')}</label>
          <input
            type="datetime-local"
            id="start_time"
            {...register('start_time', { required: t('forms.start_time_required') })}
            className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          {errors.start_time && <p className="text-xs text-red-500 mt-1">{errors.start_time.message}</p>}
        </div>
        <div>
          <label htmlFor="end_time" className="block text-sm font-medium text-slate-700 mb-1">{t('forms.end_time_label')}</label>
          <input
            type="datetime-local"
            id="end_time"
            {...register('end_time', { required: t('forms.end_time_required') })}
            className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          {errors.end_time && <p className="text-xs text-red-500 mt-1">{errors.end_time.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">{t('common.description')}</label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        ></textarea>
      </div>

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

      <div className="flex items-center">
        <input
          type="checkbox"
          id="reminder"
          {...register('reminder')}
          className="h-4 w-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
        />
        <label htmlFor="reminder" className="ml-2 block text-sm text-slate-800">{t('forms.reminder_label')}</label>
      </div>


      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => router.push('/dashboard/calendar')}
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
            ? (event?.id ? t('forms.button_saving_event') : t('forms.button_adding_event'))
            : (event?.id ? t('forms.button_save_changes_event') : t('forms.button_add_event'))}
        </button>
      </div>
    </form>
  );
}
