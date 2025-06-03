// src/app/properties/[id]/edit/page.tsx
import PropertyForm from '@/components/PropertyForm';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Property } from '@/types';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Updated server client

type EditPropertyPageProps = {
  params: { id: string };
};

async function EditPropertyPage({ params }: EditPropertyPageProps) {
  const cookieStore = cookies();
  const supabaseServer = createSupabaseServerClient(); // Updated server client usage

  const { data: { session } } = await supabaseServer.auth.getSession();

  if (!session) {
    return <p className="container mx-auto p-4">You must be logged in to edit this property.</p>;
  }

  // Use a browser client for data fetching, ensure this page is a client component or this is fine for initial load
  const supabase = createSupabaseBrowserClient();
  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) {
    console.error('Error fetching property for edit:', error);
    return <p className="container mx-auto p-4">Error loading property. It might not exist or you may not have permission.</p>;
  }

  if (!property) {
    return <p className="container mx-auto p-4">Property not found.</p>;
  }

  // Basic authorization: user can only edit their own properties
  if (property.broker_id !== session.user.id) {
      return <p className="container mx-auto p-4">You are not authorized to edit this property.</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Edit Property</h1>
      <PropertyForm property={property as Property} userId={session.user.id} />
    </div>
  );
}

export default EditPropertyPage;
