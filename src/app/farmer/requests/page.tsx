'use client'

import { useState } from 'react'
import { MapPin, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

// Dummy Data
const INITIAL_FARMER_REQUESTS = [
  {
    id: 'req-1',
    resource_id: 'res-1',
    provider_name: 'Green Valley Canteen',
    resource_type: 'Vegetable Waste',
    requested_quantity: 300,
    unit: 'kg',
    status: 'PENDING',
    distance: 4.2,
    date: '2024-10-25',
    message: 'I can pick this up tomorrow morning.'
  },
  {
    id: 'req-2',
    resource_id: 'res-2',
    provider_name: 'Local Veg Market',
    resource_type: 'Compost',
    requested_quantity: 150,
    unit: 'kg',
    status: 'ACCEPTED',
    distance: 2.1,
    date: '2024-10-24',
    message: ''
  }
]

export default function FarmerRequestsPage() {
  const [requests] = useState(INITIAL_FARMER_REQUESTS)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col md:flex-row justify-between md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Requests</h1>
          <p className="text-gray-600 mt-1">Track the status of organic resources you've requested.</p>
        </div>
        <Link 
          href="/farmer/search" 
          className="mt-4 md:mt-0 text-emerald-600 font-medium hover:text-emerald-700 underline"
        >
          Find more resources
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {requests.map(req => (
          <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden transition-all hover:shadow-md">
            
            {/* Header Banner Based on Status */}
            <div className={`px-5 py-3 border-b flex justify-between items-center ${
              req.status === 'PENDING' ? 'bg-amber-50 border-amber-100' :
              req.status === 'ACCEPTED' ? 'bg-emerald-50 border-emerald-100' :
              'bg-red-50 border-red-100'
            }`}>
              <div className="flex items-center gap-2">
                {req.status === 'PENDING' && <Clock className="w-5 h-5 text-amber-600" />}
                {req.status === 'ACCEPTED' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                {req.status === 'REJECTED' && <XCircle className="w-5 h-5 text-red-600" />}
                <span className={`font-bold text-sm ${
                  req.status === 'PENDING' ? 'text-amber-800' :
                  req.status === 'ACCEPTED' ? 'text-emerald-800' :
                  'text-red-800'
                }`}>
                  {req.status === 'ACCEPTED' ? 'MATCH CONFIRMED' : req.status}
                </span>
              </div>
              <span className="text-xs text-gray-500 font-medium">{req.date}</span>
            </div>

            {/* Body */}
            <div className="p-5 flex-grow">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {req.requested_quantity} {req.unit} {req.resource_type}
              </h3>
              <p className="text-gray-600 text-sm mb-4">Provider: <span className="font-medium text-gray-900">{req.provider_name}</span></p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  {req.distance} km away
                </div>
                {req.message && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md italic border border-gray-100 mt-2">
                    "{req.message}"
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-5 pt-0 mt-auto">
              {req.status === 'ACCEPTED' && (
                <button className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm">
                  View Pickup Details
                </button>
              )}
              {req.status === 'PENDING' && (
                <button className="w-full py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  Cancel Request
                </button>
              )}
              {req.status === 'REJECTED' && (
                <button className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
