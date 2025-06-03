// app/(dashboard)/dashboard/clients/[clientId]/edit/page.tsx
import ClientForm from '@/components/ClientForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Client } from '@/types';
import Link from 'next/link';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { getI18n } from '@/lib/i18n';

type EditClientPageProps = {
  params: { clientId: string; locale: string }; // Added locale
};

export default async function EditClientPage({ params }: EditClientPageProps) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const t = await getI18n();

  if (!session) {
    redirect(`/${params.locale}/login?message=Please log in to edit a client.`);
  }

  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.clientId)
    .eq('broker_id', session.user.id)
    .single();

  if (clientError) {
    console.error('Error fetching client for edit:', clientError.message, 'Code:', clientError.code);
    if (clientError.code === 'PGRST116' || clientError.code === '22P02') {
      return (
        <div className="p-6 text-center max-w-lg mx-auto bg-white shadow-lg rounded-lg border border-red-200">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">{t('clients.error_not_found_or_authorized_title')}</h2>
          <p className="text-slate-600 text-sm mb-6">
            {t('clients.error_not_found_or_authorized_message')}
          </p>
          <Link href="/dashboard/clients" className="inline-flex items-center text-amber-600 hover:text-amber-700 group text-sm">
            <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> {t('clients.back_to_clients')}
          </Link>
        </div>
      );
    }
    return (
        <div className="p-6 text-center max-w-lg mx-auto bg-white shadow-lg rounded-lg border border-red-200">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">{t('clients.error_loading_client_data')}</h2>
            <p className="text-slate-600 text-sm mb-6">{t('common.error_generic_short')}</p>
            <Link href="/dashboard/clients" className="inline-flex items-center text-amber-600 hover:text-amber-700 group text-sm">
                <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> {t('clients.back_to_clients')}
            </Link>
        </div>
    );
  }

  const client = clientData as Client;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
       <div className="flex justify-start mb-2">
        <Link href="/dashboard/clients" className="inline-flex items-center text-amber-600 hover:text-amber-700 group text-sm">
          <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> {t('clients.back_to_clients')}
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-slate-800">{t('clients.edit_client_title', { name: client.name })}</h1>
      {/* ClientForm itself will be translated in a later step */}
      <ClientForm client={client} userId={session.user.id} />
    </div>
  );
}
