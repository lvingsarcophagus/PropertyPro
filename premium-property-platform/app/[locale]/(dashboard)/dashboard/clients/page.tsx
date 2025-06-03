// app/(dashboard)/dashboard/clients/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Client } from '@/types';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Edit3, UserCircle, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { getI18n } from '@/lib/i18n';

export default async function ClientsPage({ params: { locale } }: { params: { locale: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const t = await getI18n();

  if (!session) {
    redirect(`/${locale}/login?message=Please log in to view your clients.`);
  }

  const { data: clientsData, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .eq('broker_id', session.user.id)
    .order('name', { ascending: true });

  if (clientsError) {
    console.error('Error fetching clients:', clientsError);
    return (
        <div className="p-6 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md shadow dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">
            <div className="flex">
                <div className="py-1"><AlertTriangle size={20} className="mr-3"/></div>
                <div>
                    <p className="font-bold">{t('common.error_generic_short')}</p>
                    <p className="text-sm">{t('clients.error_loading_clients')}</p>
                </div>
            </div>
        </div>
    );
  }

  const clients = clientsData as Client[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('clients.title')}</h1>
        <Link
          href="/dashboard/clients/new"
          className="flex items-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
        >
          <PlusCircle className="h-5 w-5 mr-2" /> {t('clients.add_new_client')}
        </Link>
      </div>

      {clients && clients.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-lg overflow-x-auto border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('common.name')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('common.email')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('common.phone')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserCircle className="h-8 w-8 text-slate-400 dark:text-slate-500 mr-3 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{client.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{t('common.id_prefix')} {client.id.substring(0,8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{client.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{client.phone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link href={`/dashboard/clients/${client.id}/edit`} className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors p-1 inline-flex items-center justify-center rounded-md hover:bg-amber-100 dark:hover:bg-slate-700" title={t('common.edit')}>
                      <Edit3 className="h-5 w-5" /> <span className="sr-only">{t('common.edit')}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center bg-white dark:bg-slate-800 p-12 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700">
          <UserCircle className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500" />
          <h3 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-100">{t('clients.no_clients_title')}</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t('clients.no_clients_message')}
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/clients/new"
              className="inline-flex items-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
            >
              <PlusCircle className="h-5 w-5 mr-2" /> {t('clients.add_new_client')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
