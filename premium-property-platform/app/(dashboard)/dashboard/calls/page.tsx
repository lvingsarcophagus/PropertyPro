// app/(dashboard)/dashboard/calls/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CallLog, Client, Property } from '@/types'; // Import necessary types
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Edit3, PhoneCall, User, Home as HomeIcon, AlertTriangle, Info, Clock } from 'lucide-react'; // Added Clock
import { format, parseISO } from 'date-fns'; // For formatting dates

// Helper type for call log with populated data
type PopulatedCallLog = CallLog & {
  clients: Pick<Client, 'id' | 'name'> | null;
  properties: Pick<Property, 'id' | 'street' | 'city'> | null;
};

export default async function CallLogPage() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?message=Please log in to view your call logs.');
  }

  const { data: callLogsData, error: callLogsError } = await supabase
    .from('calls')
    .select(`
      *,
      clients (id, name),
      properties (id, street, city)
    `)
    .eq('broker_id', session.user.id)
    .order('call_time', { ascending: false }); // Show most recent calls first

  if (callLogsError) {
    console.error('Error fetching call logs:', callLogsError);
    return (
      <div className="p-6 bg-white shadow-md rounded-lg">
        <div className="flex items-center text-red-600">
          <AlertTriangle className="h-6 w-6 mr-2 flex-shrink-0" />
          <p>Error loading call logs. Please try again later.</p>
        </div>
      </div>
    );
  }

  const callLogs = callLogsData as PopulatedCallLog[];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center">
          <PhoneCall className="h-8 w-8 mr-3 text-amber-500" /> Call Logs
        </h1>
        <Link
          href="/dashboard/calls/new"
          className="flex items-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
        >
          <PlusCircle className="h-5 w-5 mr-2" /> Log New Call
        </Link>
      </div>

      {callLogs && callLogs.length > 0 ? (
        <div className="space-y-6">
          {callLogs.map((log) => (
            <div key={log.id} className="bg-white p-6 shadow-xl rounded-lg border-l-4 border-amber-500 hover:shadow-amber-200/50 transition-shadow duration-300">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-3">
                <div>
                  <p className="text-sm text-slate-500 flex items-center">
                     <Clock size={14} className="mr-1.5 text-slate-400" />
                     {format(parseISO(log.call_time), 'MMM d, yyyy, h:mm a')}
                  </p>
                  {log.clients ? (
                    <Link href={`/dashboard/clients/${log.clients.id}/edit`} className="text-lg font-semibold text-sky-600 hover:text-sky-700 flex items-center mt-1 group">
                      <User className="h-5 w-5 mr-2 flex-shrink-0 text-sky-500 group-hover:text-sky-600" /> {log.clients.name}
                    </Link>
                  ) : (<p className="text-lg font-semibold text-slate-700 mt-1 flex items-center">
                      <PhoneCall size={18} className="mr-2 text-slate-500"/> General Call Log
                    </p>
                  )}
                </div>
                <Link
                    href={`/dashboard/calls/${log.id}/edit`}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center mt-2 sm:mt-0 self-start sm:self-center p-1 rounded-md hover:bg-amber-50"
                >
                  <Edit3 className="h-4 w-4 mr-1" /> Edit Log
                </Link>
              </div>

              <p className="text-sm text-slate-700 mb-3 whitespace-pre-wrap bg-slate-50 p-4 rounded-md border border-slate-200">{log.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200">
                {log.properties && (
                  <div className="flex items-center col-span-full sm:col-span-1">
                    <HomeIcon className="h-4 w-4 mr-1.5 flex-shrink-0 text-purple-500" />
                    <span className="font-medium text-slate-500 mr-1">Property:</span>
                    <Link href={`/properties/${log.properties.id}`} className="hover:text-purple-700 hover:underline truncate">
                        {log.properties.street || 'N/A'}, {log.properties.city}
                    </Link>
                  </div>
                )}
                {log.duration_minutes && <p className="flex items-center"><Info className="h-4 w-4 mr-1.5 inline-block text-slate-400" />Duration: {log.duration_minutes} mins</p>}
                {log.outcome && <p className="flex items-center"><Info className="h-4 w-4 mr-1.5 inline-block text-slate-400" />Outcome: {log.outcome}</p>}
                {log.reminder_at && (
                  <p className={`flex items-center ${new Date(log.reminder_at) < new Date() && !log.reminder_sent ? 'text-red-600 font-semibold' : ''}`}>
                    <Info className="h-4 w-4 mr-1.5 inline-block text-slate-400" /> Reminder: {format(parseISO(log.reminder_at), 'MMM d, yyyy, h:mm a')}
                    {log.reminder_sent && <span className="ml-1 text-xs text-green-600">(Sent)</span>}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center bg-white p-12 shadow-xl rounded-lg border border-slate-200">
          <PhoneCall className="mx-auto h-16 w-16 text-slate-400" />
          <h3 className="mt-4 text-xl font-semibold text-slate-800">No Call Logs Yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            You haven't logged any calls. Keep track of your client communications here.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/calls/new"
              className="inline-flex items-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
            >
              <PlusCircle className="h-5 w-5 mr-2" /> Log New Call
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
