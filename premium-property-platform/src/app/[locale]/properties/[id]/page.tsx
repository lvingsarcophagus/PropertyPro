// src/app/[locale]/properties/[id]/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Changed to server client
import { Property } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { getI18n } from '@/lib/i18n';
import { AlertTriangle, ArrowLeft, Edit3 } from 'lucide-react';

export const revalidate = 0;

type PropertyDetailPageProps = {
  params: { id: string; locale: string }; // Added locale
};

// Helper function to get translated enum values
const getTranslatedEnumValue = (t: any, scope: string, value?: string | null) => {
  if (!value) return 'N/A';
  const key = `${scope}_${value.toLowerCase()}`;
  // Check if a specific translation exists, otherwise fallback to capitalizing the value itself or returning N/A
  // This assumes your translation keys are structured like 'property_details_page.value_type_house'
  const translated = t(key, {}, { fallback: value }); // Using fallback to return value if key not found
  return translated === key ? value.charAt(0).toUpperCase() + value.slice(1) : translated; // Capitalize if no translation found
};


export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const supabase = createSupabaseServerClient(); // Use server client
  const t = await getI18n();

  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) {
    console.error('Error fetching property:', error);
    return (
        <div className="container mx-auto p-4 pt-20 text-center"> {/* Added pt-20 for fixed navbar */}
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600">{t('property_details_page.error_loading')}</p>
            <Link href="/properties" className="mt-4 inline-flex items-center text-amber-600 hover:text-amber-700">
                <ArrowLeft size={18} className="mr-2"/>
                {t('property_details_page.back_to_listings_link')}
            </Link>
        </div>
    );
  }

  if (!property) {
    return (
        <div className="container mx-auto p-4 pt-20 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <p className="text-slate-600">{t('property_details_page.property_not_found')}</p>
            <Link href="/properties" className="mt-4 inline-flex items-center text-amber-600 hover:text-amber-700">
                <ArrowLeft size={18} className="mr-2"/>
                {t('property_details_page.back_to_listings_link')}
            </Link>
        </div>
    );
  }

  const p = property as Property;
  const formattedPrice = p.price ? `$${p.price.toLocaleString()}` : 'N/A';
  const propertyPurpose = getTranslatedEnumValue(t, 'property_details_page.value_purpose', p.purpose);
  const propertyTypeDisplay = getTranslatedEnumValue(t, 'property_details_page.value_type', p.type);
  const propertyStatusDisplay = getTranslatedEnumValue(t, 'property_details_page.value_status', p.status);


  return (
    // Added pt-20 to account for fixed navbar height
    <div className="container mx-auto p-4 sm:p-6 pt-20">
      <div className="bg-white shadow-2xl rounded-xl overflow-hidden">
        {p.images && p.images.length > 0 ? (
          <div className="relative h-72 sm:h-96 md:h-[500px] w-full">
            <Image
              src={p.images[0]}
              alt={t('property_details_page.hero_image_alt', { type: propertyTypeDisplay, street: p.street || '' })}
              layout="fill"
              objectFit="cover"
              priority // For LCP
            />
          </div>
        ) : (
          <div className="h-72 sm:h-96 md:h-[500px] w-full bg-slate-200 flex items-center justify-center">
            <HomeIcon className="w-24 h-24 text-slate-400" />
          </div>
        )}
        <div className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-1">
                    {propertyTypeDisplay} {p.city ? `in ${p.city}` : ''}
                </h1>
                <p className="text-slate-600 text-lg">
                    {p.street || t('common.address_not_available', { fallback: "Address not specified" })}{p.district ? `, ${p.district}` : ''}
                </p>
            </div>
            <Link
                href={`/properties/${p.id}/edit`}
                className="mt-3 sm:mt-0 flex items-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out text-sm"
            >
                <Edit3 size={18} className="mr-2" />
                {t('property_details_page.edit_property_button')}
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 mb-6 text-sm sm:text-base border-t border-b border-slate-200 py-6">
            <div><span className="font-semibold text-slate-700">{t('property_details_page.price_label')}</span> <span className="text-blue-600 font-bold">{formattedPrice}</span> <span className="text-slate-500">({propertyPurpose})</span></div>
            <div><span className="font-semibold text-slate-700">{t('property_details_page.area_label')}</span> {p.area_m2 ? `${p.area_m2} m²` : 'N/A'}</div>
            <div><span className="font-semibold text-slate-700">{t('property_details_page.rooms_label')}</span> {p.num_rooms || 'N/A'}</div>
            <div><span className="font-semibold text-slate-700">{t('property_details_page.floor_label')}</span> {p.floor_number || 'N/A'}</div>
            <div><span className="font-semibold text-slate-700">{t('property_details_page.heating_label')}</span> {p.heating_type || 'N/A'}</div>
            <div><span className="font-semibold text-slate-700">{t('property_details_page.status_label')}</span> <span className="capitalize">{propertyStatusDisplay}</span></div>
          </div>

          <h2 className="text-2xl font-semibold text-slate-800 mb-3">{t('property_details_page.description_title')}</h2>
          <p className="text-slate-700 mb-8 whitespace-pre-line leading-relaxed">
            {p.description || t('property_details_page.no_description')}
          </p>

          <div className="mt-8 text-center">
            <Link href="/properties" className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium">
              <ArrowLeft size={18} className="mr-2"/>
              {t('property_details_page.back_to_listings_link')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
