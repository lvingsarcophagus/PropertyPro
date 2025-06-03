// src/app/[locale]/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/index';
import { useForm } from 'react-hook-form'; // Import useForm

// Define a type for form values, even if simple for login
type LoginFormValues = {
    email: string;
    password: string;
};

export default function LoginPage() {
  const { t } = useI18n();
  // const [email, setEmail] = useState(''); // Handled by react-hook-form
  // const [password, setPassword] = useState(''); // Handled by react-hook-form
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const searchParams = useSearchParams();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>();


  useEffect(() => {
    const urlMessage = searchParams.get('message');
    if (urlMessage) {
      setMessage(decodeURIComponent(urlMessage));
    }
    const urlError = searchParams.get('error');
    if (urlError) {
        setError(decodeURIComponent(urlError));
    }
  }, [searchParams]);

  const handleLogin = async (data: LoginFormValues) => { // Data now comes from react-hook-form
    setError(null);
    setMessage(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      if (signInError.message === 'Invalid login credentials') {
        setError(t('auth.supabase_auth_invalid_credentials'));
      } else {
        setError(signInError.message);
      }
    } else {
      setMessage(t('auth.login_success_message'));
      window.location.href = '/';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 pt-20">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl border border-slate-200">
        <h1 className="text-3xl font-bold text-center text-slate-800">{t('auth.login_title')}</h1>

        {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}
        {message && <p className="text-green-500 text-sm text-center bg-green-50 p-3 rounded-md border border-green-200">{message}</p>}

        <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">{t('auth.login_email_label')}</label>
            <input
              id="email"
              type="email"
              {...register('email', { required: true })} // Register with react-hook-form
              className="mt-1 w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">{t('auth.login_password_label')}</label>
            <input
              id="password"
              type="password"
              {...register('password', { required: true })} // Register with react-hook-form
              className="mt-1 w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting} // Use isSubmitting from react-hook-form
            className="w-full px-4 py-3 font-semibold text-white bg-amber-600 rounded-lg shadow-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-300 disabled:bg-slate-400"
          >
            {isSubmitting ? t('common.loading') : t('auth.login_button')}
          </button>
        </form>
        <div className="text-sm text-center text-slate-600">
          {t('auth.login_signup_prompt')}{' '}
          <Link href="/signup" className="font-medium text-amber-600 hover:text-amber-700 hover:underline">
            {t('auth.login_signup_link')}
          </Link>
        </div>
      </div>
    </div>
  );
}
