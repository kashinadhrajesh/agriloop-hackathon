'use client'

import { useState } from 'react'
import { Check, X, User } from 'lucide-react'

// Dummy Data
const INITIAL_REQUESTS = [
  {
    id: 'req-1',
    resource_id: 'res-1',
    farmer_id: 'farm-1',
    farmer_name: 'John Farmer',
    resource_type: 'Vegetable Waste',
    requested_quantity: 300,
    unit: 'kg',
    status: 'PENDING',
    distance: 4.2,
    date: '2024-10-25'
  },
  {
    id: 'req-2',
    resource_id: 'res-2',
    farmer_id: 'farm-2',
    farmer_name: 'Green Acres Co.',
    resource_type: 'Compost',
    requested_quantity: 150,
    unit: 'kg',
    status: 'ACCEPTED',
    distance: 12.5,
    date: '2024-10-24'
  }
]

export default function ProviderRequestsPage() {
  const [requests, setRequests] = useState(INITIAL_REQUESTS)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleAccept = async (reqId: string) => {
    setLoadingId(reqId)
    // Simulate API call to acceptRequest
    setTimeout(() => {
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'ACCEPTED' } : r))
      setLoadingId(null)
    }, 800)
  }

  const handleReject = async (reqId: string) => {
    setLoadingId(reqId)
    // Simulate API call to rejectRequest
    setTimeout(() => {
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'REJECTED' } : r))
      setLoadingId(null)
    }, 800)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Incoming Requests</h1>
        <p className="text-gray-600 mt-1">Review and manage requests from farmers for your resources.</p>
      </div>

      <div className="space-y-6">
        {requests.map(req => (
          <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between md:items-center gap-6 transition-all hover:shadow-md">
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                  req.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                  req.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {req.status}
                </span>
                <span className="text-sm text-gray-500">{req.date}</span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900">
                {req.requested_quantity} {req.unit} of {req.resource_type}
              </h3>
              
              <div className="flex items-center gap-2 mt-3 text-gray-600">
                <div className="bg-gray-100 p-1.5 rounded-full">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <span className="font-medium text-gray-900">{req.farmer_name}</span>
                <span className="text-gray-400">•</span>
                <span>{req.distance} km away</span>
              </div>
            </div>

            {req.status === 'PENDING' && (
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => handleReject(req.id)}
                  disabled={loadingId === req.id}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-red-100 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
                <button 
                  onClick={() => handleAccept(req.id)}
                  disabled={loadingId === req.id}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {loadingId === req.id ? 'Processing...' : 'Accept'}
                </button>
              </div>
            )}
            
            {req.status === 'ACCEPTED' && (
              <div className="w-full md:w-auto text-center md:text-right">
                <p className="text-emerald-700 font-semibold mb-1">Match Confirmed!</p>
                <button className="text-sm text-emerald-600 hover:underline">View Contact Details</button>
              </div>
            )}
            
            {req.status === 'REJECTED' && (
              <div className="w-full md:w-auto text-center md:text-right text-gray-500 font-medium">
                Request Declined
              </div>
            )}
            
          </div>
        ))}
      </div>
    </div>
  )
}
