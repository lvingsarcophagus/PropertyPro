// src/components/Navbar.tsx
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import LogoutButton from './LogoutButton';
import { getI18n } from '@/lib/i18n'; // Import getI18n
import LanguageSwitcher from './LanguageSwitcher'; // Import LanguageSwitcher

export default async function Navbar() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const t = await getI18n(); // Initialize translations

  return (
    <nav className="bg-slate-800 text-white shadow-md fixed w-full top-0 z-50 h-16 flex items-center"> {/* Ensure fixed height and z-index */}
      <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-amber-500 hover:text-amber-400 transition">
            PremiumProp
        </Link>
        <div className="space-x-3 sm:space-x-4 flex items-center">
          <Link href="/" className="hover:text-slate-300 text-sm sm:text-base">{t('navbar.home')}</Link>
          <Link href="/properties" className="hover:text-slate-300 text-sm sm:text-base">{t('navbar.properties')}</Link>

          {session && (
            <Link href="/dashboard" className="hover:text-slate-300 text-sm sm:text-base">{t('navbar.dashboard')}</Link>
          )}

          {session ? (
            <>
              <Link href="/profile" className="hover:text-slate-300 text-sm sm:text-base">
                {t('navbar.profile')}
                {/* ({session.user.email?.split('@')[0]})  // Username can be part of profile page itself */}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-slate-300 text-sm sm:text-base">{t('navbar.login')}</Link>
              <Link href="/signup" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2 px-3 sm:px-4 rounded-md transition duration-300 text-sm sm:text-base">
                {t('navbar.signup')}
              </Link>
            </>
          )}
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}
