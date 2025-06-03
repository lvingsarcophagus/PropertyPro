// src/app/properties/[id]/page.tsx
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Property } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 0;

type PropertyDetailPageProps = {
  params: { id: string };
};

async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const supabase = createSupabaseBrowserClient();
  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) {
    console.error('Error fetching property:', error);
    return <p>Error loading property details. Property may not exist or an error occurred.</p>;
  }

  if (!property) {
    return <p>Property not found.</p>;
  }

  const p = property as Property;

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {p.images && p.images.length > 0 && (
          <div className="relative h-96 w-full">
            <Image
              src={p.images[0]} // Display the first image as a hero
              alt={`Image of ${p.type} at ${p.street}`}
              layout="fill"
              objectFit="cover"
            />
          </div>
        )}
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">{p.type} in {p.city}</h1>
          <p className="text-gray-700 text-lg mb-4">{p.street}, {p.district}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div><span className="font-semibold">Price:</span> ${p.price?.toLocaleString()} ({p.purpose})</div>
            <div><span className="font-semibold">Area:</span> {p.area_m2} m²</div>
            <div><span className="font-semibold">Rooms:</span> {p.num_rooms}</div>
            <div><span className="font-semibold">Floor:</span> {p.floor_number}</div>
            <div><span className="font-semibold">Heating:</span> {p.heating_type}</div>
            <div><span className="font-semibold">Status:</span> <span className="capitalize">{p.status}</span></div>
          </div>

          <h2 className="text-2xl font-semibold mb-2">Description</h2>
          <p className="text-gray-600 mb-6 whitespace-pre-line">{p.description || 'No description available.'}</p>

          {/* Placeholder for broker info, invoices, comments */}
          {/* <h2 className="text-2xl font-semibold mb-2">Broker Information</h2> */}
          {/* <p className="text-gray-600 mb-6">Broker ID: {p.broker_id}</p> */}

          <div className="mt-6">
            <Link href={`/properties/${p.id}/edit`} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2">
              Edit Property
            </Link>
            <Link href="/properties" className="text-blue-500 hover:text-blue-700">
              Back to Listings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyDetailPage;
