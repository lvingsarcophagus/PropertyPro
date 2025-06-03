// app/(dashboard)/dashboard/calls/new/page.tsx
import CallLogForm from '@/components/CallLogForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Client, Property } from '@/types';

export default async function NewCallLogPage() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?message=Please log in to log a call.');
  }

  // Fetch clients for the dropdown
  const { data: clientsData, error: clientsError } = await supabase
    .from('clients')
    .select('id, name')
    .eq('broker_id', session.user.id)
    .order('name', { ascending: true });

  if (clientsError) {
    console.error("Error fetching clients for call log form:", clientsError);
    // Handle error, maybe pass empty array or show error message
  }
  const clients = clientsData as Pick<Client, 'id' | 'name'>[] || [];

  // Fetch properties for the dropdown
  const { data: propertiesData, error: propertiesError } = await supabase
    .from('properties')
    .select('id, street, city') 
    .eq('broker_id', session.user.id) // Assuming properties are linked to broker directly
    .order('created_at', { ascending: false });
    // Consider if company users logging calls need different property fetching logic (e.g., by agency_id)

  if (propertiesError) {
    console.error("Error fetching properties for call log form:", propertiesError);
  }
  const properties = propertiesData as Pick<Property, 'id' | 'street' | 'city'>[] || [];


  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-start mb-2">
        <Link href="/dashboard/calls" className="inline-flex items-center text-amber-600 hover:text-amber-700 group text-sm">
          <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> Back to Call Logs
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-slate-800">Log New Call</h1>
      <CallLogForm 
        userId={session.user.id} 
        clients={clients}
        properties={properties}
      />
    </div>
  );
}
