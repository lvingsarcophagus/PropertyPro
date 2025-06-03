// src/app/[locale]/page.tsx
import Link from 'next/link';
import { getI18n } from '@/lib/i18n';

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getI18n();

  return (
    <>
        {/* Hero Section - Already dark, text is white/amber, should be fine. */}
        <section className="bg-slate-900 text-white py-20 pt-36">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-5xl font-bold mb-4 md:text-6xl">
              {t('homepage.hero_title')}
            </h1>
            <p className="text-xl mb-8 md:text-2xl text-slate-300 dark:text-slate-400">
              {t('homepage.hero_subtitle')}
            </p>
            <div className="space-x-4">
              <Link href="/signup" legacyBehavior>
                <a className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 px-8 rounded-lg text-lg transition duration-300">
                  {t('homepage.hero_cta_join')}
                </a>
              </Link>
              <Link href="/properties" legacyBehavior>
                <a className="bg-transparent hover:bg-slate-700 dark:hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-lg border-2 border-amber-500 text-lg transition duration-300">
                  {t('homepage.hero_cta_search')}
                </a>
              </Link>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="py-16 bg-slate-50 dark:bg-slate-800/50">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12 text-slate-800 dark:text-slate-100">
              {t('homepage.platform_highlights_title')}
            </h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {/* Card 1 */}
              <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-2xl dark:hover:shadow-slate-700/50 transition-shadow duration-300">
                <div className="text-amber-500 dark:text-amber-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-slate-700 dark:text-slate-200">{t('homepage.feature_dashboards_title')}</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {t('homepage.feature_dashboards_desc')}
                </p>
              </div>
              {/* Card 2 */}
              <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-2xl dark:hover:shadow-slate-700/50 transition-shadow duration-300">
                <div className="text-amber-500 dark:text-amber-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-slate-700 dark:text-slate-200">{t('homepage.feature_search_title')}</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {t('homepage.feature_search_desc')}
                </p>
              </div>
              {/* Card 3 */}
              <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-2xl dark:hover:shadow-slate-700/50 transition-shadow duration-300">
                <div className="text-amber-500 dark:text-amber-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-slate-700 dark:text-slate-200">{t('homepage.feature_listings_title')}</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {t('homepage.feature_listings_desc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section - bg-slate-100 will be handled by body's dark:bg-slate-900 or specific dark:bg-slate-800/50 if needed */}
        <section className="py-16 bg-slate-100 dark:bg-slate-800/60">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-8">
              {t('homepage.testimonials_title')}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t('homepage.testimonials_desc')}
            </p>
          </div>
        </section>

        {/* Call to Action Section - bg-amber-500 is an accent, should be fine. Text on it needs to contrast. */}
        <section className="py-20 bg-amber-500 dark:bg-amber-600">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                    {t('homepage.cta_title')}
                </h2>
                <Link href="/signup" legacyBehavior>
                    <a className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-bold py-4 px-10 rounded-lg text-xl transition duration-300">
                    {t('homepage.cta_button')}
                    </a>
                </Link>
            </div>
        </section>

        {/* Footer - bg-slate-900 is already dark. Text color text-slate-400 should be okay. */}
        <footer className="bg-slate-900 text-slate-400 py-8 text-center">
          <div className="container mx-auto px-6">
            <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
            <p className="text-sm mt-1">{t('footer.designed_with')}</p>
          </div>
        </footer>
    </>
  );
}
