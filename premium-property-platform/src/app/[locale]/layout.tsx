// src/app/[locale]/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/Navbar";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

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
  let messages;
  try {
    messages = (await import(`@/lib/i18n/locales/${locale}`)).default;
  } catch (error) {
    console.error(`Could not load locale: ${locale}`, error);
    messages = (await import(`@/lib/i18n/locales/en`)).default;
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      {/* Removed direct bg-slate-100 dark:bg-slate-900 as they are now in globals.css */}
      <body className={`${inter.className} transition-colors duration-300`}>
        <ThemeProvider>
          <I18nProvider locale={locale} messages={messages}>
            <Navbar />
            <main className="pt-16">
              {children}
            </main>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
