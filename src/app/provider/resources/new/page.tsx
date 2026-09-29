'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Leaf, MapPin, Calendar, Weight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

const UNITS = ['kg', 'tonnes', 'bags', 'litres']

export default function NewResourcePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    resource_type: 'Vegetable Waste',
    quantity: '',
    unit: 'kg',
    location: '',
    available_from: '',
    available_until: '',
    description: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert("You must be logged in to create a resource.")
        setLoading(false)
        return
      }

      // Retrieve provider's saved profile location
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
      const lat = profile?.latitude ?? 9.7547
      const lon = profile?.longitude ?? 77.1192
      const locationName = formData.location || profile?.location_name || 'Kattappana, Kerala'

      const { error } = await supabase.from('resources').insert({
        provider_id: user.id,
        title: `${formData.quantity} ${formData.unit} of ${formData.resource_type}`,
        description: formData.description,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        resource_type: formData.resource_type,
        location: locationName,
        latitude: lat,
        longitude: lon,
        available_from: formData.available_from || new Date().toISOString().split('T')[0],
        available_until: formData.available_until || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        status: 'available'
      })

      if (error) throw error

      router.push('/provider/dashboard?success=ResourceAdded')
    } catch (error: any) {
      console.error(error)
      alert("Error saving resource: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">List a Resource</h1>
        <p className="text-gray-600 mt-1">Make your organic material available for nearby farmers.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resource Type */}
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="resource_type" className="block text-sm font-medium text-gray-700 mb-1">
                Resource Category
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Leaf className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="resource_type"
                  name="resource_type"
                  value={formData.resource_type}
                  onChange={handleChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2.5"
                  required
                >
                  {RESOURCE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Weight className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="quantity"
                  id="quantity"
                  min="0.1"
                  step="any"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2.5"
                  placeholder="e.g. 500"
                  required
                />
              </div>
            </div>

            {/* Unit */}
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2.5"
                required
              >
                {UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="location"
                  id="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2.5"
                  placeholder="e.g. Green Valley Canteen, Main St."
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">For the MVP demo, coordinates will be geocoded automatically or use a default.</p>
            </div>

            {/* Dates */}
            <div>
              <label htmlFor="available_from" className="block text-sm font-medium text-gray-700 mb-1">
                Available From
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  name="available_from"
                  id="available_from"
                  value={formData.available_from}
                  onChange={handleChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2.5"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="available_until" className="block text-sm font-medium text-gray-700 mb-1">
                Available Until
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  name="available_until"
                  id="available_until"
                  value={formData.available_until}
                  onChange={handleChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2.5"
                />
              </div>
            </div>

            {/* Description */}
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2.5"
                placeholder="Any special instructions for pickup, exact type of waste, etc."
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {loading ? 'Listing...' : 'List Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
