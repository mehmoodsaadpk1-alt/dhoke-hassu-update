import { City, Area } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export function getCurrentUserLocation(): string {
  try {
    const raw = localStorage.getItem('dh_user_profile_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.area || 'Dhoke Hassu';
    }
  } catch (e) {
    console.warn("Error reading current user location:", e);
  }
  return 'Dhoke Hassu';
}

// Static client-side databases for offline mode or before database migration is applied.

export const STATIC_CITIES: City[] = [
  { id: 'city-rwp-1', name: 'Rawalpindi' }
];

export const STATIC_AREAS: Area[] = [
  { id: 'area-dh-1', name: 'Dhoke Hassu', cityId: 'city-rwp-1', latitude: 33.6288, longitude: 73.0315 },
  { id: 'area-dk-1', name: 'Dhoke Khabba', cityId: 'city-rwp-1', latitude: 33.6190, longitude: 73.0720 },
  { id: 'area-st-1', name: 'Satellite Town', cityId: 'city-rwp-1', latitude: 33.6391, longitude: 73.0735 }
];

// CENTRALIZED LOCATION API FUNCTIONS

export async function dbGetCities(): Promise<City[]> {
  if (!isSupabaseConfigured || !supabase) {
    return STATIC_CITIES;
  }
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('name');
    if (error) throw error;
    return data && data.length > 0 ? data.map((c: any) => ({
      id: c.id,
      name: c.name
    })) : STATIC_CITIES;
  } catch (err) {
    console.warn("dbGetCities failed, using local fallback databases:", err);
    return STATIC_CITIES;
  }
}

export async function dbGetAreas(cityId: string): Promise<Area[]> {
  if (!isSupabaseConfigured || !supabase) {
    return STATIC_AREAS.filter(a => a.cityId === cityId);
  }
  try {
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .eq('city_id', cityId)
      .order('name');
    if (error) throw error;
    return data && data.length > 0 ? data.map((a: any) => ({
      id: a.id,
      name: a.name,
      cityId: a.city_id,
      latitude: a.latitude,
      longitude: a.longitude
    })) : STATIC_AREAS.filter(a => a.cityId === cityId);
  } catch (err) {
    console.warn("dbGetAreas failed, using local fallback databases:", err);
    return STATIC_AREAS.filter(a => a.cityId === cityId);
  }
}

// GPS / Browser Geolocation triggers

export function detectBrowserLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => {
        resolve(null);
      },
      { timeout: 5000 }
    );
  });
}

// Distance matching helper (Haversine formula) for future radius search
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest static/dynamic area matching coordinates
export async function findNearestArea(lat: number, lng: number, cityId: string): Promise<Area | null> {
  const areas = await dbGetAreas(cityId);
  if (areas.length === 0) return null;
  let nearest: Area | null = null;
  let minDist = Infinity;
  for (const a of areas) {
    if (a.latitude !== undefined && a.longitude !== undefined) {
      const dist = getDistanceKm(lat, lng, a.latitude, a.longitude);
      if (dist < minDist) {
        minDist = dist;
        nearest = a;
      }
    }
  }
  return nearest;
}
