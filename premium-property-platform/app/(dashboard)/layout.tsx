// app/(dashboard)/layout.tsx
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
// import { Inter } from 'next/font/google'; // Optional: if a different font is desired
import Navbar from '@/components/Navbar'; 

// const inter = Inter({ subsets: ['latin'] }); // Optional

export default async function DashboardLayout(
  { children }: { children: React.ReactNode }
) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?message=You must be logged in to view the dashboard.');
  }

  const navItems = [
    { name: 'Overview', href: '/dashboard' },
    { name: 'My Properties', href: '/properties' }, 
    { name: 'My Clients', href: '/dashboard/clients' }, // Placeholder page
    { name: 'Messages', href: '/dashboard/messages' }, // Placeholder page
    { name: 'Calendar', href: '/dashboard/calendar' }, // Placeholder page
    { name: 'Profile & Settings', href: '/profile' }, 
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar /> 
      <div className="flex"> {/* Removed pt-4, Navbar height is handled by sidebar's top padding */}
        {/* Sidebar */} 
        <aside className="w-64 bg-slate-800 text-white p-6 space-y-3 fixed top-0 left-0 h-full pt-[calc(4rem+1.5rem)] z-30 shadow-lg lg:translate-x-0 transform -translate-x-full lg:static transition-transform duration-300 ease-in-out">
         {/* Assuming Navbar is approx 4rem high. Adjust pt value as needed. */}
         <h2 className="text-xl font-semibold mb-4 text-amber-400 border-b border-slate-700 pb-2">Dashboard Menu</h2>
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block py-2.5 px-4 rounded-md hover:bg-slate-700 transition-colors duration-200 text-sm"
            >
              {item.name}
            </Link>
          ))}
          <hr className="my-3 border-slate-700"/>
          <Link href="/" className="block py-2.5 px-4 rounded-md hover:bg-slate-700 transition-colors duration-200 text-sm">
             Back to Homepage
          </Link>
        </aside>

        {/* Main Content Area */} 
        <main className="flex-1 p-6 ml-0 lg:ml-0 transition-all duration-300 ease-in-out pt-16 lg:pt-6"> {/* Added pt-16 for mobile to clear fixed navbar, lg:pt-6 for consistency */}
          {/* The ml-0 lg:ml-0 is because the sidebar is part of the flex flow on lg screens (lg:static) */}
          {/* On smaller screens, the sidebar is -translate-x-full, so main doesn't need margin. */}
          {/* We need top padding on main content to clear the fixed Navbar, especially on mobile when sidebar is hidden. */}
          {children}
        </main>
      </div>
    </div>
  );
}
