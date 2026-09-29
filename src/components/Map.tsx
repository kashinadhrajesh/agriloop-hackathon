'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet's default icon path issues with webpack/Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Distinct icons for User vs Resources
const resourceLocationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// A distinct blue icon for the current user's location
const userLocationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -40],
  shadowSize: [41, 41]
});

interface MapProps {
  currentUserLocation?: {
    latitude: number;
    longitude: number;
    location_name?: string;
  };
  resourceLocations?: any[];
  resources?: any[];
  centerLat?: number;
  centerLon?: number;
  locationName?: string;
  userRole?: string;
}

// Component to dynamically set map center
function MapUpdater({ centerLat, centerLon }: { centerLat: number, centerLon: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([centerLat, centerLon], 13)
  }, [centerLat, centerLon, map])
  return null
}

export default function Map({ 
  currentUserLocation,
  resourceLocations,
  resources,
  centerLat,
  centerLon,
  locationName,
  userRole 
}: MapProps) {
  // Prevent SSR rendering issues with Leaflet
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="h-full w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Loading Map...</div>

  // 1. currentUserLocation: Determine current authenticated user coordinates
  const userLat = currentUserLocation?.latitude ?? centerLat ?? 9.6031
  const userLon = currentUserLocation?.longitude ?? centerLon ?? 77.1615
  const userLocName = currentUserLocation?.location_name ?? locationName ?? 'Your Location'

  // 2. resourceLocations: Available resources and provider locations
  const items = resourceLocations ?? resources ?? []
  const validResources = items.filter(
    (res) => res && typeof res.latitude === 'number' && typeof res.longitude === 'number'
  )

  return (
    <MapContainer 
      center={[userLat, userLon]} 
      zoom={13} 
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem', zIndex: 10 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapUpdater centerLat={userLat} centerLon={userLon} />

      {/* 1. Current Authenticated User Location Marker */}
      <Marker position={[userLat, userLon]} icon={userLocationIcon}>
        <Popup>
          <div className="text-center p-2 min-w-[150px]">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mb-1 font-bold">
              🔵
            </div>
            <strong className="block text-sm text-gray-900 font-bold">Your Location</strong>
            <p className="text-xs text-emerald-700 font-medium mt-0.5">
              {userLocName}
            </p>
            {userRole && (
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 rounded-full">
                {userRole}
              </span>
            )}
          </div>
        </Popup>
      </Marker>

      {/* 2. Resource Locations (Provider Resources) */}
      {validResources.map((res) => (
        <Marker key={res.id} position={[res.latitude, res.longitude]} icon={resourceLocationIcon}>
          <Popup>
            <div className="p-1">
              <h3 className="font-bold text-gray-900">{res.quantity} {res.unit} {res.resource_type}</h3>
              <p className="text-sm text-gray-600 mb-2">
                Provider: {res.provider_name || 'Resource Provider'}
                {res.providerLocation ? ` (${res.providerLocation})` : ''}
              </p>
              
              <div className="flex gap-2">
                <span className={`px-2 py-1 text-xs font-bold rounded ${
                  res.status === 'AVAILABLE' || res.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {(res.status || 'AVAILABLE').toUpperCase()}
                </span>
                <span className="text-xs text-gray-500 flex items-center">
                  ~{res.distance_km != null ? res.distance_km : 4.2} km away
                </span>
              </div>
              
              <div className="mt-3">
                <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-1.5 rounded transition-colors font-medium">
                  View Resource
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
