// src/app/properties/new/page.tsx
import PropertyForm from '@/components/PropertyForm';
// import { createClient } from '@/lib/supabaseClient'; // Using browser client for auth check - Switched to server client

// This page should be a client component or use one to get user session
// For simplicity, we'll make it a server component that fetches user on server side for now
// A more robust solution might involve a client component wrapper for auth check
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Updated server client


async function NewPropertyPage() {
   const cookieStore = cookies();
   const supabase = createSupabaseServerClient(); // Updated server client usage


   const { data: { session } } = await supabase.auth.getSession();

   if (!session) {
       // Or redirect to login
       return (
           <div className="container mx-auto p-4">
               <h1 className="text-2xl font-bold mb-4">Create New Property</h1>
               <p>You must be logged in to create a new property.</p>
               {/* Optionally, add a Link to login page */}
           </div>
       );
   }


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Create New Property</h1>
      <PropertyForm userId={session.user.id} />
    </div>
  );
}

export default NewPropertyPage;
