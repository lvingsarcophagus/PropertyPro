// app/(dashboard)/dashboard/calendar/[eventId]/edit/page.tsx
import CalendarEventForm from '@/components/CalendarEventForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Client, Property, CalendarEvent } from '@/types';
import Link from 'next/link';
import { ChevronLeft, AlertTriangle } from 'lucide-react';

type EditCalendarEventPageProps = {
  params: { eventId: string };
};

export default async function EditCalendarEventPage({ params }: EditCalendarEventPageProps) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?message=Please log in to edit an event.');
  }

  // Fetch the specific event
  const { data: eventData, error: eventError } = await supabase
    .from('calendar')
    .select('*')
    .eq('id', params.eventId)
    .eq('broker_id', session.user.id) // Authorization: user can only fetch their own events
    .single();

  if (eventError) {
    console.error('Error fetching event for edit:', eventError.message, 'Code:', eventError.code);
    if (eventError.code === 'PGRST116' || eventError.code === '22P02') {
      return (
        <div className="p-6 text-center max-w-lg mx-auto bg-white shadow-lg rounded-lg border border-red-200">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Event Not Found or Not Authorized</h2>
          <p className="text-slate-600 text-sm mb-6">
            The event you are trying to edit could not be found, or you do not have permission to access it.
          </p>
          <Link href="/dashboard/calendar" className="inline-flex items-center text-amber-600 hover:text-amber-700 group text-sm">
            <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> Return to Calendar
          </Link>
        </div>
      );
    }
    return (
        <div className="p-6 text-center max-w-lg mx-auto bg-white shadow-lg rounded-lg border border-red-200">
             <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Event</h2>
            <p className="text-slate-600 text-sm mb-6">An unexpected error occurred. Please try again later.</p>
            <Link href="/dashboard/calendar" className="inline-flex items-center text-amber-600 hover:text-amber-700 group text-sm">
                <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> Return to Calendar
            </Link>
        </div>
    );
  }
  const event = eventData as CalendarEvent;

  // Fetch clients for the dropdown
  const { data: clientsData, error: clientsError } = await supabase
    .from('clients')
    .select('id, name')
    .eq('broker_id', session.user.id)
    .order('name', { ascending: true });
  if (clientsError) console.error("Error fetching clients for form:", clientsError);
  const clients = clientsData as Pick<Client, 'id' | 'name'>[] || [];

  // Fetch properties for the dropdown
  const { data: propertiesData, error: propertiesError } = await supabase
    .from('properties')
    .select('id, street, city')
    .eq('broker_id', session.user.id)
    .order('created_at', { ascending: false });
  if (propertiesError) console.error("Error fetching properties for form:", propertiesError);
  const properties = propertiesData as Pick<Property, 'id' | 'street' | 'city'>[] || [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-start mb-2">
        <Link href="/dashboard/calendar" className="inline-flex items-center text-amber-600 hover:text-amber-700 group text-sm">
          <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> Back to Calendar
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-slate-800">Edit Event: <span className="font-normal">{event.title}</span></h1>
      <CalendarEventForm
        event={event}
        userId={session.user.id}
        clients={clients}
        properties={properties}
      />
    </div>
  );
}
