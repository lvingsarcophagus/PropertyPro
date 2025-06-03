// src/app/[locale]/profile/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserProfile, Property, SavedSearch } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';
import EditProfileForm from '@/components/EditProfileForm';
import SavedSearchesList from '@/components/SavedSearchesList';
import { getI18n } from '@/lib/i18n';
import { PlusCircle } from 'lucide-react';

export default async function ProfilePage({ params: { locale } }: { params: { locale: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const t = await getI18n();

  if (!session) {
    redirect(`/${locale}/login?message=Please log in to view your profile.`);
  }

  // Fetch User Profile
  const { data: userProfileData, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error("Error fetching profile:", profileError.message);
    // Consider a more user-friendly error display here, perhaps a dedicated error component
  }
  const userProfile = userProfileData as UserProfile | null;

  // Fetch User Properties
  const { data: userPropertiesData, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .eq('broker_id', session.user.id)
    .order('created_at', { ascending: false });

  if (propertiesError) {
    console.error("Error fetching user properties:", propertiesError.message);
  }
  const userProperties = userPropertiesData as Property[] || [];

  // Fetch User Saved Searches
  const { data: savedSearchesData, error: savedSearchesError } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (savedSearchesError) {
    console.error("Error fetching saved searches:", savedSearchesError.message);
  }
  const userSavedSearches = savedSearchesData as SavedSearch[] || [];

  const profileDisplayName = userProfile?.name || t('profile_page.name_not_set');
  const profileDisplayPhone = userProfile?.phone || t('profile_page.phone_not_set');
  const profileRoleDisplay = userProfile?.role ? t(`common.roles.${userProfile.role}`) : 'N/A';


  return (
    // Added pt-20 for fixed navbar
    <div className="container mx-auto p-4 sm:p-8 pt-20">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden md:flex mb-12">
         <div className="md:w-1/3 p-6 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200">
             <div className="text-center md:text-left">
                 {userProfile?.profile_picture ? (
                     <Image
                       src={userProfile.profile_picture}
                       alt={t('profile_page.profile_picture_alt', {name: profileDisplayName})}
                       width={150}
                       height={150}
                       className="rounded-full object-cover mx-auto md:mx-0 w-36 h-36 sm:w-48 sm:h-48"
                       priority
                     />
                 ) : (
                     <div className="w-36 h-36 sm:w-48 sm:h-48 bg-slate-300 rounded-full flex items-center justify-center text-slate-100 text-5xl mx-auto md:mx-0">
                       {profileDisplayName.charAt(0).toUpperCase()}
                     </div>
                 )}
                 <h1 className="text-2xl sm:text-3xl font-bold mt-4 text-slate-800">{profileDisplayName}</h1>
                 <p className="text-slate-600 break-all">{session.user.email}</p>
                 <p className="text-slate-600 mt-1">{profileDisplayPhone}</p>
                 <p className="text-sm text-slate-500 mt-1">{t('profile_page.role_label')} <span className="capitalize">{profileRoleDisplay}</span></p>
                 {userProfile?.agency_id && <p className="text-sm text-slate-500">{t('profile_page.agency_id_label')} {userProfile.agency_id}</p> }
             </div>
         </div>

         <div className="md:w-2/3 p-6">
             {userProfile ? (
                 <EditProfileForm userProfile={userProfile} />
             ) : (
                 <div className="text-center text-slate-500 py-5">
                    <p>{t('profile_page.loading_profile')}</p>
                    {profileError && profileError.code === 'PGRST116' && ( // PGRST116 means profile row doesn't exist yet
                        <p className="text-sm text-amber-600 mt-2">{t('dashboard_overview.profile_incomplete_message')}</p>
                    )}
                 </div>
             )}
         </div>
      </div>

      <div className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 text-slate-800">{t('profile_page.your_saved_searches_title')}</h2>
        {/* SavedSearchesList component might need its own internal translations if it has static text */}
        <SavedSearchesList initialSavedSearches={userSavedSearches} />
      </div>

      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-3xl font-semibold text-slate-800">{t('profile_page.your_property_listings_title')}</h2>
            <Link
                href="/properties/new"
                className="flex items-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
            >
                <PlusCircle size={20} className="mr-2" />
                {t('dashboard_overview.add_new_property')} {/* Reusing key as it's the same action */}
            </Link>
        </div>
        {userProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-lg shadow border border-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <p className="text-slate-600 text-lg">
              {t('profile_page.no_properties_message')}
            </p>
            <Link href="/properties/new" className="mt-4 inline-block text-amber-600 hover:text-amber-700 font-semibold py-2 px-3 bg-amber-100 hover:bg-amber-200 rounded-md transition">
                {t('profile_page.post_new_property_link')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
