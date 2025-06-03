// app/(dashboard)/dashboard/calendar/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CalendarEvent, Client, Property } from '@/types';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Edit3, Calendar as CalendarIcon, Clock, User, HomeIcon, Info, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { format, parseISO } from 'date-fns';
import { getI18n } from '@/lib/i18n';

type CalendarEventWithDetails = CalendarEvent & {
  clients: Pick<Client, 'id' | 'name'> | null;
  properties: Pick<Property, 'id' | 'street' | 'city'> | null;
};

export default async function CalendarPage({ params: { locale } }: { params: { locale: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const t = await getI18n();

  if (!session) {
    redirect(`/${locale}/login?message=Please log in to view your calendar.`);
  }

  const { data: eventsData, error: eventsError } = await supabase
    .from('calendar')
    .select(`
      *,
      clients (id, name),
      properties (id, street, city)
    `)
    .eq('broker_id', session.user.id)
    .order('start_time', { ascending: true });

  if (eventsError) {
    console.error('Error fetching calendar events:', eventsError);
    return (
      <div className="p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md dark:bg-red-900/30 dark:text-red-300 dark:border-red-700" role="alert">
          <div className="flex">
            <div className="py-1"><AlertTriangle size={20} className="mr-3"/></div> {/* Changed Icon */}
            <div>
              <p className="font-bold">{t('calendar.error_loading_calendar_title')}</p>
              <p className="text-sm">{t('calendar.error_loading_calendar_message')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const events = eventsData as CalendarEventWithDetails[];

  const getEventTypeTranslation = (eventType: CalendarEvent['event_type']) => {
    switch (eventType) {
      case 'appointment': return t('calendar.event_type_appointment');
      case 'viewing': return t('calendar.event_type_viewing');
      case 'task': return t('calendar.event_type_task');
      default: return eventType;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('calendar.title')}</h1>
        <Link
          href="/dashboard/calendar/new"
          className="flex items-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
        >
          <PlusCircle className="h-5 w-5 mr-2" /> {t('calendar.add_new_event')}
        </Link>
      </div>

      {events && events.length > 0 ? (
        <div className="space-y-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white dark:bg-slate-800 p-6 shadow-lg dark:shadow-black/20 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-2xl dark:hover:shadow-slate-700/60 transition-shadow duration-300 ease-in-out">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 capitalize flex items-center">
                  <CalendarIcon size={22} className="mr-2 text-amber-500 dark:text-amber-400" />
                  {getEventTypeTranslation(event.event_type)}: {event.title}
                </h2>
                <Link
                  href={`/dashboard/calendar/${event.id}/edit`}
                  className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium flex items-center mt-2 sm:mt-0 p-1 rounded-md hover:bg-amber-50 dark:hover:bg-slate-700"
                >
                  <Edit3 size={16} className="mr-1" /> {t('calendar.edit_event')}
                </Link>
              </div>

              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                <p className="flex items-center">
                  <Clock size={16} className="mr-2 text-slate-400 dark:text-slate-500" />
                  <strong className="text-slate-700 dark:text-slate-200">{t('calendar.event_time')}</strong> {format(parseISO(event.start_time), 'PPpp')} - {format(parseISO(event.end_time), 'p')}
                </p>
                {event.description && (
                  <p><strong className="text-slate-700 dark:text-slate-200">{t('calendar.event_description')}</strong> {event.description}</p>
                )}
                {event.clients && (
                  <p className="flex items-center">
                    <User size={16} className="mr-2 text-slate-400 dark:text-slate-500" />
                    <strong className="text-slate-700 dark:text-slate-200">{t('calendar.event_client')}</strong>
                    <Link href={`/dashboard/clients/${event.clients.id}/edit`} className="ml-1 text-blue-600 dark:text-blue-400 hover:underline">
                        {event.clients.name}
                    </Link>
                  </p>
                )}
                {event.properties && (
                  <p className="flex items-center">
                    <HomeIcon size={16} className="mr-2 text-slate-400 dark:text-slate-500" />
                    <strong className="text-slate-700 dark:text-slate-200">{t('calendar.event_property')}</strong>
                    <Link href={`/properties/${event.properties.id}`} className="ml-1 text-blue-600 dark:text-blue-400 hover:underline">
                        {event.properties.street}, {event.properties.city}
                    </Link>
                  </p>
                )}
                 {event.reminder && (
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium pt-1">{t('calendar.reminder_set')}</p>
                 )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center bg-white dark:bg-slate-800 p-12 shadow-lg dark:shadow-black/20 rounded-lg border border-slate-200 dark:border-slate-700">
          <CalendarIcon className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500" />
          <h3 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-100">{t('calendar.no_events_title')}</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t('calendar.no_events_message')}
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/calendar/new"
              className="inline-flex items-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
            >
              <PlusCircle className="h-5 w-5 mr-2" /> {t('calendar.add_new_event')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
