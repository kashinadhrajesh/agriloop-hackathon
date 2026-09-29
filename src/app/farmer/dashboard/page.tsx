import Link from 'next/link'
import { Search, ClipboardList, CheckCircle, Sprout, Map } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function FarmerDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: requests } = await supabase
    .from('requests')
    .select('*, resources(*)')
    .eq('farmer_id', user?.id)

  const activeRequests = requests?.filter((r: any) => r.status === 'pending') || []
  const confirmedMatches = requests?.filter((r: any) => r.status === 'accepted') || []

  const STATS = {
    activeRequests: activeRequests.length,
    confirmedMatches: confirmedMatches.length,
    totalReceived: '0 tonnes',
    carbonSaved: '0 kg'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Farmer Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your resource requests and matches.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <Link 
            href="/map" 
            className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            <Map className="w-5 h-5 text-emerald-600" />
            Live Map
          </Link>
          <Link 
            href="/farmer/search" 
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors font-medium shadow-sm"
          >
            <Search className="w-5 h-5" />
            Find New Resources
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Requests</p>
            <p className="text-2xl font-bold text-gray-900">{STATS.activeRequests}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Confirmed Matches</p>
            <p className="text-2xl font-bold text-gray-900">{STATS.confirmedMatches}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Received</p>
            <p className="text-2xl font-bold text-gray-900">{STATS.totalReceived}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Est. CO2 Saved</p>
            <p className="text-2xl font-bold text-gray-900">{STATS.carbonSaved}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Requests */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your Recent Requests</h2>
          <div className="space-y-4">
            {activeRequests.length > 0 ? activeRequests.map((req: any) => (
              <div key={req.id} className="border border-gray-100 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">Pending</span>
                    <p className="font-semibold text-gray-900">{req.resources?.title || 'Resource'}</p>
                  </div>
                  <p className="text-sm text-gray-600">Waiting for provider approval</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500">No active requests yet.</p>
            )}
          </div>
        </div>

        {/* Confirmed Matches */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Confirmed Matches (Ready for Pickup)</h2>
          <div className="space-y-4">
            {confirmedMatches.length > 0 ? confirmedMatches.map((req: any) => (
              <div key={req.id} className="border border-emerald-100 bg-emerald-50 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-emerald-200 text-emerald-900 text-xs px-2 py-1 rounded-full font-bold">Confirmed</span>
                    <p className="font-semibold text-gray-900">{req.resources?.title || 'Resource'}</p>
                  </div>
                  <p className="text-sm text-gray-700">Ready for pickup!</p>
                </div>
                <button className="flex items-center justify-center p-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700" title="View on Map">
                  <Map className="w-5 h-5" />
                </button>
              </div>
            )) : (
              <p className="text-sm text-gray-500">No confirmed matches yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Leaf(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 14 6a7 7 0 0 1 7 7v7h-7a7 7 0 0 1-3-10"/><path d="M14 6v14"/></svg>
}
