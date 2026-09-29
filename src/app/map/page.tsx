'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Filter, Navigation, Settings, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  UserLocation,
  fetchUserLocation,
  getBrowserLocation,
  reverseGeocodeLocation,
  persistUserLocation,
  getDefaultLocationForRole,
  calculateDistance
} from '@/lib/location'
import LocationSettings from '@/components/LocationSettings'

// Dynamically import the map to prevent SSR errors with window/document
const MapComponent = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Loading Map...</div>
})

// Fallback demo resources in Kerala if database has no resources
const FALLBACK_DEMO_RESOURCES = [
  {
    id: 'res-demo-1',
    resource_type: 'Vegetable Waste',
    quantity: 500,
    unit: 'kg',
    latitude: 9.6050, 
    longitude: 77.1630,
    status: 'AVAILABLE',
    provider_name: 'Kumily Agro Waste Hub'
  },
  {
    id: 'res-demo-2',
    resource_type: 'Cow Dung',
    quantity: 300,
    unit: 'kg',
    latitude: 9.7547, 
    longitude: 77.1192,
    status: 'AVAILABLE',
    provider_name: 'High Range Dairy Farm, Kattappana'
  },
  {
    id: 'res-demo-3',
    resource_type: 'Crop Residue',
    quantity: 500,
    unit: 'kg',
    latitude: 9.7580, 
    longitude: 77.1230,
    status: 'RESERVED',
    provider_name: 'Kattappana Agro Supply'
  }
]

