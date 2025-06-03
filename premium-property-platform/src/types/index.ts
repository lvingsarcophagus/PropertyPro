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

export type Client = {
  id: string; // UUID
  broker_id: string; // UUID of the user (broker)
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
};

export type CalendarEventType = 'appointment' | 'viewing' | 'task';

export type CalendarEvent = {
  id: string; // UUID
  broker_id: string; // UUID of the user (broker)
  client_id?: string | null; // UUID of the client
  property_id?: string | null; // UUID of the property
  event_type: CalendarEventType;
  title: string;
  description?: string | null;
  start_time: string; // ISO string (TIMESTAMPTZ)
  end_time: string; // ISO string (TIMESTAMPTZ)
  reminder?: boolean | null;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
};

export type Message = {
  id: string; // UUID
  sender_id: string; // UUID of the user (broker/admin)
  receiver_id: string; // UUID of the user (broker/admin)
  property_id?: string | null; // UUID of a related property
  content: string;
  is_read: boolean;
  sent_at: string; // timestamptz
  // Optional hydrated fields for display
  sender?: Pick<UserProfile, 'id' | 'name' | 'profile_picture'> | null;
  receiver?: Pick<UserProfile, 'id' | 'name' | 'profile_picture'> | null;
};

export type CallLog = {
  id: string; // UUID
  broker_id: string; // UUID of the user (broker)
  client_id?: string | null; // UUID of the client
  property_id?: string | null; // UUID of the property discussed
  // title?: string | null;
  description: string;
  call_time: string; // ISO string (TIMESTAMPTZ)
  duration_minutes?: number | null;
  outcome?: string | null;
  reminder_at?: string | null; // ISO string (TIMESTAMPTZ)
  reminder_sent?: boolean | null;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz

  // Optional hydrated fields for display
  client_name?: string | null; // If joining with clients table
  property_address?: string | null; // If joining with properties table
};
