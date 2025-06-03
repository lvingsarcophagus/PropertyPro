// src/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { createI18nMiddleware } from 'next-international/middleware';
import { locales, defaultLocale } from '@/lib/i18n'; // Adjust path if i18n/index.ts is elsewhere

const I18nMiddleware = createI18nMiddleware({
  locales,
  defaultLocale,
  // Optional: Define other options like URL mapping or custom locale detection
  // urlMappingStrategy: 'rewrite', // Example, default is 'redirect'
});

export async function middleware(request: NextRequest) {
  // 1. Handle i18n
  // Clone the request headers to avoid modifying the original request directly if needed later
  // For i18nMiddleware, it might modify headers for locale detection or set cookies for locale preference.
  const i18nResponse = I18nMiddleware(request);
  if (i18nResponse) return i18nResponse; // If i18n middleware returns a response (e.g. redirect), use it

  // 2. Handle Supabase Auth (existing logic)
  // It's important that the response object used by Supabase is based on the potentially modified request from i18n
  // or a fresh NextResponse.next() if i18nResponse was not returned.
  // If i18nResponse was returned, this part is skipped. Otherwise, continue with Supabase logic.

  let response = NextResponse.next({
    request: {
      headers: request.headers, // Use original request headers or headers from a potential i18n-modified request
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // The request object should not be modified directly here for cookies.
          // The response object is the one that should carry cookie changes back to the browser.
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  await supabase.auth.getSession(); // Refresh session

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - explicitly added 'api'
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (Supabase auth callback)
     * This matcher should be compatible with next-international's needs.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
};
