// app/(dashboard)/dashboard/clients/[clientId]/edit/page.tsx
import ClientForm from '@/components/ClientForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Client } from '@/types';
import Link from 'next/link';
import { ChevronLeft, AlertTriangle } from 'lucide-react';

type EditClientPageProps = {
  params: { clientId: string };
};

export default async function EditClientPage({ params }: EditClientPageProps) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?message=Please log in to edit a client.');
  }

  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.clientId)
    .eq('broker_id', session.user.id) // Authorization check: user can only fetch their own clients
    .single();

  if (clientError) {
    console.error('Error fetching client for edit:', clientError.message, 'Code:', clientError.code);
    if (clientError.code === 'PGRST116' || clientError.code === '22P02') { // PGRST116: Not found (or more than one row); 22P02: invalid input syntax for type uuid
      return (
        <div className="p-6 text-center max-w-lg mx-auto bg-white shadow-lg rounded-lg border border-red-200">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Client Not Found or Not Authorized</h2>
          <p className="text-slate-600 text-sm mb-6">
            The client you are trying to edit could not be found, or you do not have permission to access it. 
            This might happen if the client ID is incorrect or the client has been deleted.
          </p>
          <Link href="/dashboard/clients" className="inline-flex items-center text-amber-600 hover:text-amber-700 group text-sm">
            <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> Return to Clients List
          </Link>
        </div>
      );
    }
    // Generic error for other cases
    return (
        <div className="p-6 text-center max-w-lg mx-auto bg-white shadow-lg rounded-lg border border-red-200">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Client</h2>
            <p className="text-slate-600 text-sm mb-6">An unexpected error occurred while trying to load client data. Please try again later.</p>
            <Link href="/dashboard/clients" className="inline-flex items-center text-amber-600 hover:text-amber-700 group text-sm">
                <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> Return to Clients List
            </Link>
        </div>
    );
  }

  const client = clientData as Client;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
       <div className="flex justify-start mb-2">
        <Link href="/dashboard/clients" className="inline-flex items-center text-amber-600 hover:text-amber-700 group text-sm">
          <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> Back to Clients
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-slate-800">Edit Client: <span className="font-normal">{client.name}</span></h1>
      <ClientForm client={client} userId={session.user.id} />
    </div>
  );
}
