// app/(dashboard)/layout.tsx
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getI18n } from '@/lib/i18n'; // Import getI18n

export default async function DashboardLayout(
  { children }: { children: React.ReactNode }
) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const t = await getI18n(); // Initialize translations

  if (!session) {
    redirect('/login?message=You must be logged in to view the dashboard.');
  }

  // Define navItems inside the async function after t is initialized
  const navItems = [
    { name: t('dashboard_sidebar.overview'), href: '/dashboard' },
    { name: t('dashboard_sidebar.my_properties'), href: '/properties' },
    { name: t('dashboard_sidebar.my_clients'), href: '/dashboard/clients' },
    { name: t('dashboard_sidebar.my_calls'), href: '/dashboard/calls'}, // Added My Calls
    { name: t('dashboard_sidebar.messages'), href: '/dashboard/messages' },
    { name: t('dashboard_sidebar.calendar'), href: '/dashboard/calendar' },
    { name: t('dashboard_sidebar.profile_settings'), href: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="flex">
        {/* Sidebar */}
        {/* Adjusted pt to ensure it's below the 4rem (h-16) fixed navbar */}
        <aside className="w-64 bg-slate-800 text-white p-6 space-y-3 fixed top-16 left-0 h-[calc(100vh-4rem)] z-30 shadow-lg lg:translate-x-0 transform -translate-x-full lg:static transition-transform duration-300 ease-in-out overflow-y-auto">
         <h2 className="text-xl font-semibold mb-4 text-amber-400 border-b border-slate-700 pb-2">{t('dashboard_sidebar.menu_title')}</h2>
          {navItems.map((item) => (
            <Link
              key={item.name} // Using item.name might be problematic if names are not unique or change with locale. href is better if unique.
              href={item.href}
              className="block py-2.5 px-4 rounded-md hover:bg-slate-700 transition-colors duration-200 text-sm"
            >
              {item.name}
            </Link>
          ))}
          <hr className="my-3 border-slate-700"/>
          <Link href="/" className="block py-2.5 px-4 rounded-md hover:bg-slate-700 transition-colors duration-200 text-sm">
             {t('dashboard_sidebar.back_to_homepage')}
          </Link>
        </aside>

        {/* Main Content Area */}
        {/* Added pt-16 (navbar height) to main content area so content starts below navbar */}
        <main className="flex-1 p-6 ml-0 lg:ml-0 transition-all duration-300 ease-in-out pt-20 lg:pt-6">
          {/* Children are rendered here */}
          {children}
        </main>
      </div>
    </div>
  );
}
