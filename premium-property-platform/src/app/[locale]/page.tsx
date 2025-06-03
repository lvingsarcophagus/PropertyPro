// src/app/[locale]/page.tsx
import Link from 'next/link';
// import Head from 'next/head'; // Remove: Not used in App Router like this. Metadata is handled by `export const metadata` or generateMetadata

// The page now implicitly receives locale if needed, but for static content, may not be used directly.
// export async function generateMetadata({ params: { locale } }: { params: { locale: string }}) {
//   // Optionally, generate dynamic metadata based on locale
//   // For now, using static metadata from layout or could define specific here
//   return {
//     title: locale === 'lt' ? 'Pagrindinis Puslapis' : 'Homepage',
//   };
// }

export default function HomePage({ params: { locale } }: { params: { locale: string } }) {
  // locale is available here if needed for any direct conditional rendering not handled by i18n hooks/components
  // console.log("Current locale on homepage:", locale);

  return (
    <>
      {/* Metadata is handled by layout.tsx or specific metadata exports, not <Head> here. */}
      <main className="flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="bg-slate-900 text-white py-20">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-5xl font-bold mb-4 md:text-6xl">
              Discover, List, Connect
            </h1>
            <p className="text-xl mb-8 md:text-2xl text-slate-300">
              Your Premium Property Broking Platform
            </p>
            <div className="space-x-4">
              {/* Links will be automatically prefixed with the current locale by Next.js/next-international */}
              <Link href="/signup" legacyBehavior>
                <a className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-8 rounded-lg text-lg transition duration-300">
                  Join Now
                </a>
              </Link>
              <Link href="/properties" legacyBehavior>
                <a className="bg-transparent hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-lg border-2 border-amber-500 text-lg transition duration-300">
                  Search Properties
                </a>
              </Link>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12 text-slate-800">
              Platform Highlights
            </h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
                <div className="text-amber-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-slate-700">Individual & Company Dashboards</h3>
                <p className="text-slate-600">
                  Manage listings, track performance, and oversee team activities with personalized dashboards.
                </p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
                <div className="text-amber-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-slate-700">Advanced Property Search</h3>
                <p className="text-slate-600">
                  Utilize powerful filters to find properties quickly and efficiently, tailored to professional needs.
                </p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
                <div className="text-amber-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-slate-700">Comprehensive Property Listings</h3>
                <p className="text-slate-600">
                  Post and browse detailed property listings with all necessary information, images, and broker details.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section (Placeholder) */}
        <section className="py-16 bg-slate-100">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold text-slate-800 mb-8">
              Trusted by Professionals
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Hear what our users say about their success with our platform.
              (Testimonials coming soon...)
            </p>
          </div>
        </section>
        
        {/* Call to Action Section */}
        <section className="py-20 bg-amber-500">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                    Ready to Elevate Your Real Estate Business?
                </h2>
                <Link href="/signup" legacyBehavior>
                    <a className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-lg text-xl transition duration-300">
                    Get Started Today
                    </a>
                </Link>
            </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-8 text-center">
          <div className="container mx-auto px-6">
            <p>&copy; {new Date().getFullYear()} Premium Property Platform. All rights reserved.</p>
            <p className="text-sm mt-1">Designed with Next.js, Tailwind CSS, and Supabase.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
