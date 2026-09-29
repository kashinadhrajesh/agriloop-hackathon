import { calculateDistance } from '@/lib/distance/haversine'

export type LocationMode = 'REAL' | 'DEMO'

export interface UserLocation {
  latitude: number
  longitude: number
  location_name: string
  location_mode: LocationMode
}

export interface DemoLocation {
  id: string
  name: string
  latitude: number
  longitude: number
  state: string
}

export const DEMO_LOCATIONS: DemoLocation[] = [
  {
    id: 'kumily',
    name: 'Kumily, Kerala',
    latitude: 9.6031,
    longitude: 77.1615,
    state: 'Kerala'
  },
  {
    id: 'kattappana',
    name: 'Kattappana, Kerala',
    latitude: 9.7547,
    longitude: 77.1192,
    state: 'Kerala'
  },
  {
    id: 'thiruvananthapuram',
    name: 'Thiruvananthapuram, Kerala',
    latitude: 8.5241,
    longitude: 76.9366,
    state: 'Kerala'
  },
  {
    id: 'kochi',
    name: 'Kochi, Kerala',
    latitude: 9.9312,
    longitude: 76.2673,
    state: 'Kerala'
  }
]

export function getDefaultLocationForRole(role?: string): UserLocation {
  if (role === 'PROVIDER') {
    return {
      latitude: 9.7547,
      longitude: 77.1192,
      location_name: 'Kattappana, Kerala',
      location_mode: 'DEMO'
    }
  }
  return {
    latitude: 9.6031,
    longitude: 77.1615,
    location_name: 'Kumily, Kerala',
    location_mode: 'DEMO'
  }
}

/**
 * Request real coordinates from the browser Geolocation API
 */
export async function getBrowserLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (error) => {
        let msg = 'Unable to retrieve location.'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location permission was denied. You can enable location access in your browser settings or use a demo location.'
            break
          case error.POSITION_UNAVAILABLE:
            msg = 'Location information is currently unavailable.'
            break
          case error.TIMEOUT:
            msg = 'Location request timed out. Please try again.'
            break
        }
        reject(new Error(msg))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  })
}

/**
 * Reverse geocode latitude and longitude into a human-readable city/state name
 */
export async function reverseGeocodeLocation(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`, {
      headers: { 'Accept': 'application/json' }
    })
    if (res.ok) {
      const data = await res.json()
      const addr = data?.address
      if (addr) {
        const city = addr.city || addr.town || addr.village || addr.suburb || addr.county
        const state = addr.state || addr.region
        if (city && state) return `${city}, ${state}`
        if (city) return city
        if (data.display_name) return data.display_name.split(',').slice(0, 2).join(',')
      }
    }
  } catch (err) {
    console.warn('Reverse geocode failed or rate-limited:', err)
  }
  return `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`
}

/**
 * Retrieve user's location from their Supabase profile
 */
export async function fetchUserLocation(
  supabase: any,
  userId: string,
  userRole?: string
): Promise<UserLocation> {
  try {
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('latitude, longitude, location_name, location_mode, role')
      .eq('id', userId)
      .single()

    if (!profile) {
      const fallback = await supabase
        .from('users')
        .select('latitude, longitude, location_name, location_mode, role')
        .eq('id', userId)
        .single()
      profile = fallback.data
    }

    if (profile && profile.latitude != null && profile.longitude != null) {
      return {
        latitude: Number(profile.latitude),
        longitude: Number(profile.longitude),
        location_name: profile.location_name || (profile.role === 'PROVIDER' ? 'Kattappana, Kerala' : 'Kumily, Kerala'),
        location_mode: (profile.location_mode as LocationMode) || 'DEMO'
      }
    }
  } catch (e) {
    console.error('Error fetching user location profile:', e)
  }

  return getDefaultLocationForRole(userRole)
}

/**
 * Save user's updated location to their Supabase profile
 */
export async function persistUserLocation(
  supabase: any,
  userId: string,
  location: UserLocation
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      latitude: location.latitude,
      longitude: location.longitude,
      location_name: location.location_name,
      location_mode: location.location_mode,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)

    if (error) {
      // Try fallback to users table
      await supabase.from('users').update(payload).eq('id', userId)
    }
    return { success: true }
  } catch (err: any) {
    console.error('Error persisting location to profile:', err)
    return { success: false, error: err.message || 'Failed to update location' }
  }
}

export { calculateDistance }
