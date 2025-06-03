// src/app/[locale]/properties/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Changed to server client
import PropertyCard from '@/components/PropertyCard';
import { Property } from '@/types';
import Link from 'next/link';
import { getI18n } from '@/lib/i18n';
import { PlusCircle } from 'lucide-react';

export const revalidate = 0;

// This page now needs params for locale
export default async function PropertiesPage({ params: { locale } }: { params: { locale: string } }) {
  const supabase = createSupabaseServerClient(); // Use server client for server components
  const t = await getI18n();

  // TODO: Add agency_id filter here if present in searchParams for company dashboard link
  // const url = new URL(request.url)
  // const agencyIdFilter = url.searchParams.get('agency')

  // let query = supabase.from('properties').select('*').order('created_at', { ascending: false });
  // if (agencyIdFilter) {
  //   query = query.eq('agency_id', agencyIdFilter);
  // }
  // const { data: properties, error } = await query;

  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching properties:', error);
    // It's better to show a user-friendly message on the page itself
    return (
        <div className="container mx-auto p-4 pt-20 text-center"> {/* Added pt-20 for fixed navbar */}
            <p className="text-red-500">{t('properties_page.error_loading')}</p>
        </div>
    );
  }

  return (
    // Added pt-20 to account for fixed navbar height
    <div className="container mx-auto p-4 pt-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-800">{t('properties_page.title')}</h1>
        <Link
          href="/properties/new"
          className="flex items-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
        >
          <PlusCircle size={20} className="mr-2" />
          {t('properties_page.add_new_property_button')}
        </Link>
      </div>

      {!properties || properties.length === 0 ? (
         <div className="text-center py-10 bg-white rounded-lg shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <p className="mt-5 text-xl text-slate-600">{t('properties_page.no_properties_message')}</p>
         </div>
       ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property as Property} />
          ))}
        </div>
      )}
    </div>
  );
}
