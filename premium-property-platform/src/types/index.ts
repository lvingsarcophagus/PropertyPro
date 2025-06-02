// src/types/index.ts
export type Property = {
  id: string; // UUID
  broker_id: string; // UUID
  agency_id?: string | null; // UUID
  city?: string | null;
  district?: string | null;
  street?: string | null;
  house_number?: string | null;
  heating_type?: string | null;
  floor_number?: number | null;
  num_rooms?: number | null;
  area_m2?: number | null;
  price?: number | null;
  purpose?: 'rent' | 'sale' | null;
  type?: 'house' | 'apartment' | 'commercial' | null;
  description?: string | null;
  invoices?: any | null; // JSONB - consider defining a more specific type later
  comments?: any | null; // JSONB - consider defining a more specific type later
  images?: string[] | null; // Array of URLs
  created_at: string; // timestamptz
  updated_at?: string | null; // timestamptz
  status?: 'active' | 'pending' | 'sold' | 'rented' | null;
  // Optional fields for joined data if fetched
  broker_name?: string | null;
  agency_name?: string | null;
};

export type UserProfile = {
   id: string;
   email: string;
   role: 'individual' | 'company';
   agency_id?: string | null;
   name?: string | null;
   phone?: string | null;
   profile_picture?: string | null;
   settings?: any | null; // JSONB
};

export type Agency = {
   id: string;
   name: string;
   contact_email?: string | null;
   contact_phone?: string | null;
   billing_info?: any | null; // JSONB
};

export type SavedSearch = {
  id: string;
  user_id: string;
  name: string;
  filters: { 
    propertyType?: string;
    purpose?: string;
    city?: string;
    district?: string;
    minPrice?: string; 
    maxPrice?: string;
    minArea?: string;
    maxArea?: string;
    rooms?: string;
    floor?: string;
    heatingType?: string;
    keywords?: string;
    sortBy?: string;
    sortOrder?: string;
  };
  created_at: string;
};
