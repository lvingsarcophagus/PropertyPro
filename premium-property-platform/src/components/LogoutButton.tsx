// src/components/LogoutButton.tsx
'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/index'; // Import useI18n
import { LogOut } from 'lucide-react'; // Optional: add an icon

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { t } = useI18n();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // router.push('/'); // Redirect to homepage (locale will be picked up by middleware)
    // Forcing a full page reload to ensure server components re-fetch session and locale correctly
    window.location.href = '/';
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 sm:px-4 rounded-md transition duration-300 text-sm sm:text-base"
      title={t('navbar.logout')} // Tooltip for accessibility
    >
      <LogOut size={18} className="mr-0 sm:mr-2" /> {/* Icon hidden on very small screens, shown on sm+ */}
      <span className="hidden sm:inline">{t('navbar.logout')}</span>
    </button>
  );
}
