// src/components/LanguageSwitcher.tsx
'use client';

import { useChangeLocale, useCurrentLocale } from '@/lib/i18n';
import { locales } from '@/lib/i18n';
import { useState } from 'react';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher() {
  const changeLocale = useChangeLocale();
  const currentLocale = useCurrentLocale();
  const [isOpen, setIsOpen] = useState(false);

  const LocaleDisplayNames: Record<typeof locales[number], string> = {
     en: 'EN',
     lt: 'LT',
     ru: 'RU',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center p-2 text-white hover:text-slate-300 focus:outline-none text-sm sm:text-base"
        aria-label="Change language"
      >
        <Languages className="h-5 w-5 mr-1" />
        {LocaleDisplayNames[currentLocale]}
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div
            className="absolute right-0 mt-2 py-1 w-28 bg-slate-700 rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5"
            onMouseLeave={() => setIsOpen(false)} // Optional: close on mouse leave
        >
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => {
                changeLocale(loc);
                setIsOpen(false);
              }}
              disabled={currentLocale === loc}
              className={`block w-full text-left px-4 py-2 text-sm ${currentLocale === loc ? 'text-amber-400 font-semibold bg-slate-600' : 'text-white hover:bg-slate-600'} disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {LocaleDisplayNames[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
