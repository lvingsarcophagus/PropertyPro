// src/app/properties/page.tsx
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import PropertyCard from '@/components/PropertyCard';
import { Property } from '@/types';
import Link from 'next/link';

export const revalidate = 0; // Revalidate on every request

async function PropertiesPage() {
  const supabase = createSupabaseBrowserClient();
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching properties:', error);
    return <p>Error loading properties. Check console for details.</p>;
  }

  if (!properties || properties.length === 0) {
    return (
       <div className="container mx-auto p-4">
           <div className="flex justify-between items-center mb-6">
               <h1 className="text-3xl font-bold">Properties</h1>
               <Link href="/properties/new" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                   Add New Property
               </Link>
           </div>
           <p>No properties listed yet.</p>
       </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Properties</h1>
        <Link href="/properties/new" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Add New Property
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property as Property} />
        ))}
      </div>
    </div>
  );
}

export default PropertiesPage;
