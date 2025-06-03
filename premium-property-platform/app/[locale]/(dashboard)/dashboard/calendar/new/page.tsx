// app/(dashboard)/dashboard/calendar/new/page.tsx
import CalendarEventForm from '@/components/CalendarEventForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Client, Property } from '@/types';
import { getI18n } from '@/lib/i18n';

export default async function NewCalendarEventPage({ params: { locale } }: { params: { locale: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const t = await getI18n();

  if (!session) {
    redirect(`/${locale}/login?message=Please log in to add an event.`);
  }

  // Fetch clients for the dropdown
  const { data: clientsData, error: clientsError } = await supabase
    .from('clients')
    .select('id, name')
    .eq('broker_id', session.user.id)
    .order('name', { ascending: true });

  if (clientsError) {
    console.error("Error fetching clients for form:", clientsError);
  }
  const clients = clientsData as Pick<Client, 'id' | 'name'>[] || [];

  // Fetch properties for the dropdown
  const { data: propertiesData, error: propertiesError } = await supabase
    .from('properties')
    .select('id, street, city')
    .eq('broker_id', session.user.id)
    .order('created_at', { ascending: false });

  if (propertiesError) {
    console.error("Error fetching properties for form:", propertiesError);
  }
  const properties = propertiesData as Pick<Property, 'id' | 'street' | 'city'>[] || [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-start mb-2">
        <Link href="/dashboard/calendar" className="inline-flex items-center text-amber-600 hover:text-amber-700 group text-sm">
          <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> {t('calendar.back_to_calendar')}
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-slate-800">{t('calendar.add_new_event')}</h1>
      {/* CalendarEventForm will be translated in a separate step */}
      <CalendarEventForm
        userId={session.user.id}
        clients={clients}
        properties={properties}
      />
    </div>
  );
}
