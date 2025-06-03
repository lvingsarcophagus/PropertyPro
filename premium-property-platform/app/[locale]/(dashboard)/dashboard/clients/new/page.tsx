// app/(dashboard)/dashboard/clients/new/page.tsx
import ClientForm from '@/components/ClientForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getI18n } from '@/lib/i18n';

export default async function NewClientPage({ params: { locale } }: { params: { locale: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const t = await getI18n();

  if (!session) {
    redirect(`/${locale}/login?message=Please log in to add a client.`);
  }

  // Note: ClientForm itself will be translated in a separate step if it contains static text.
  // This page component mainly provides the title and back link.
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-start mb-2">
        <Link href="/dashboard/clients" className="inline-flex items-center text-amber-600 hover:text-amber-700 group text-sm">
          <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-0.5 transition-transform" /> {t('clients.back_to_clients')}
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-slate-800">{t('clients.add_new_client')}</h1>
      <ClientForm userId={session.user.id} />
    </div>
  );
}
