// src/lib/i18n/index.ts
import { createI18n } from 'next-international';

export const locales = ['en', 'lt', 'ru'] as const;
export const defaultLocale = 'en' as const;

export const { 
  useI18n,
  useScopedI18n,
  I18nProvider,
  getLocaleProps,
  getCurrentLocale,
  getScopedI18n,
  getI18n, // For Server Components
} = createI18n({
  [defaultLocale]: () => import('./locales/en'), // Default locale
  lt: () => import('./locales/lt'),
  ru: () => import('./locales/ru'),
  // Add other locales here dynamically if many, or keep static for fewer
});