export default function MapPage() {
  const [filter, setFilter] = useState('ALL')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('FARMER')
  const [currentUserLocation, setCurrentUserLocation] = useState<UserLocation>(getDefaultLocationForRole('FARMER'))
  const [loadingLocation, setLoadingLocation] = useState(true)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [locationWarning, setLocationWarning] = useState<string | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [rawResources, setRawResources] = useState<any[]>([])

  const supabase = createClient()

  // 1. Load authenticated user, profile location, and resources
  useEffect(() => {
    let isMounted = true

    async function initializeMapData() {
      setLoadingLocation(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        
        let role = 'FARMER'
        let loc = getDefaultLocationForRole('FARMER')

        if (user) {
          if (isMounted) setCurrentUser(user)

          // Retrieve profiles WHERE id = user.id
          let { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          // Fallback if profiles is stored under users table
          if (!profile) {
            const { data: userProfile } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single()
            profile = userProfile
          }

          // Temporary console debugging as required in Step 1
          console.log("MAP USER ID:", user?.id);
          console.log("MAP USER EMAIL:", user?.email);
          console.log("MAP PROFILE:", profile);
          console.log("MAP ROLE:", profile?.role);
          console.log("MAP LOCATION:", profile?.location_name);
          console.log("MAP LAT:", profile?.latitude);
          console.log("MAP LNG:", profile?.longitude);
          console.log("MAP MODE:", profile?.location_mode);

          if (profile) {
            role = profile.role || (user.email?.includes('provider') ? 'PROVIDER' : 'FARMER')
            if (isMounted) setUserRole(role)

            if (profile.latitude != null && profile.longitude != null) {
              loc = {
                latitude: Number(profile.latitude),
                longitude: Number(profile.longitude),
                location_name: profile.location_name || (role === 'PROVIDER' ? 'Kattappana, Kerala' : 'Kumily, Kerala'),
                location_mode: profile.location_mode || 'DEMO'
              }
            } else {
              loc = getDefaultLocationForRole(role)
            }
          } else {
            role = user.email?.includes('provider') ? 'PROVIDER' : 'FARMER'
            loc = getDefaultLocationForRole(role)
          }

          // If location mode is REAL, attempt browser geolocation
          if (loc.location_mode === 'REAL') {
            try {
              const coords = await getBrowserLocation()
              const reverseName = await reverseGeocodeLocation(coords.latitude, coords.longitude)
              loc = {
                latitude: coords.latitude,
                longitude: coords.longitude,
                location_name: reverseName,
                location_mode: 'REAL'
              }
              await persistUserLocation(supabase, user.id, loc)
            } catch (geoErr: any) {
              console.warn('Real geolocation fallback to profile coords:', geoErr)
              if (isMounted) {
                setLocationWarning(
                  'Location permission was denied or unavailable. Using saved profile coordinates. You can enable browser location or use a demo location.'
                )
              }
            }
          }
        }

        if (isMounted) {
          setCurrentUserLocation(loc)
          setUserRole(role)
        }

        // Fetch resources from Supabase
        const { data: dbRes, error: resErr } = await supabase
          .from('resources')
          .select('*')

        if (!resErr && dbRes && dbRes.length > 0) {
          if (isMounted) setRawResources(dbRes)
        } else {
          if (isMounted) setRawResources(FALLBACK_DEMO_RESOURCES)
        }
      } catch (err) {
        console.error('Error initializing map page:', err)
      } finally {
        if (isMounted) setLoadingLocation(false)
      }
    }

    initializeMapData()

    return () => {
      isMounted = false
    }
  }, [])

  // Detect GPS / My Location button handler
  const handleMyLocation = async () => {
    setIsDetectingLocation(true)
    setLocationWarning(null)

    try {
      const coords = await getBrowserLocation()
      const locName = await reverseGeocodeLocation(coords.latitude, coords.longitude)
      const newLoc: UserLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        location_name: locName,
        location_mode: 'REAL'
      }

      setCurrentUserLocation(newLoc)

      if (currentUser?.id) {
        await persistUserLocation(supabase, currentUser.id, newLoc)
      }
    } catch (err: any) {
      setLocationWarning(err.message || 'Location permission was denied. You can enable location access or use a demo location.')
    } finally {
      setIsDetectingLocation(false)
    }
  }

  // Calculate dynamic distances to all resources relative to active user location
  const resourceLocations = (rawResources.length > 0 ? rawResources : FALLBACK_DEMO_RESOURCES).map((res) => {
    const lat = typeof res.latitude === 'number' ? res.latitude : 9.7547
    const lon = typeof res.longitude === 'number' ? res.longitude : 77.1192
    const dist = calculateDistance(currentUserLocation.latitude, currentUserLocation.longitude, lat, lon)

    return {
      ...res,
      latitude: lat,
      longitude: lon,
      providerLocation: res.location || res.provider_name || 'Kerala',
      distance_km: Number(dist.toFixed(1))
    }
  })

  // Apply status filter
  const displayedResources = filter === 'ALL'
    ? resourceLocations
    : resourceLocations.filter(r => (r.status || '').toUpperCase() === filter)

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Map Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-20">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="text-emerald-600 w-6 h-6" />
            Resource Map
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">Explore available resources in your area.</p>
        </div>
        
        {/* User Location Info & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* User Location Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 shadow-sm max-w-[260px] truncate" title={`Your Location: ${currentUserLocation.location_name}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className="truncate">📍 Your Location: {currentUserLocation.location_name}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
              currentUserLocation.location_mode === 'REAL' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-200/70 text-emerald-900'
            }`}>
              {currentUserLocation.location_mode || 'DEMO'}
            </span>
          </div>

          {/* Recenter / Detect My Location Button */}
          <button 
            type="button"
            onClick={handleMyLocation}
            disabled={isDetectingLocation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-60"
            title="Retrieve your current GPS location and center the map"
          >
            {isDetectingLocation ? (
              <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>◎ My Location</span>
          </button>

          {/* Location Settings Modal Trigger */}
          <button 
            type="button"
            onClick={() => setShowLocationModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
            title="Configure Real or Demo location"
          >
            <Settings className="w-3.5 h-3.5 text-gray-500" />
            <span>Location Settings</span>
          </button>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-1.5 border-l border-gray-200 pl-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select 
              className="text-xs border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-1.5 pl-2 pr-7 bg-white"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved / Confirmed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Permission / Geolocation Warning Banner */}
      {locationWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-3 z-20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{locationWarning}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setLocationWarning(null)
              setShowLocationModal(true)
            }}
            className="shrink-0 bg-amber-200/80 hover:bg-amber-200 text-amber-950 font-semibold px-2.5 py-1 rounded text-xs transition-colors"
          >
            Use Demo Location
          </button>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-grow p-4 md:p-6 bg-gray-50">
        <div className="h-full w-full rounded-xl shadow-sm border border-gray-200 overflow-hidden relative z-10">
          {loadingLocation ? (
            <div className="h-full w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-500 font-medium">
              Detecting your location & loading map...
            </div>
          ) : (
            <MapComponent 
              currentUserLocation={currentUserLocation}
              resourceLocations={displayedResources}
              userRole={userRole}
              centerLat={currentUserLocation.latitude} 
              centerLon={currentUserLocation.longitude}
              locationName={currentUserLocation.location_name}
              resources={displayedResources}
            />
          )}
        </div>
      </div>

      {/* Location Settings Modal */}
      {showLocationModal && (
        <LocationSettings
          currentLocation={currentUserLocation}
          userId={currentUser?.id}
          isModal={true}
          onClose={() => setShowLocationModal(false)}
          onLocationSaved={(newLoc) => {
            setCurrentUserLocation(newLoc)
            setLocationWarning(null)
          }}
        />
      )}
    </div>
  )
}
