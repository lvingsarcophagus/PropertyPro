// app/(dashboard)/dashboard/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { UserProfile } from '@/types';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Home, PlusCircle, Users, MessageSquare, CalendarDays, Building, Briefcase, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { getI18n } from '@/lib/i18n';

export default async function DashboardOverviewPage({ params: { locale } }: { params: { locale: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const t = await getI18n();

  if (!session) {
    redirect(`/${locale}/login?message=You must be logged in to view the dashboard.`);
  }

  const { data: userProfileData, error: profileFetchError } = await supabase
    .from('users')
    .select('id, name, role, agency_id')
    .eq('id', session.user.id)
    .single();

  if (profileFetchError && profileFetchError.code !== 'PGRST116') {
    console.error('Error fetching user profile for dashboard:', profileFetchError);
    return (
        <div className="p-6 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md shadow">
            <div className="flex">
                <div className="py-1"><AlertTriangle size={20} className="mr-3"/></div>
                <div>
                    <p className="font-bold">{t('common.error_generic_short')}</p>
                    <p className="text-sm">{t('dashboard_overview.error_loading_profile')}</p>
                </div>
            </div>
        </div>
    );
  }
  const profile = userProfileData as UserProfile | null;

  let activeListingsCount = 0;
  let agencyActiveListingsCount = 0;
  let teamMembers: Pick<UserProfile, 'id' | 'name' | 'email'>[] = [];

  if (profile?.role === 'individual') {
    const { count, error: countError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('broker_id', profile.id)
      .eq('status', 'active');

    if (countError) {
      console.error('Error fetching active listings count for individual:', countError);
    } else {
      activeListingsCount = count || 0;
    }
  } else if (profile?.role === 'company' && profile.agency_id) {
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
    <div className="space-y-6"> {/* Added space-y-6 for consistent spacing */}
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        {t('dashboard_overview.welcome_user', { name: profile?.name || session.user.email || '' })}
      </h1>

      {!profile && profileFetchError?.code === 'PGRST116' && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700" role="alert">
          <p className="font-bold">{t('dashboard_overview.profile_incomplete_title')}</p>
          <p>{t('dashboard_overview.profile_incomplete_message')}</p>
        </div>
      )}

      <p className="text-slate-600 dark:text-slate-400 mb-4">
        {t('dashboard_overview.intro')}
      </p>

      <div className="bg-white dark:bg-slate-800 p-6 shadow-md rounded-lg mb-8 border dark:border-slate-700">
         <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">{t('dashboard_overview.quick_info')}</h2>
         <p className="text-slate-600 dark:text-slate-300">{t('dashboard_overview.your_role', { role: profile?.role ? t(`common.roles.${profile.role}`) : t('common.loading') })}</p>
         {profile?.role === 'company' && profile.agency_id && (
             <p className="text-slate-600 dark:text-slate-300">{t('dashboard_overview.agency_id', { id: profile.agency_id })}</p>
         )}
         {!profile && !profileFetchError && ( // Case where profile is null but no specific PGRST116 error (e.g. still loading or other issue)
            <p className="text-slate-500 dark:text-slate-400">{t('dashboard_overview.loading_profile_details')}</p>
         )}
      </div>

      {/* Individual Broker Overview Section */}
      {profile?.role === 'individual' && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-4">{t('dashboard_overview.individual_broker_overview')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <Link href="/properties" className="block bg-white dark:bg-slate-800 p-6 shadow-lg dark:shadow-black/20 rounded-lg hover:shadow-xl dark:hover:shadow-slate-700/60 transition-shadow border dark:border-slate-700">
              <div className="flex items-center text-blue-600 dark:text-blue-400">
                <Home size={32} className="mr-3" />
                <div>
                  <p className="text-3xl font-bold">{activeListingsCount}</p>
                  <p className="text-slate-600 dark:text-slate-400">{t('dashboard_overview.my_active_listings')}</p>
                </div>
              </div>
            </Link>
            {/* Card 2 */}
            <div className="bg-white dark:bg-slate-800 p-6 shadow-lg dark:shadow-black/20 rounded-lg border dark:border-slate-700">
              <div className="flex items-center text-purple-600 dark:text-purple-400">
                <MessageSquare size={32} className="mr-3" />
                <div>
                  <h3 className="text-xl font-semibold">{t('dashboard_overview.recent_messages')}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('dashboard_overview.feature_coming_soon')}</p>
                </div>
              </div>
            </div>
            {/* Card 3 */}
            <div className="bg-white dark:bg-slate-800 p-6 shadow-lg dark:shadow-black/20 rounded-lg border dark:border-slate-700">
              <div className="flex items-center text-green-600 dark:text-green-400">
                <CalendarDays size={32} className="mr-3" />
                <div>
                  <h3 className="text-xl font-semibold">{t('dashboard_overview.calendar_events')}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('dashboard_overview.feature_coming_soon')}</p>
                </div>
              </div>
            </div>
          </div>
          {/* Quick Actions Card */}
          <div className="mt-8 bg-white dark:bg-slate-800 p-6 shadow-md dark:shadow-black/20 rounded-lg border dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">{t('dashboard_overview.quick_actions')}</h3>
            <div className="flex flex-wrap gap-4">
              <Link href="/properties/new" className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300">
                <PlusCircle size={20} className="mr-2" /> {t('dashboard_overview.add_new_property')}
              </Link>
              <Link href="/dashboard/clients" className="flex items-center bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300">
                <Users size={20} className="mr-2" /> {t('dashboard_overview.manage_my_clients')}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Company Admin Overview Section */}
      {profile?.role === 'company' && profile.agency_id && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-4">{t('dashboard_overview.company_admin_overview')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Card 1 */}
            <Link href={`/properties?agency=${profile.agency_id}`} className="block bg-white dark:bg-slate-800 p-6 shadow-lg dark:shadow-black/20 rounded-lg hover:shadow-xl dark:hover:shadow-slate-700/60 transition-shadow border dark:border-slate-700">
              <div className="flex items-center text-indigo-600 dark:text-indigo-400">
                <Building size={32} className="mr-3" />
                <div>
                  <p className="text-3xl font-bold">{agencyActiveListingsCount}</p>
                  <p className="text-slate-600 dark:text-slate-400">{t('dashboard_overview.agency_active_listings')}</p>
                </div>
              </div>
            </Link>
            {/* Card 2 */}
            <div className="bg-white dark:bg-slate-800 p-6 shadow-lg dark:shadow-black/20 rounded-lg border dark:border-slate-700">
              <div className="flex items-center text-teal-600 dark:text-teal-400">
                <Users size={32} className="mr-3" />
                <div>
                  <p className="text-3xl font-bold">{teamMembers.length}</p>
                  <p className="text-slate-600 dark:text-slate-400">{t('dashboard_overview.team_members')}</p>
                </div>
              </div>
            </div>
            {/* Card 3 */}
             <div className="bg-white dark:bg-slate-800 p-6 shadow-lg dark:shadow-black/20 rounded-lg border dark:border-slate-700">
              <div className="flex items-center text-pink-600 dark:text-pink-400">
                <Briefcase size={32} className="mr-3" />
                <div>
                  <h3 className="text-xl font-semibold">{t('dashboard_overview.agency_performance')}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('dashboard_overview.feature_coming_soon')}</p>
                </div>
              </div>
            </div>
          </div>

          {teamMembers.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 shadow-md dark:shadow-black/20 rounded-lg mb-8 border dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">{t('dashboard_overview.team_members')}</h3>
              <ul className="space-y-2">
                {teamMembers.map(member => (
                  <li key={member.id} className="p-3 border dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-700/30 text-sm">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{member.name || t('dashboard_overview.unnamed_user')}</p>
                    <p className="text-slate-600 dark:text-slate-400">{member.email}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Quick Actions Card */}
          <div className="mt-8 bg-white dark:bg-slate-800 p-6 shadow-md dark:shadow-black/20 rounded-lg border dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">{t('dashboard_overview.quick_actions')}</h3>
            <div className="flex flex-wrap gap-4">
              <Link href={`/properties?agency=${profile.agency_id}&status=active`} className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300">
                <Home size={20} className="mr-2" /> {t('dashboard_overview.manage_agency_listings')}
              </Link>
              <button disabled className="flex items-center bg-gray-400 dark:bg-gray-600 text-white dark:text-gray-400 font-semibold py-2 px-4 rounded-md cursor-not-allowed">
                <Users size={20} className="mr-2" /> {t('dashboard_overview.manage_team_soon')}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
