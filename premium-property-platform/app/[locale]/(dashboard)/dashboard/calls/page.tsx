// app/(dashboard)/dashboard/calls/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CallLog, Client, Property } from '@/types';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Edit3, PhoneCall, User, Home as HomeIcon, AlertTriangle, Info, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getI18n } from '@/lib/i18n';

type PopulatedCallLog = CallLog & {
  clients: Pick<Client, 'id' | 'name'> | null;
  properties: Pick<Property, 'id' | 'street' | 'city'> | null;
};

export default async function CallLogPage({ params: { locale } }: { params: { locale: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const t = await getI18n();

  if (!session) {
    redirect(`/${locale}/login?message=Please log in to view your call logs.`);
  }

  const { data: callLogsData, error: callLogsError } = await supabase
    .from('calls')
    .select(`
      *,
      clients (id, name),
      properties (id, street, city)
    `)
    .eq('broker_id', session.user.id)
    .order('call_time', { ascending: false });

  if (callLogsError) {
    console.error('Error fetching call logs:', callLogsError);
    return (
      <div className="p-6 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md shadow dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 mr-2 flex-shrink-0" />
          <p>{t('calls.error_loading_logs')}</p>
        </div>
      </div>
    );
  }

  const callLogs = callLogsData as PopulatedCallLog[];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <PhoneCall className="h-8 w-8 mr-3 text-amber-500 dark:text-amber-400" /> {t('calls.title')}
        </h1>
        <Link
          href="/dashboard/calls/new"
          className="flex items-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
        >
          <PlusCircle className="h-5 w-5 mr-2" /> {t('calls.log_new_call')}
        </Link>
      </div>

      {callLogs && callLogs.length > 0 ? (
        <div className="space-y-6">
          {callLogs.map((log) => (
            <div key={log.id} className="bg-white dark:bg-slate-800 p-6 shadow-xl dark:shadow-black/20 rounded-lg border-l-4 border-amber-500 dark:border-amber-400 hover:shadow-amber-200/50 dark:hover:shadow-amber-400/20 transition-shadow duration-300">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
                     <Clock size={14} className="mr-1.5 text-slate-400 dark:text-slate-500" />
                     {format(parseISO(log.call_time), 'MMM d, yyyy, h:mm a')}
                  </p>
                  {log.clients ? (
                    <Link href={`/dashboard/clients/${log.clients.id}/edit`} className="text-lg font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center mt-1 group">
                      <User className="h-5 w-5 mr-2 flex-shrink-0 text-sky-500 dark:text-sky-400 group-hover:text-sky-600 dark:group-hover:text-sky-300" /> {log.clients.name}
                    </Link>
                  ) : (<p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mt-1 flex items-center">
                      <PhoneCall size={18} className="mr-2 text-slate-500 dark:text-slate-400"/> {t('calls.general_call_log')}
                    </p>
                  )}
                </div>
                <Link
                    href={`/dashboard/calls/${log.id}/edit`}
                    className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium flex items-center mt-2 sm:mt-0 self-start sm:self-center p-1 rounded-md hover:bg-amber-50 dark:hover:bg-slate-700"
                >
                  <Edit3 className="h-4 w-4 mr-1" /> {t('calls.edit_log')}
                </Link>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 whitespace-pre-wrap bg-slate-50 dark:bg-slate-700/50 p-4 rounded-md border border-slate-200 dark:border-slate-600">{log.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                {log.properties && (
                  <div className="flex items-center col-span-full sm:col-span-1">
                    <HomeIcon className="h-4 w-4 mr-1.5 flex-shrink-0 text-purple-500 dark:text-purple-400" />
                    <span className="font-medium text-slate-500 dark:text-slate-300 mr-1">{t('calls.property_prefix')}</span>
                    <Link href={`/properties/${log.properties.id}`} className="hover:text-purple-700 dark:hover:text-purple-300 hover:underline truncate">
                        {log.properties.street || 'N/A'}, {log.properties.city}
                    </Link>
                  </div>
                )}
                {log.duration_minutes && <p className="flex items-center"><Info className="h-4 w-4 mr-1.5 inline-block text-slate-400 dark:text-slate-500" />{t('calls.duration_prefix')} {log.duration_minutes} {t('calls.duration_suffix')}</p>}
                {log.outcome && <p className="flex items-center"><Info className="h-4 w-4 mr-1.5 inline-block text-slate-400 dark:text-slate-500" />{t('calls.outcome_prefix')} {log.outcome}</p>}
                {log.reminder_at && (
                  <p className={`flex items-center ${new Date(log.reminder_at) < new Date() && !log.reminder_sent ? 'text-red-500 dark:text-red-400 font-semibold' : ''}`}>
                    <Info className="h-4 w-4 mr-1.5 inline-block text-slate-400 dark:text-slate-500" /> {t('calls.reminder_prefix')} {format(parseISO(log.reminder_at), 'MMM d, yyyy, h:mm a')}
                    {log.reminder_sent && <span className="ml-1 text-xs text-green-500 dark:text-green-400">{t('calls.reminder_sent_suffix')}</span>}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center bg-white dark:bg-slate-800 p-12 shadow-xl dark:shadow-black/20 rounded-lg border border-slate-200 dark:border-slate-700">
          <PhoneCall className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500" />
          <h3 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-100">{t('calls.no_logs_title')}</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t('calls.no_logs_message')}
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/calls/new"
              className="inline-flex items-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
            >
              <PlusCircle className="h-5 w-5 mr-2" /> {t('calls.log_new_call')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
