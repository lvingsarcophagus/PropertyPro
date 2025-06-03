// src/app/profile/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserProfile, Property, SavedSearch } from '@/types'; // Added SavedSearch type
import Image from 'next/image';
import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';
import EditProfileForm from '@/components/EditProfileForm';
import SavedSearchesList from '@/components/SavedSearchesList'; // New component import

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?message=Please log in to view your profile.');
  }

  // Fetch User Profile
  const { data: userProfileData, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error("Error fetching profile:", profileError.message);
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


  return (
    <div className="container mx-auto p-4 sm:p-8">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden md:flex mb-12">
         {/* Profile Info Section */}
         <div className="md:w-1/3 p-6 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200">
             <div className="text-center md:text-left">
                 {userProfile?.profile_picture ? (
                     <Image
                     src={userProfile.profile_picture}
                     alt="Profile Picture"
                     width={150}
                     height={150}
                     className="rounded-full object-cover mx-auto md:mx-0 w-36 h-36 sm:w-48 sm:h-48"
                     />
                 ) : (
                     <div className="w-36 h-36 sm:w-48 sm:h-48 bg-slate-300 rounded-full flex items-center justify-center text-slate-100 text-5xl mx-auto md:mx-0">
                     {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : session.user.email?.charAt(0).toUpperCase()}
                     </div>
                 )}
                 <h1 className="text-2xl sm:text-3xl font-bold mt-4 text-slate-800">{userProfile?.name || 'Name not set'}</h1>
                 <p className="text-slate-600 break-all">{session.user.email}</p>
                 <p className="text-slate-600 mt-1">{userProfile?.phone || 'Phone not set'}</p>
                 <p className="text-sm text-slate-500 mt-1">Role: <span className="capitalize">{userProfile?.role || 'N/A'}</span></p>
                 {userProfile?.agency_id && <p className="text-sm text-slate-500">Agency ID: {userProfile.agency_id}</p> }
             </div>
         </div>

         {/* Edit Form Section */}
         <div className="md:w-2/3 p-6">
             {userProfile ? (
                 <EditProfileForm userProfile={userProfile} />
             ) : (
                 <div className="text-center text-slate-500 py-5">
                    <p>Loading profile information or profile not fully set up...</p>
                    {profileError && profileError.code === 'PGRST116' && (
                        <p className="text-sm text-amber-600 mt-2">Your detailed profile is still being prepared. This is common for new accounts. Please try refreshing in a moment.</p>
                    )}
                 </div>
             )}
         </div>
      </div>

      {/* Saved Searches Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 text-slate-800">Your Saved Searches</h2>
        <SavedSearchesList initialSavedSearches={userSavedSearches} />
      </div>


      {/* Property Listings Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-semibold text-slate-800">Your Property Listings</h2>
            <Link href="/properties/new" className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                + Add New Property
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
              You haven't posted any properties yet.
            </p>
            <Link href="/properties/new" className="mt-4 inline-block text-amber-600 hover:text-amber-700 font-semibold py-2 px-3 bg-amber-100 hover:bg-amber-200 rounded-md transition">
                List your first property
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
