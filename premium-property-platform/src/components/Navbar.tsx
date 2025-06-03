// src/components/Navbar.tsx
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import LogoutButton from './LogoutButton';
import { getI18n } from '@/lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggleButton from './ThemeToggleButton'; // Import the new component

export default async function Navbar() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const t = await getI18n();

  return (
    <nav className="bg-slate-800 text-white shadow-md fixed w-full top-0 z-50 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center h-full">
        <Link href="/" className="text-2xl font-bold text-amber-500 hover:text-amber-400 transition">
            PremiumProp
        </Link>
        <div className="flex items-center space-x-1 sm:space-x-2"> {/* Reduced base spacing slightly */}
          <Link href="/" className="hover:text-slate-300 text-sm sm:text-base px-2 py-1 sm:px-3 rounded-md">{t('navbar.home')}</Link>
          <Link href="/properties" className="hover:text-slate-300 text-sm sm:text-base px-2 py-1 sm:px-3 rounded-md">{t('navbar.properties')}</Link>

          {session && (
            <Link href="/dashboard" className="hover:text-slate-300 text-sm sm:text-base px-2 py-1 sm:px-3 rounded-md">{t('navbar.dashboard')}</Link>
          )}

          {/* Grouping utility icons together */}
          <div className="flex items-center space-x-1">
            <ThemeToggleButton />
            <LanguageSwitcher />
          </div>

          {session ? (
            <>
              <Link href="/profile" className="hover:text-slate-300 text-sm sm:text-base px-2 py-1 sm:px-3 rounded-md whitespace-nowrap">
                {t('navbar.profile')}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-slate-300 text-sm sm:text-base px-2 py-1 sm:px-3 rounded-md">{t('navbar.login')}</Link>
              <Link href="/signup" className="text-sm sm:text-base bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2 px-3 sm:px-4 rounded-md transition duration-300 whitespace-nowrap">
                {t('navbar.signup')}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
