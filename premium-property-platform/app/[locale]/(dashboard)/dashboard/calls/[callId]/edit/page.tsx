// app/(dashboard)/dashboard/calls/[callId]/edit/page.tsx
import CallLogForm from '@/components/CallLogForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Client, Property, CallLog } from '@/types';
import Link from 'next/link';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { getI18n } from '@/lib/i18n';

type EditCallLogPageProps = {
  params: { callId: string; locale: string }; // Added locale
};

export default async function EditCallLogPage({ params }: EditCallLogPageProps) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const t = await getI18n();

  if (!session) {
    redirect(`/${params.locale}/login?message=Please log in to edit a call log.`);
  }

  // Fetch the specific call log
  const { data: callLogData, error: callLogError } = await supabase
    .from('calls')
    .select('*')
    .eq('id', params.callId)
    .eq('broker_id', session.user.id)
    .single();

  if (callLogError) {
    console.error('Error fetching call log for edit:', callLogError.message, 'Code:', callLogError.code);
    if (callLogError.code === 'PGRST116' || callLogError.code === '22P02') {
      return (
        <div className="p-6 text-center max-w-lg mx-auto bg-white shadow-lg rounded-lg border border-red-200">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">{t('calls.error_log_not_found_or_authorized_title')}</h2>
          <p className="text-slate-600 text-sm mb-6">
            {t('calls.error_log_not_found_or_authorized_message')}
          </p>
          <Link href="/dashboard/calls" className="inline-flex items-center text-amber-600 hover:text-amber-700 group text-sm">
            <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> {t('calls.back_to_calls')}
          </Link>
        </div>
      );
    }
    return (
        <div className="p-6 text-center max-w-lg mx-auto bg-white shadow-lg rounded-lg border border-red-200">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">{t('calls.error_loading_logs')}</h2> {/* A more generic title here */}
            <p className="text-slate-600 text-sm mb-6">{t('common.error_generic_short')}</p>
            <Link href="/dashboard/calls" className="inline-flex items-center text-amber-600 hover:text-amber-700 group text-sm">
                <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> {t('calls.back_to_calls')}
            </Link>
        </div>
    );
  }
  const callLog = callLogData as CallLog;

  // Fetch clients for the dropdown
  const { data: clientsData, error: clientsError } = await supabase
    .from('clients')
    .select('id, name')
    .eq('broker_id', session.user.id)
    .order('name', { ascending: true });
  if (clientsError) console.error("Error fetching clients for call log form:", clientsError);
  const clients = clientsData as Pick<Client, 'id' | 'name'>[] || [];

  // Fetch properties for the dropdown
  const { data: propertiesData, error: propertiesError } = await supabase
    .from('properties')
    .select('id, street, city')
    .eq('broker_id', session.user.id)
    .order('created_at', { ascending: false });
  if (propertiesError) console.error("Error fetching properties for call log form:", propertiesError);
  const properties = propertiesData as Pick<Property, 'id' | 'street' | 'city'>[] || [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-start mb-2">
        <Link href="/dashboard/calls" className="inline-flex items-center text-amber-600 hover:text-amber-700 group text-sm">
          <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> {t('calls.back_to_calls')}
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-slate-800">{t('calls.edit_log')}</h1>
      {/* CallLogForm will be translated in a separate step */}
      <CallLogForm
        log={callLog}
        userId={session.user.id}
        clients={clients}
        properties={properties}
      />
    </div>
  );
}
