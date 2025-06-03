// app/(dashboard)/dashboard/clients/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Client } from '@/types'; // Import the Client type
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Edit3, UserCircle } from 'lucide-react'; // Example icons

export default async function ClientsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?message=Please log in to view your clients.');
  }

  const { data: clientsData, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .eq('broker_id', session.user.id)
    .order('name', { ascending: true });

  if (clientsError) {
    console.error('Error fetching clients:', clientsError);
    return <div className="p-6"><p className="text-red-500">Error loading clients. Please try again later.</p></div>;
  }

  const clients = clientsData as Client[];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">My Clients</h1>
        <Link
          href="/dashboard/clients/new"
          className="flex items-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
        >
          <PlusCircle className="h-5 w-5 mr-2" /> Add New Client
        </Link>
      </div>

      {clients && clients.length > 0 ? (
        <div className="bg-white shadow-xl rounded-lg overflow-x-auto border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserCircle className="h-8 w-8 text-slate-400 mr-3 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{client.name}</div>
                        <div className="text-xs text-slate-500">ID: {client.id.substring(0,8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{client.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{client.phone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link href={`/dashboard/clients/${client.id}/edit`} className="text-amber-600 hover:text-amber-800 transition-colors p-1 inline-flex items-center justify-center rounded-md hover:bg-amber-100">
                      <Edit3 className="h-5 w-5" /> <span className="sr-only">Edit</span>
                    </Link>
                    {/* Delete button can be added here or on the edit page
                    <button className="text-red-600 hover:text-red-800 transition-colors p-1 inline-flex items-center justify-center rounded-md hover:bg-red-100"><Trash2 className="h-5 w-5" /> <span className="sr-only">Delete</span></button>
                    */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center bg-white p-12 shadow-lg rounded-lg border border-slate-200">
          <UserCircle className="mx-auto h-16 w-16 text-slate-400" />
          <h3 className="mt-4 text-xl font-semibold text-slate-800">No Clients Yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            You haven't added any clients to your list. Get started by adding your first one!
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/clients/new"
              className="inline-flex items-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
            >
              <PlusCircle className="h-5 w-5 mr-2" /> Add New Client
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
