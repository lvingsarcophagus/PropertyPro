// src/components/Navbar.tsx
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // For server-side session check
import LogoutButton from './LogoutButton'; // We'll create this next

export default async function Navbar() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <nav className="bg-slate-800 text-white shadow-md">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-amber-500 hover:text-amber-400 transition">
            PremiumProp
        </Link>
        <div className="space-x-4 flex items-center">
          <Link href="/" className="hover:text-slate-300">Home</Link>
          <Link href="/properties" className="hover:text-slate-300">Properties</Link>
          {/* Add other common links here */}

          {session ? (
            <>
              <Link href="/profile" className="hover:text-slate-300">
                Profile ({session.user.email?.split('@')[0]})
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-slate-300">Login</Link>
              <Link href="/signup" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2 px-4 rounded-md transition duration-300">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
