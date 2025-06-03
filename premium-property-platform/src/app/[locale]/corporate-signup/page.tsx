// src/app/corporate-signup/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useForm, SubmitHandler } from 'react-hook-form';

type AgencyFormValues = {
  agencyName: string;
  agencyEmail: string;
  agencyPhone?: string;
  numBrokers?: string; // Or number, handle parsing
  billingInfo?: string; // Simple text for now
};

export default function CorporateSignupPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // For initial user check
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting: rhfIsSubmitting } } = useForm<AgencyFormValues>();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        // Check if user already has an agency or is a company role
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('role, agency_id')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 0 rows
            console.error("Error fetching user profile for validation:", profileError);
            setFormError("Could not verify your current account status. Please try again later.");
        } else if (userProfile && (userProfile.role === 'company' || userProfile.agency_id)) {
          setFormError('Your account is already associated with an agency or set up as a company. You cannot register a new agency.');
          // Optionally redirect or disable form further
        }
      } else {
        router.push('/login?message=Please log in to register a new agency.');
      }
      setIsLoading(false);
    };
    fetchUserAndProfile();
  }, [supabase, router]);

  const onSubmit: SubmitHandler<AgencyFormValues> = async (data) => {
    if (!currentUser) {
      setFormError('You must be logged in to register an agency.');
      return;
    }
    // If formError was set by useEffect (e.g. user already has agency), prevent submission
    if (formError && !formError.startsWith("Agency created, but failed to update your user role")) {
        return;
    }


    setFormError(null);
    setFormSuccess(null);

    try {
      // Step 1: Create the agency
      const { data: newAgency, error: agencyError } = await supabase
        .from('agencies')
        .insert({
          name: data.agencyName,
          contact_email: data.agencyEmail,
          contact_phone: data.agencyPhone || null, // Ensure null if empty
          billing_info: data.billingInfo ? { info: data.billingInfo } : null, // Example if JSONB
          // num_brokers: data.numBrokers ? parseInt(data.numBrokers) : null // Add if you have this column
        })
        .select()
        .single();

      if (agencyError) throw agencyError;
      if (!newAgency) throw new Error('Agency creation failed to return data.');

      // Step 2: Update the user's role and agency_id
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          role: 'company',
          agency_id: newAgency.id,
        })
        .eq('id', currentUser.id);

      if (userUpdateError) {
        console.error('User update failed, but agency was created:', newAgency.id, userUpdateError);
        // This is a critical error. The agency was created, but the user linking failed.
        // The user should contact support. We'll set a specific error message.
        setFormError(`CRITICAL: Agency '${newAgency.name}' was created (ID: ${newAgency.id}), but we failed to update your user role. Please contact support immediately to resolve this.`);
        return; // Stop further processing like showing success message
      }

      setFormSuccess(`Agency '${newAgency.name}' registered successfully! Your role has been updated to 'company' and linked to this agency.`);
      // router.push('/profile'); // Redirect to profile or new dashboard after a delay or on button click

    } catch (error: any) {
      console.error('Corporate signup error:', error);
      setFormError(error.message || 'An unexpected error occurred during agency registration.');
    }
  };

  if (isLoading) {
    return (
        <div className="container mx-auto p-8 text-center">
            <div className="flex justify-center items-center min-h-[300px]">
                <svg className="animate-spin h-10 w-10 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="ml-3 text-slate-600">Loading user information...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-2xl">
      <div className="bg-white p-8 sm:p-10 shadow-xl rounded-lg">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-slate-800">Register Your Agency</h1>

        {formError && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-6 text-sm whitespace-pre-wrap">{formError}</p>}
        {formSuccess && <p className="text-green-500 bg-green-100 p-3 rounded-md mb-6 text-sm">{formSuccess}</p>}

        {!formSuccess && ( // Only show form if not successfully submitted
         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
             <div>
                 <label htmlFor="agencyName" className="block text-sm font-medium text-slate-700 mb-1">Agency Name</label>
                 <input type="text" id="agencyName" {...register('agencyName', { required: 'Agency name is required' })} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow" />
                 {errors.agencyName && <p className="text-red-500 text-xs mt-1">{errors.agencyName.message}</p>}
             </div>

             <div>
                 <label htmlFor="agencyEmail" className="block text-sm font-medium text-slate-700 mb-1">Agency Contact Email</label>
                 <input type="email" id="agencyEmail" {...register('agencyEmail', { required: 'Agency email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email format' }})} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow" />
                 {errors.agencyEmail && <p className="text-red-500 text-xs mt-1">{errors.agencyEmail.message}</p>}
             </div>

             <div>
                 <label htmlFor="agencyPhone" className="block text-sm font-medium text-slate-700 mb-1">Agency Contact Phone (Optional)</label>
                 <input type="tel" id="agencyPhone" {...register('agencyPhone')} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow" />
             </div>

             <div>
                 <label htmlFor="numBrokers" className="block text-sm font-medium text-slate-700 mb-1">Approx. Number of Brokers (Optional)</label>
                 <input type="text" id="numBrokers" {...register('numBrokers')} placeholder="e.g., 1-5, 10+" className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow" />
             </div>

             <div>
                 <label htmlFor="billingInfo" className="block text-sm font-medium text-slate-700 mb-1">Billing Information (Placeholder - Optional)</label>
                 <textarea id="billingInfo" {...register('billingInfo')} rows={3} placeholder="Enter any preliminary billing details or notes" className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow"></textarea>
             </div>

             <button
                 type="submit"
                 disabled={rhfIsSubmitting || (!!formError && !formError.startsWith("CRITICAL:"))} // Disable if already has a non-critical formError from initial check
                 className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-lg disabled:bg-slate-400 disabled:cursor-not-allowed"
             >
                 {rhfIsSubmitting ? 'Registering Agency...' : 'Register Agency'}
             </button>
         </form>
        )}
        {formSuccess && (
          <div className="text-center mt-6">
             <button onClick={() => router.push('/profile')} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md">
                 Go to Profile
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
