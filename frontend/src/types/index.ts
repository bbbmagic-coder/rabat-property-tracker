// Database types matching Supabase schema

export interface Developer {
  id: string;
  name: string;
  name_ar?: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  rating: number;
  total_projects: number;
  completed_projects: number;
  on_time_delivery_rate: number;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  
  // Basic info
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  
  // Location
  address?: string;
  district?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  
  // Pricing
  price_min?: number;
  price_max?: number;
  price_per_sqm?: number;
  currency: string;
  
  // Project details
  developer_id?: string;
  developer?: Developer;
  property_type?: string;
  total_units?: number;
  bedrooms_min?: number;
  bedrooms_max?: number;
  area_min?: number;
  area_max?: number;
  
  // Construction status
  construction_status?: string;
  construction_start_date?: string;
  expected_completion_date?: string;
  actual_completion_date?: string;
  
  // Scores
  investment_score: number;
  location_score: number;
  price_score: number;
  developer_score: number;
  infrastructure_score: number;
  status_score: number;
  
  // Distances (meters)
  distance_to_university?: number;
  distance_to_school?: number;
  distance_to_mall?: number;
  distance_to_beach?: number;
  distance_to_transport?: number;
  distance_to_downtown?: number;
  
  // Source
  source_url?: string;
  source_name?: string;
  first_seen_at: string;
  last_checked_at: string;
  
  // Meta
  image_urls?: string[];
  amenities?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyUpdate {
  id: string;
  property_id: string;
  update_type: string;
  old_value?: string;
  new_value?: string;
  description?: string;
  created_at: string;
}

export interface UserWatchlist {
  id: string;
  user_id: string;
  property_id: string;
  property?: Property;
  notes?: string;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  
  // Email notifications
  email_notifications: boolean;
  notify_new_projects: boolean;
  notify_price_changes: boolean;
  notify_status_changes: boolean;
  notify_weekly_report: boolean;
  
  // Filter preferences
  min_price?: number;
  max_price?: number;
  preferred_districts?: string[];
  preferred_property_types?: string[];
  min_bedrooms?: number;
  min_investment_score?: number;
  
  created_at: string;
  updated_at: string;
}

export interface NearbyPlace {
  id: string;
  name: string;
  name_ar?: string;
  place_type: string;
  latitude: number;
  longitude: number;
  address?: string;
  google_place_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SearchLog {
  id: string;
  search_query?: string;
  results_found: number;
  new_properties_added: number;
  execution_time_ms?: number;
  status: string;
  error_message?: string;
  created_at: string;
}

export interface EmailQueue {
  id: string;
  recipient_email: string;
  user_id?: string;
  email_type: string;
  subject: string;
  body_html: string;
  status: string;
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

// Filter types
export interface PropertyFilters {
  minPrice?: number;
  maxPrice?: number;
  districts?: string[];
  propertyTypes?: string[];
  minBedrooms?: number;
  maxBedrooms?: number;
  minScore?: number;
  constructionStatus?: string[];
  developers?: string[];
  search?: string;
}

// Map marker
export interface PropertyMarker {
  id: string;
  position: google.maps.LatLngLiteral;
  title: string;
  score: number;
  price_min?: number;
  property_type?: string;
}

// Construction status options
export const CONSTRUCTION_STATUSES = {
  planning: 'Tervezés',
  approved: 'Engedélyezve',
  construction: 'Építés alatt',
  completed: 'Befejezve',
} as const;

export type ConstructionStatus = keyof typeof CONSTRUCTION_STATUSES;

// Property type options
export const PROPERTY_TYPES = {
  apartment: 'Lakás',
  villa: 'Villa',
  commercial: 'Kereskedelmi',
  mixed: 'Vegyes',
} as const;

export type PropertyType = keyof typeof PROPERTY_TYPES;

// Email notification types
export const EMAIL_TYPES = {
  new_project: 'Új projekt',
  price_change: 'Ár változás',
  status_change: 'Státusz változás',
  weekly_report: 'Heti riport',
} as const;

export type EmailType = keyof typeof EMAIL_TYPES;

// Districts in Rabat
export const RABAT_DISTRICTS = [
  'Agdal',
  'Hassan',
  'Hay Riad',
  'Souissi',
  'Océan',
  'Akkari',
  'Yacoub El Mansour',
  'Hay Nahda',
  'Aviation',
  'Orangers',
  'Ambassadeurs',
  'Diour Jamaa',
] as const;

export type RabatDistrict = typeof RABAT_DISTRICTS[number];
