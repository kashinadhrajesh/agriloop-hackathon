'use client'

import React, { useState, useEffect } from 'react'
import {
  DEMO_LOCATIONS,
  DemoLocation,
  LocationMode,
  UserLocation,
  getBrowserLocation,
  reverseGeocodeLocation,
  persistUserLocation
} from '@/lib/location'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Navigation, Compass, Check, AlertCircle, Loader2, X } from 'lucide-react'

interface LocationSettingsProps {
  currentLocation: UserLocation
  userId?: string
  onLocationSaved?: (newLocation: UserLocation) => void
  onClose?: () => void
  isModal?: boolean
}

export default function LocationSettings({
  currentLocation,
  userId,
  onLocationSaved,
  onClose,
  isModal = false
}: LocationSettingsProps) {
  const [mode, setMode] = useState<LocationMode>(currentLocation.location_mode || 'DEMO')
  const getInitialDemoId = (loc: UserLocation) => {
    const matched = DEMO_LOCATIONS.find(
      (d) =>
        (loc.location_name && (loc.location_name.toLowerCase().includes(d.id) || d.name.toLowerCase().includes(loc.location_name.toLowerCase()))) ||
        (loc.latitude && Math.abs(d.latitude - loc.latitude) < 0.05 &&
         loc.longitude && Math.abs(d.longitude - loc.longitude) < 0.05)
    )
    return matched ? matched.id : DEMO_LOCATIONS[0].id
  }

  const [selectedDemoId, setSelectedDemoId] = useState<string>(() => getInitialDemoId(currentLocation))

  const [activeLocation, setActiveLocation] = useState<UserLocation>(currentLocation)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    setActiveLocation(currentLocation)
    setMode(currentLocation.location_mode || 'DEMO')
    setSelectedDemoId(getInitialDemoId(currentLocation))
  }, [currentLocation])

  const handleDetectLocation = async () => {
    setErrorMsg(null)
    setSuccessMsg(null)
    setIsDetecting(true)

    try {
      const coords = await getBrowserLocation()
      const locationName = await reverseGeocodeLocation(coords.latitude, coords.longitude)
      
      const newLoc: UserLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        location_name: locationName,
        location_mode: 'REAL'
      }

      setMode('REAL')
      setActiveLocation(newLoc)

      const supabase = createClient()
      let activeUserId = userId
      if (!activeUserId) {
        const { data: authData } = await supabase.auth.getUser()
        activeUserId = authData?.user?.id
      }

      // Auto save if user ID is available
      if (activeUserId) {
        await persistUserLocation(supabase, activeUserId, newLoc)
      }

      setSuccessMsg(`Location detected: ${locationName}`)
      if (onLocationSaved) {
        onLocationSaved(newLoc)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to detect location.')
    } finally {
      setIsDetecting(false)
    }
  }

  const handleSave = async () => {
    setErrorMsg(null)
    setSuccessMsg(null)
    setIsSaving(true)

    try {
      let targetLocation: UserLocation

      if (mode === 'REAL') {
        if (activeLocation.location_mode === 'REAL' && activeLocation.latitude) {
          targetLocation = { ...activeLocation, location_mode: 'REAL' }
        } else {
          // If in REAL mode but no real coords yet, detect
          const coords = await getBrowserLocation()
          const locationName = await reverseGeocodeLocation(coords.latitude, coords.longitude)
          targetLocation = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            location_name: locationName,
            location_mode: 'REAL'
          }
        }
      } else {
        const demo = DEMO_LOCATIONS.find((d) => d.id === selectedDemoId) || DEMO_LOCATIONS[0]
        targetLocation = {
          latitude: demo.latitude,
          longitude: demo.longitude,
          location_name: demo.name,
          location_mode: 'DEMO'
        }
      }

      const supabase = createClient()
      let activeUserId = userId
      if (!activeUserId) {
        const { data: authData } = await supabase.auth.getUser()
        activeUserId = authData?.user?.id
      }

      if (activeUserId) {
        const res = await persistUserLocation(supabase, activeUserId, targetLocation)
        if (!res.success) {
          throw new Error(res.error || 'Failed to save location to profile.')
        }
      }

      setActiveLocation(targetLocation)
      setSuccessMsg(`Location saved: ${targetLocation.location_name}`)

      if (onLocationSaved) {
        onLocationSaved(targetLocation)
      }

      if (isModal && onClose) {
        setTimeout(() => onClose(), 800)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving location.')
    } finally {
      setIsSaving(false)
    }
  }

  const content = (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6 w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Your Location</h2>
            <p className="text-xs text-gray-500">Manage map centering and matching coordinates</p>
          </div>
        </div>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Current status display */}
      <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100 mb-5 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Current mode:</span>
          <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
            activeLocation.location_mode === 'REAL' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {activeLocation.location_mode || 'DEMO'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 font-medium">Current location:</span>
          <span className="text-gray-900 font-bold flex items-center gap-1 truncate max-w-[200px]" title={activeLocation.location_name}>
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{activeLocation.location_name || 'Kumily, Kerala'}</span>
          </span>
        </div>
      </div>

      {/* Location Mode selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
            Location Mode:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                mode === 'REAL'
                  ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 font-medium ring-1 ring-emerald-600'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <input
                type="radio"
                name="location_mode"
                value="REAL"
                checked={mode === 'REAL'}
                onChange={() => setMode('REAL')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm">Use Current Location</span>
            </label>

            <label
              className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                mode === 'DEMO'
                  ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 font-medium ring-1 ring-emerald-600'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <input
                type="radio"
                name="location_mode"
                value="DEMO"
                checked={mode === 'DEMO'}
                onChange={() => setMode('DEMO')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm">Use Demo Location</span>
            </label>
          </div>
        </div>

        {/* Demo Location Selector */}
        {mode === 'DEMO' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Demo Location:
            </label>
            <select
              value={selectedDemoId}
              onChange={(e) => setSelectedDemoId(e.target.value)}
              className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2.5 bg-white border"
            >
              {DEMO_LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Real Mode Note */}
        {mode === 'REAL' && (
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs leading-relaxed border border-blue-100 flex items-start gap-2">
            <Navigation className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">GPS Geolocation</p>
              <p className="mt-0.5 text-blue-700">
                AgriLoop needs your location to show nearby resources and calculate matching distances.
              </p>
            </div>
          </div>
        )}

        {/* Error message with fallback button */}
        {errorMsg && (
          <div className="bg-amber-50 text-amber-900 p-3 rounded-lg text-xs border border-amber-200 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            {mode === 'REAL' && (
              <button
                type="button"
                onClick={() => {
                  setMode('DEMO')
                  setErrorMsg(null)
                }}
                className="w-full bg-amber-200/60 hover:bg-amber-200 text-amber-950 font-medium py-1.5 px-2 rounded text-xs transition-colors"
              >
                Use Demo Location
              </button>
            )}
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-xs border border-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isDetecting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Location...</span>
              </>
            ) : (
              <span>Save Location</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetecting || isSaving}
            className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium text-sm py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {isDetecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Detecting your location...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 text-emerald-600" />
                <span>Detect My Location</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        {content}
      </div>
    )
  }

  return content
}
