// src/app/[locale]/corporate-signup/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Added useSearchParams
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useI18n } from '@/lib/i18n/index'; // Import useI18n
import Link from 'next/link'; // For login redirect if needed

type AgencyFormValues = {
  agencyName: string;
  agencyEmail: string;
  agencyPhone?: string;
  numBrokers?: string;
  billingInfo?: string;
};

export default function CorporateSignupPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const { t } = useI18n();
  const searchParams = useSearchParams(); // For potential messages

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting: rhfIsSubmitting } } = useForm<AgencyFormValues>();

  useEffect(() => {
    const urlMessage = searchParams.get('message');
    if (urlMessage) {
      // Display messages from URL (e.g., if redirected from login)
      // For now, just log it, or set a general message state if you have one
      console.log("Message from URL:", decodeURIComponent(urlMessage));
    }
    const fetchUserAndProfile = async () => {
      setIsLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error fetching session:", sessionError);
        setFormError(t('forms.generic_error'));
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        setCurrentUser(session.user);
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('role, agency_id')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
            console.error("Error fetching user profile for validation:", profileError);
            setFormError(t('corporate_signup.error_verifying_account'));
        } else if (userProfile && (userProfile.role === 'company' || userProfile.agency_id)) {
          setFormError(t('corporate_signup.error_already_associated'));
        }
      } else {
        // Use current locale for redirect
        const currentLocale = searchParams.get('locale') || 'en'; // Fallback, though middleware should set it
        router.push(`/${currentLocale}/login?message=${encodeURIComponent(t('corporate_signup.error_must_be_logged_in_redirect'))}`);
      }
      setIsLoading(false);
    };
    fetchUserAndProfile();
  }, [supabase, router, t, searchParams]);

  const onSubmit: SubmitHandler<AgencyFormValues> = async (data) => {
    if (!currentUser) {
      setFormError(t('corporate_signup.error_must_be_logged_in'));
      return;
    }
    if (formError && !formError.startsWith("CRITICAL:")) { // Check if non-critical error already exists
        return;
    }

    setFormError(null);
    setFormSuccess(null);

    try {
      const { data: newAgency, error: agencyError } = await supabase
        .from('agencies')
        .insert({
          name: data.agencyName,
          contact_email: data.agencyEmail,
          contact_phone: data.agencyPhone || null,
          billing_info: data.billingInfo ? { info: data.billingInfo } : null,
        })
        .select()
        .single();

      if (agencyError) throw agencyError;
      if (!newAgency) throw new Error(t('corporate_signup.error_agency_creation_failed'));


      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          role: 'company',
          agency_id: newAgency.id,
        })
        .eq('id', currentUser.id);

      if (userUpdateError) {
        console.error('User update failed, but agency was created:', newAgency.id, userUpdateError);
        setFormError(t('corporate_signup.error_agency_created_user_update_failed', { agencyId: newAgency.id, agencyName: newAgency.name }));
        return;
      }

      setFormSuccess(t('corporate_signup.success_agency_registered', { agencyName: newAgency.name }));
    } catch (error: any) {
      console.error('Corporate signup error:', error);
      setFormError(error.message || t('corporate_signup.error_unexpected_registration'));
    }
  };

  if (isLoading) {
    return (
        <div className="container mx-auto p-8 text-center pt-20"> {/* Added pt-20 */}
            <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"> {/* Adjusted min-h */}
                <svg className="animate-spin h-10 w-10 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="ml-3 text-slate-600">{t('corporate_signup.loading_message')}</p>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-2xl pt-24"> {/* Added pt-24 for more space from navbar */}
      <div className="bg-white p-8 sm:p-10 shadow-xl rounded-lg border border-slate-200">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-slate-800">{t('corporate_signup.title')}</h1>

        {formError && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-6 text-sm whitespace-pre-wrap">{formError}</p>}
        {formSuccess && <p className="text-green-500 bg-green-100 p-3 rounded-md mb-6 text-sm">{formSuccess}</p>}

        {!formSuccess && (
         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
             <div>
                 <label htmlFor="agencyName" className="block text-sm font-medium text-slate-700 mb-1">{t('corporate_signup.label_agency_name')}</label>
                 <input type="text" id="agencyName" {...register('agencyName', { required: t('corporate_signup.validation_agency_name_required') })} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow" />
                 {errors.agencyName && <p className="text-red-500 text-xs mt-1">{errors.agencyName.message}</p>}
             </div>

             <div>
                 <label htmlFor="agencyEmail" className="block text-sm font-medium text-slate-700 mb-1">{t('corporate_signup.label_agency_email')}</label>
                 <input type="email" id="agencyEmail" {...register('agencyEmail', { required: t('corporate_signup.validation_agency_email_required'), pattern: { value: /\S+@\S+\.\S+/, message: t('corporate_signup.validation_invalid_email_format') }})} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow" />
                 {errors.agencyEmail && <p className="text-red-500 text-xs mt-1">{errors.agencyEmail.message}</p>}
             </div>

             <div>
                 <label htmlFor="agencyPhone" className="block text-sm font-medium text-slate-700 mb-1">{t('corporate_signup.label_agency_phone')}</label>
                 <input type="tel" id="agencyPhone" {...register('agencyPhone')} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow" />
             </div>

             <div>
                 <label htmlFor="numBrokers" className="block text-sm font-medium text-slate-700 mb-1">{t('corporate_signup.label_num_brokers')}</label>
                 <input type="text" id="numBrokers" {...register('numBrokers')} placeholder={t('corporate_signup.num_brokers_placeholder')} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow" />
             </div>

             <div>
                 <label htmlFor="billingInfo" className="block text-sm font-medium text-slate-700 mb-1">{t('corporate_signup.label_billing_info')}</label>
                 <textarea id="billingInfo" {...register('billingInfo')} rows={3} placeholder={t('corporate_signup.billing_info_placeholder')} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow"></textarea>
             </div>

             <button
                 type="submit"
                 disabled={rhfIsSubmitting || (!!formError && !formError.startsWith("CRITICAL:"))}
                 className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-lg disabled:bg-slate-400 disabled:cursor-not-allowed"
             >
                 {rhfIsSubmitting ? t('corporate_signup.button_registering_agency') : t('corporate_signup.button_register_agency')}
             </button>
         </form>
        )}
        {formSuccess && (
          <div className="text-center mt-6">
             <button onClick={() => router.push('/profile')} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md">
                 {t('corporate_signup.button_go_to_profile')}
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
