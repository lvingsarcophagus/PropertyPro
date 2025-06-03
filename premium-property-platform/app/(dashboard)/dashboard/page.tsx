// app/(dashboard)/dashboard/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { UserProfile, Property } from '@/types'; 
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Home, PlusCircle, Users, MessageSquare, CalendarDays, Building, Briefcase } from 'lucide-react';

export default async function DashboardOverviewPage() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login'); 
  }

  const { data: userProfileData, error: profileFetchError } = await supabase
    .from('users')
    .select('id, name, role, agency_id') // Ensure 'id' is selected for broker_id checks
    .eq('id', session.user.id)
    .single();

  if (profileFetchError && profileFetchError.code !== 'PGRST116') {
    console.error('Error fetching user profile for dashboard:', profileFetchError);
    return <div className="p-6 text-red-500">Error loading profile information. Please try again later.</div>;
  }
  const profile = userProfileData as UserProfile | null;

  let activeListingsCount = 0;
  let agencyActiveListingsCount = 0;
  let teamMembers: Pick<UserProfile, 'id' | 'name' | 'email'>[] = [];

  if (profile?.role === 'individual') {
    const { count, error: countError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('broker_id', profile.id) // Use profile.id for clarity
      .eq('status', 'active');

    if (countError) {
      console.error('Error fetching active listings count for individual:', countError);
    } else {
      activeListingsCount = count || 0;
    }
  } else if (profile?.role === 'company' && profile.agency_id) {
    // Fetch agency's active listings count
    const { count: agencyCount, error: agencyListingsError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', profile.agency_id)
      .eq('status', 'active');

    if (agencyListingsError) {
      console.error('Error fetching agency active listings count:', agencyListingsError);
    } else {
      agencyActiveListingsCount = agencyCount || 0;
    }

    // Fetch team members
    const { data: membersData, error: membersError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('agency_id', profile.agency_id);

    if (membersError) {
      console.error('Error fetching team members:', membersError);
    } else {
      teamMembers = membersData || [];
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">
        Welcome to Your Dashboard, {profile?.name || session.user.email}!
      </h1>
      
      {!profile && profileFetchError?.code === 'PGRST116' && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold">Profile Setup Incomplete</p>
          <p>Your detailed profile information is still being processed or is not yet fully set up. This can be common for new accounts. Please try refreshing in a moment, or complete your profile if prompted.</p>
        </div>
      )}
      
      <p className="text-slate-600 mb-4">
        This is your central hub for managing your properties, clients, and settings.
      </p>

      <div className="bg-white p-6 shadow-md rounded-lg mb-8">
         <h2 className="text-xl font-semibold text-slate-700 mb-3">Quick Info</h2>
         <p>Your Role: <span className="font-semibold capitalize">{profile?.role || 'Loading...'}</span></p>
         {profile?.role === 'company' && profile.agency_id && (
             <p>Agency ID: <span className="font-semibold">{profile.agency_id}</span></p>
         )}
      </div>

      {/* Individual Broker Overview Section */}
      {profile?.role === 'individual' && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Individual Broker Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/properties" className="block bg-white p-6 shadow-lg rounded-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center text-blue-600">
                <Home size={32} className="mr-3" />
                <div>
                  <p className="text-3xl font-bold">{activeListingsCount}</p>
                  <p className="text-slate-600">My Active Listings</p>
                </div>
              </div>
            </Link>
            <div className="bg-white p-6 shadow-lg rounded-lg">
              <div className="flex items-center text-purple-600">
                <MessageSquare size={32} className="mr-3" />
                <div>
                  <h3 className="text-xl font-semibold">Recent Messages</h3>
                  <p className="text-slate-500 text-sm mt-1">Feature coming soon!</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 shadow-lg rounded-lg">
              <div className="flex items-center text-green-600">
                <CalendarDays size={32} className="mr-3" />
                <div>
                  <h3 className="text-xl font-semibold">Calendar Events</h3>
                  <p className="text-slate-500 text-sm mt-1">Feature coming soon!</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 bg-white p-6 shadow-md rounded-lg">
            <h3 className="text-xl font-semibold text-slate-700 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <Link href="/properties/new" className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300">
                <PlusCircle size={20} className="mr-2" /> Add New Property
              </Link>
              <Link href="/dashboard/clients" className="flex items-center bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300">
                <Users size={20} className="mr-2" /> Manage My Clients
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Company Admin Overview Section */}
      {profile?.role === 'company' && profile.agency_id && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Company Admin Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Link href={`/properties?agency=${profile.agency_id}`} className="block bg-white p-6 shadow-lg rounded-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center text-indigo-600">
                <Building size={32} className="mr-3" />
                <div>
                  <p className="text-3xl font-bold">{agencyActiveListingsCount}</p>
                  <p className="text-slate-600">Agency Active Listings</p>
                </div>
              </div>
            </Link>
            <div className="bg-white p-6 shadow-lg rounded-lg">
              <div className="flex items-center text-teal-600">
                <Users size={32} className="mr-3" />
                <div>
                  <p className="text-3xl font-bold">{teamMembers.length}</p>
                  <p className="text-slate-600">Team Members</p>
                </div>
              </div>
            </div>
             {/* Placeholder for another company stat */}
             <div className="bg-white p-6 shadow-lg rounded-lg">
              <div className="flex items-center text-pink-600">
                <Briefcase size={32} className="mr-3" />
                <div>
                  <h3 className="text-xl font-semibold">Agency Performance</h3>
                  <p className="text-slate-500 text-sm mt-1">Feature coming soon!</p>
                </div>
              </div>
            </div>
          </div>

          {teamMembers.length > 0 && (
            <div className="bg-white p-6 shadow-md rounded-lg mb-8">
              <h3 className="text-xl font-semibold text-slate-700 mb-4">Team Members</h3>
              <ul className="space-y-2">
                {teamMembers.map(member => (
                  <li key={member.id} className="p-2 border rounded-md bg-slate-50 text-sm">
                    <p className="font-semibold text-slate-800">{member.name || 'Unnamed User'}</p>
                    <p className="text-slate-600">{member.email}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 bg-white p-6 shadow-md rounded-lg">
            <h3 className="text-xl font-semibold text-slate-700 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <Link href={`/properties?agency=${profile.agency_id}&status=active`} className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300">
                <Home size={20} className="mr-2" /> Manage Agency Listings
              </Link>
              <button disabled className="flex items-center bg-gray-400 text-white font-semibold py-2 px-4 rounded-md cursor-not-allowed">
                <Users size={20} className="mr-2" /> Manage Team (Soon)
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
