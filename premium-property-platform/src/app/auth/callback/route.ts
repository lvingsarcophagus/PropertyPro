// src/app/auth/callback/route.ts
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/`); // Redirect to homepage or profile
    }
  }

  // return the user to an error page with instructions
  console.error('Auth callback error or no code provided');
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
