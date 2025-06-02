// src/app/api/search/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // Required for createServerClient

export async function GET(request: NextRequest) {
  const cookieStore = cookies(); // Get cookie store
  const supabase = createServerClient( // Initialize server client
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
           cookies: {
               get(name: string) {
                   return cookieStore.get(name)?.value;
               },
               // Set and remove are not strictly necessary for a GET handler
               // if not modifying auth state, but good practice to include them.
               set(name: string, value: string, options: CookieOptions) {
                   //cookieStore.set({ name, value, ...options });
               },
               remove(name: string, options: CookieOptions) {
                   //cookieStore.set({ name, value: '', ...options });
               },
           },
       }
  );

  const { searchParams } = new URL(request.url);

  // Basic Filters
  const propertyType = searchParams.get('propertyType');
  const purpose = searchParams.get('purpose');
  const city = searchParams.get('city');
  const district = searchParams.get('district');

  // Advanced Filters
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const minArea = searchParams.get('minArea');
  const maxArea = searchParams.get('maxArea');
  const rooms = searchParams.get('rooms');
  const floor = searchParams.get('floor');
  const heatingType = searchParams.get('heatingType');
  const keywords = searchParams.get('keywords');

  // Sorting
  const sortBy = searchParams.get('sortBy') || 'created_at'; // Default sort
  const sortOrderAsc = (searchParams.get('sortOrder') || 'desc') === 'asc'; // Default desc

  // Pagination
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10); // Default 10 items per page
  const offset = (page - 1) * limit;

  let query = supabase.from('properties').select('*', { count: 'exact' });

  // Apply filters
  if (propertyType) query = query.eq('type', propertyType);
  if (purpose) query = query.eq('purpose', purpose);
  if (city) query = query.ilike('city', `%${city}%`); // Case-insensitive like
  if (district) query = query.ilike('district', `%${district}%`);

  if (minPrice) query = query.gte('price', parseFloat(minPrice));
  if (maxPrice) query = query.lte('price', parseFloat(maxPrice));
  if (minArea) query = query.gte('area_m2', parseFloat(minArea));
  if (maxArea) query = query.lte('area_m2', parseFloat(maxArea));
  
  if (rooms) query = query.eq('num_rooms', parseInt(rooms, 10));
  if (floor) query = query.eq('floor_number', parseInt(floor, 10));
  if (heatingType) query = query.eq('heating_type', heatingType);

  if (keywords) {
    // Process keywords for FTS: split by space, join with '&' for 'AND' logic
    const processedKeywords = keywords.trim().split(/\s+/).join(' & ');
    if (processedKeywords) { // ensure not to search with empty string if keywords were just spaces
        query = query.textSearch('fts', processedKeywords, {
          // type: 'plain', // or 'phrase' or 'websearch'
          // config: 'english' // Ensure this matches your tsvector config
        });
    }
  }
  
  // Apply Sorting
  if (sortBy) {
       query = query.order(sortBy, { ascending: sortOrderAsc });
  }

  // Apply Pagination
  query = query.range(offset, offset + limit - 1);
  
  const { data, error, count } = await query;

  if (error) {
    console.error('Supabase query error:', error);
    return NextResponse.json({ error: 'Failed to fetch properties', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    properties: data,
    count: count, // Total count of matching items for pagination
    page,
    limit,
    totalPages: count ? Math.ceil(count / limit) : 0
  });
}
