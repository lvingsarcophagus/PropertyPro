// src/components/PropertyCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Property } from '@/types';
import { useI18n } from '@/lib/i18n/index'; // Import useI18n
import { Home } from 'lucide-react'; // Icon for placeholder

// Helper function to get translated enum values (can be moved to a shared util if used in more client components)
const getTranslatedEnumValue = (t: any, scope: string, value?: string | null) => {
  if (!value) return 'N/A'; // Or some default like t('common.not_available')
  const key = `${scope}_${value.toLowerCase()}`;
  const translated = t(key, {}, { fallback: value });
  return translated === key ? value.charAt(0).toUpperCase() + value.slice(1) : translated;
};

type PropertyCardProps = {
  property: Property;
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const { t } = useI18n();

  const propertyTypeDisplay = getTranslatedEnumValue(t, 'property_details_page.value_type', property.type);
  const propertyPurposeDisplay = getTranslatedEnumValue(t, 'property_details_page.value_purpose', property.purpose);

  const imageAltText = t('property_details_page.hero_image_alt', { type: propertyTypeDisplay, street: property.street || '' });
  const titleText = `${propertyTypeDisplay} ${property.city ? t('common.in_city', { city: property.city }) : ''}`; // Add 'in {city}' key if needed

  return (
    <Link href={`/properties/${property.id}`} className="block group">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden group-hover:shadow-xl transition-shadow duration-300 ease-in-out h-full flex flex-col">
        <div className="relative h-56 w-full">
          {property.images && property.images.length > 0 ? (
            <Image
              src={property.images[0]}
              alt={imageAltText}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Basic responsive sizes
              style={{objectFit:"cover"}}
              className="rounded-t-lg"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-slate-200 rounded-t-lg">
              <Home size={48} className="text-slate-400" />
              {/* <span className="text-slate-500">{t('property_card.no_image_available')}</span> */}
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-xl font-semibold mb-1 text-slate-800 truncate" title={titleText}>
            {titleText}
          </h3>
          <p className="text-slate-600 text-sm mb-1 truncate" title={`${property.street || ''}, ${property.district || ''}`}>
            {property.street || t('common.address_not_available')}{property.district ? `, ${property.district}` : ''}
          </p>
          <p className="text-lg font-bold text-amber-600 mb-2">
            {property.price ? `$${property.price.toLocaleString()}` : t('common.price_on_request')}
          </p>
          <div className="flex justify-between text-sm text-slate-500 mt-auto pt-2 border-t border-slate-100">
            <span>{property.num_rooms ? t('property_card.rooms_count', { count: property.num_rooms }) : ''}</span>
            <span>{property.area_m2 ? t('property_card.area_value', { area: property.area_m2 }) : ''}</span>
          </div>
          {property.purpose && (
            <span className={`inline-block mt-3 px-3 py-1 text-xs font-semibold rounded-full self-start ${
              property.purpose === 'sale'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {t('property_card.for_purpose', { purpose: propertyPurposeDisplay })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
