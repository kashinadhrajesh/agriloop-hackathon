'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Calendar, Filter, X } from 'lucide-react'
import { getMatchingResources, SearchCriteria, MatchResult, Resource } from '@/lib/matching/engine'
import { createClient } from '@/lib/supabase/client'
import { fetchUserLocation } from '@/lib/location'

const DEFAULT_FARMER_LAT = 9.6031;
const DEFAULT_FARMER_LON = 77.1615;

const RESOURCE_TYPES = [
  'Vegetable Waste',
  'Fruit Waste',
  'Food Waste',
  'Crop Residue',
  'Leaves',
  'Cow Dung',
  'Compost',
  'Plant Waste',
  'Other Organic Waste'
]

const DEMO_RESOURCES: Resource[] = [
  {
    id: '1',
    resource_type: 'Vegetable Waste',
    quantity: 500,
    latitude: 9.6050, 
    longitude: 77.1630,
    available_from: '2024-10-20',
    available_until: '2099-11-20',
  },
  {
    id: '2',
    resource_type: 'Vegetable Waste',
    quantity: 100,
    latitude: 9.7547, 
    longitude: 77.1192,
    available_from: '2024-10-20',
    available_until: '2099-11-20',
  },
  {
    id: '3',
    resource_type: 'Cow Dung',
    quantity: 300,
    latitude: 9.7580, 
    longitude: 77.1230,
    available_from: '2024-10-20',
    available_until: '2099-11-20',
  }
]

export default function FarmerSearchPage() {
  const [hasSearched, setHasSearched] = useState(false)
  const [results, setResults] = useState<MatchResult[]>([])
  const [farmerLocationName, setFarmerLocationName] = useState('Kumily, Kerala')
  
  // Modal State
  const [selectedResource, setSelectedResource] = useState<MatchResult | null>(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [criteria, setCriteria] = useState<SearchCriteria>({
    resource_type: 'Vegetable Waste',
    requested_quantity: 300,
    max_distance_km: 25,
    needed_by_date: new Date().toISOString().split('T')[0],
    farmer_lat: DEFAULT_FARMER_LAT,
    farmer_lon: DEFAULT_FARMER_LON
  })

  const supabase = createClient()

  // Load authenticated farmer's location profile
  useEffect(() => {
    async function loadFarmerLocation() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const loc = await fetchUserLocation(supabase, user.id, 'FARMER')
          setCriteria(prev => ({
            ...prev,
            farmer_lat: loc.latitude,
            farmer_lon: loc.longitude
          }))
          setFarmerLocationName(loc.location_name)
        }
      } catch (err) {
        console.error('Error fetching farmer profile for search:', err)
      }
    }
    loadFarmerLocation()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Fetch live resources from Supabase
    const { data: dbResources, error } = await supabase
      .from('resources')
      .select('*')
      .eq('status', 'available')

    if (error) {
      console.error(error)
      return
    }

    // Map DB resources to expected matching engine format
    const mappedResources: Resource[] = (dbResources || []).map((res: any) => ({
      id: res.id,
      provider_id: res.provider_id,
      resource_type: res.resource_type,
      quantity: res.quantity,
      latitude: res.latitude != null ? res.latitude : criteria.farmer_lat,
      longitude: res.longitude != null ? res.longitude : criteria.farmer_lon,
      available_from: res.available_from || res.created_at,
      available_until: res.available_until || '2099-12-31'
    }))

    // Run the deterministic AgriLoop Matching Engine!
    const matches = getMatchingResources(mappedResources, criteria)
    setResults(matches)
    setHasSearched(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCriteria(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedResource) return;
    setIsSubmitting(true)
    
    // Get current farmer user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert("You must be logged in to request a resource.")
      setIsSubmitting(false)
      return
    }

    const { error } = await supabase.from('requests').insert({
      resource_id: selectedResource.id,
      farmer_id: user.id,
      provider_id: selectedResource.provider_id || selectedResource.id, // we might not have provider_id on mappedResource right now! Wait! 
      message: requestMessage,
      status: 'pending'
    })

    if (error) {
      console.error(error)
      alert("Failed to send request: " + error.message)
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    setSelectedResource(null)
    setRequestMessage('')
    alert('Request sent successfully! You can track it in your Dashboard.')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Modal Overlay */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Request Resource</h2>
              <button onClick={() => setSelectedResource(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleRequestSubmit} className="p-5">
              <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="font-semibold text-gray-900">{selectedResource.quantity} kg of {selectedResource.resource_type}</p>
                <p className="text-sm text-gray-500">{selectedResource.distance_km} km away</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message to Provider (Optional)
                </label>
                <textarea
                  rows={3}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="E.g. I can bring my own truck to pick this up tomorrow at 10 AM."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2.5"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedResource(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Find Resources</h1>
        <p className="text-gray-600 mt-1">Search and match with nearby organic materials.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter Sidebar */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <Filter className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-900">Search Filters</h2>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-100 mb-4">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Your Location: <strong>{farmerLocationName}</strong></span>
            </div>
            
            <form onSubmit={handleSearch} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                <select
                  name="resource_type"
                  value={criteria.resource_type}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2.5"
                >
                  {RESOURCE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Quantity (kg)</label>
                <input
                  type="number"
                  name="requested_quantity"
                  value={criteria.requested_quantity}
                  onChange={handleChange}
                  min="1"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Distance (km)</label>
                <input
                  type="number"
                  name="max_distance_km"
                  value={criteria.max_distance_km}
                  onChange={handleChange}
                  min="1"
                  max="500"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2.5"
                />
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>1 km</span>
                  <span>{criteria.max_distance_km} km</span>
                  <span>500 km</span>
                </div>
                <input 
                  type="range" 
                  name="max_distance_km"
                  min="1" 
                  max="500" 
                  value={criteria.max_distance_km}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Needed By Date</label>
                <input
                  type="date"
                  name="needed_by_date"
                  value={criteria.needed_by_date as string}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2.5"
                />
              </div>

              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
              >
                <Search className="w-4 h-4" />
                Find Matches
              </button>
            </form>
          </div>
        </div>

        {/* Results Area */}
        <div className="w-full lg:w-2/3">
          {!hasSearched ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-12 text-center h-full min-h-[400px]">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <Search className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Ready to search</h3>
              <p className="text-gray-500 max-w-sm">Adjust your filters on the left and click "Find Matches" to run the AgriLoop Matching Engine.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-orange-50 border border-orange-100 rounded-xl flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
              <h3 className="text-lg font-medium text-orange-800 mb-1">No matches found</h3>
              <p className="text-orange-600 max-w-sm">Try increasing your search distance or changing the resource type.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-700">Found {results.length} matching resources</h3>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-medium">Sorted by Best Match</span>
              </div>
              
              {results.map((result) => (
                <div key={result.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white font-bold text-sm px-3 py-1 rounded-bl-lg">
                    {result.match_score}% Match
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4 justify-between mt-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{result.quantity} kg {result.resource_type}</h3>
                      <p className="text-gray-500 text-sm mt-1">Provider: Green Valley Canteen</p>
                      
                      <div className="flex flex-wrap gap-3 mt-4">
                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          {result.distance_km} km away
                        </div>
                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          Available Now
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-end mt-4 md:mt-0">
                      <button 
                        onClick={() => setSelectedResource(result)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm"
                      >
                        Request Resource
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
