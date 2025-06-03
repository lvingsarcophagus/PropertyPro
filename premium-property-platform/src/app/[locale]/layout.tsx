// src/app/[locale]/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css"; // Assuming globals.css is in src/app/
import Navbar from "@/components/Navbar"; 
import { I18nProvider } from "@/lib/i18n"; // Removed getLocaleProps, getCurrentLocale, not used here
                                        // and assuming dynamic import below is sufficient for provider
                                        // If using older next-international, getLocaleProps might be needed here.

const inter = Inter({ subsets: ["latin"] });

// Default metadata, can be overridden by specific pages
export const metadata: Metadata = {
  title: "Premium Property Platform",
  description: "Your premium solution for property broking.",
};

export default async function RootLayout({
  children,
  params: { locale }
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  // Dynamically import the locale messages based on the locale parameter
  // This is a common pattern for App Router with server components.
  // The I18nProvider will make these messages available to client components.
  let messages;
  try {
    messages = (await import(`@/lib/i18n/locales/${locale}`)).default;
  } catch (error) {
    console.error(`Could not load locale: ${locale}`, error);
    // Fallback to default locale or handle error appropriately
    messages = (await import(`@/lib/i18n/locales/en`)).default; 
    // Or redirect to a default locale path, though middleware should handle unknown locales.
  }

  return (
    <html lang={locale}>
      <body className={`${inter.className} bg-slate-50`}>
        <I18nProvider locale={locale} messages={messages}>
          <Navbar /> {/* Navbar will be updated later to use i18n */}
          <main>{children}</main>
          {/* Add Footer component here later if it needs i18n */}
        </I18nProvider>
      </body>
    </html>
  );
}
