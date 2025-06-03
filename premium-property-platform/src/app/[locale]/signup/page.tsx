// src/app/[locale]/signup/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/index';
import { useForm, SubmitHandler } from 'react-hook-form'; // Import useForm

// Define form values type
type SignUpFormValues = {
    email: string;
    password_input: string; // Renamed to avoid conflict with any 'password' state if used directly
    confirmPassword_input: string;
};

export default function SignUpPage() {
  const { t } = useI18n();
  // Removed individual state for email, password, confirmPassword as react-hook-form will handle them
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const searchParams = useSearchParams();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<SignUpFormValues>();
  const password_input = watch("password_input"); // To compare with confirmPassword

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

  const handleSignUp: SubmitHandler<SignUpFormValues> = async (data) => {
    setError(null);
    setMessage(null);

    // Password confirmation is implicitly handled by react-hook-form's `validate` if set up,
    // but a manual check is fine too or can be an additional layer.
    // For this setup, we rely on the form structure to have a confirmPassword field.
    // The prompt's original logic had a direct comparison which is fine for this client component.
    if (data.password_input !== data.confirmPassword_input) {
      setError(t('auth.error_passwords_do_not_match'));
      return;
    }

    const emailRedirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password_input, // Use the value from react-hook-form
      options: {
        emailRedirectTo,
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("User already registered")) {
        setError(t('auth.error_user_exists_unconfirmed'));
      } else {
        setError(signUpError.message);
      }
    } else if (signUpData.user && signUpData.user.identities?.length === 0) {
      setMessage(t('auth.error_user_exists_unconfirmed')); // Or a slightly different message if desired
    } else if (signUpData.user) {
      setMessage(t('auth.message_signup_success'));
    } else {
       setError(t('auth.error_unexpected_signup'));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 pt-20">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl border border-slate-200">
        <h1 className="text-3xl font-bold text-center text-slate-800">{t('auth.signup_title')}</h1>

        {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}
        {message && <p className="text-green-500 text-sm text-center bg-green-50 p-3 rounded-md border border-green-200">{message}</p>}

        <form onSubmit={handleSubmit(handleSignUp)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">{t('auth.signup_email_label')}</label>
            <input
              id="email"
              type="email"
              {...register('email', { required: t('forms.email_required'), pattern: { value: /\S+@\S+\.\S+/, message: t('forms.email_invalid') }})}
              className="mt-1 w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
            />
             {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password_input" className="block text-sm font-medium text-slate-700">{t('auth.signup_password_label')}</label>
            <input
              id="password_input"
              type="password"
              {...register('password_input', { required: t('forms.password_required'), minLength : { value: 6, message: t('forms.password_min_length', {length: 6})}})}
              className="mt-1 w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
            />
            {errors.password_input && <p className="text-red-500 text-xs mt-1">{errors.password_input.message}</p>}
          </div>
          <div>
            <label htmlFor="confirmPassword_input" className="block text-sm font-medium text-slate-700">{t('auth.signup_confirm_password_label')}</label>
            <input
              id="confirmPassword_input"
              type="password"
              {...register('confirmPassword_input', {
                required: t('forms.confirm_password_required'),
                validate: value => value === password_input || t('auth.error_passwords_do_not_match')
              })}
              className="mt-1 w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
            />
            {errors.confirmPassword_input && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword_input.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-3 font-semibold text-white bg-amber-600 rounded-lg shadow-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-300 disabled:bg-slate-400"
          >
            {isSubmitting ? t('common.loading') : t('auth.signup_button')}
          </button>
        </form>
        <div className="text-sm text-center text-slate-600">
          {t('auth.signup_login_prompt')}{' '}
          <Link href="/login" className="font-medium text-amber-600 hover:text-amber-700 hover:underline">
            {t('auth.signup_login_link')}
          </Link>
        </div>
      </div>
    </div>
  );
}
