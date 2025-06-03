// app/(dashboard)/dashboard/clients/new/page.tsx
import ClientForm from '@/components/ClientForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function NewClientPage() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?message=Please log in to add a client.');
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-start mb-2">
        <Link href="/dashboard/clients" className="inline-flex items-center text-amber-600 hover:text-amber-700 group text-sm">
          <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> Back to Clients
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-slate-800">Add New Client</h1>
      <ClientForm userId={session.user.id} />
    </div>
  );
}
