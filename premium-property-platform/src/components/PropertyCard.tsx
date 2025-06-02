// src/components/PropertyCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Property } from '@/types';

type PropertyCardProps = {
  property: Property;
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  return (
    <Link href={`/properties/${property.id}`} className="block">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out">
        <div className="relative h-56 w-full">
          {property.images && property.images.length > 0 ? (
            <Image
              src={property.images[0]}
              alt={`Image of ${property.type} at ${property.street}`}
              layout="fill"
              objectFit="cover"
              className="rounded-t-lg"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-200 rounded-t-lg">
              <span className="text-gray-500">No Image</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-xl font-semibold mb-1 truncate" title={`${property.type} in ${property.city}`}>
            {property.type} in {property.city}
          </h3>
          <p className="text-gray-600 text-sm mb-1 truncate" title={`${property.street}, ${property.district}`}>
            {property.street}, {property.district}
          </p>
          <p className="text-lg font-bold text-blue-600 mb-2">${property.price?.toLocaleString()}</p>
          <div className="flex justify-between text-sm text-gray-500">
            <span>{property.num_rooms} Rooms</span>
            <span>{property.area_m2} m²</span>
          </div>
          <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${property.purpose === 'sale' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
            For {property.purpose}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
