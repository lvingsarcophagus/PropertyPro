// app/(dashboard)/dashboard/calendar/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CalendarEvent, Client, Property } from '@/types'; // Ensure these types are correctly defined
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Edit3, Calendar as CalendarIcon, Clock, User, HomeIcon, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// Define an extended type for calendar events with joined data
type CalendarEventWithDetails = CalendarEvent & {
  clients: Pick<Client, 'id' | 'name'> | null; // Only name is needed from Client
  properties: Pick<Property, 'id' | 'street' | 'city'> | null; // Only street/city from Property
};

export default async function CalendarPage() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?message=Please log in to view your calendar.');
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
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
          <div className="flex">
            <div className="py-1"><Info size={20} className="mr-3"/></div>
            <div>
              <p className="font-bold">Error Loading Calendar</p>
              <p className="text-sm">Could not retrieve calendar events. Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const events = eventsData as CalendarEventWithDetails[];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800">My Calendar</h1>
        <Link 
          href="/dashboard/calendar/new"
          className="flex items-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
        >
          <PlusCircle className="h-5 w-5 mr-2" /> Add New Event
        </Link>
      </div>

      {events && events.length > 0 ? (
        <div className="space-y-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white p-6 shadow-lg rounded-xl border border-slate-200 hover:shadow-2xl transition-shadow duration-300 ease-in-out">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                <h2 className="text-xl font-semibold text-slate-800 capitalize flex items-center">
                  <CalendarIcon size={22} className="mr-2 text-amber-500" /> 
                  {event.event_type}: {event.title}
                </h2>
                <Link 
                  href={`/dashboard/calendar/${event.id}/edit`} 
                  className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center mt-2 sm:mt-0"
                >
                  <Edit3 size={16} className="mr-1" /> Edit Event
                </Link>
              </div>

              <div className="text-sm text-slate-600 space-y-2">
                <p className="flex items-center">
                  <Clock size={16} className="mr-2 text-slate-400" /> 
                  <strong>Time:</strong> {format(parseISO(event.start_time), 'PPpp')} - {format(parseISO(event.end_time), 'p')}
                </p>
                {event.description && (
                  <p><strong className="text-slate-700">Description:</strong> {event.description}</p>
                )}
                {event.clients && (
                  <p className="flex items-center">
                    <User size={16} className="mr-2 text-slate-400" /> 
                    <strong>Client:</strong> 
                    <Link href={`/dashboard/clients/${event.clients.id}/edit`} className="ml-1 text-blue-600 hover:underline">
                        {event.clients.name}
                    </Link>
                  </p>
                )}
                {event.properties && (
                  <p className="flex items-center">
                    <HomeIcon size={16} className="mr-2 text-slate-400" /> 
                    <strong>Property:</strong> 
                    <Link href={`/properties/${event.properties.id}`} className="ml-1 text-blue-600 hover:underline">
                        {event.properties.street}, {event.properties.city}
                    </Link>
                  </p>
                )}
                 {event.reminder && (
                    <p className="text-xs text-purple-600 font-medium pt-1">Reminder Set</p>
                 )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-12 shadow-lg rounded-lg border border-slate-200">
          <CalendarIcon className="mx-auto h-16 w-16 text-slate-400" />
          <h3 className="mt-4 text-xl font-semibold text-slate-800">No Events Scheduled</h3>
          <p className="mt-2 text-sm text-slate-500">
            Your calendar is currently empty. Add some events to get started!
          </p>
          <div className="mt-6">
            <Link 
              href="/dashboard/calendar/new"
              className="inline-flex items-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
            >
              <PlusCircle className="h-5 w-5 mr-2" /> Add New Event
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
