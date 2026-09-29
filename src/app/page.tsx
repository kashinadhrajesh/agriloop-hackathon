import Link from 'next/link'
import { Leaf, Search } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center pt-20 px-4 text-center">
      <div className="max-w-3xl space-y-8">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
          Turn Organic Waste Into <span className="text-emerald-600">Agricultural Value</span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          AgriLoop connects farmers looking for affordable organic resources with nearby providers who have usable biodegradable materials.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link 
            href="/search" 
            className="flex items-center gap-2 bg-emerald-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-emerald-800 transition-colors w-full sm:w-auto justify-center"
          >
            <Search className="w-5 h-5" />
            Find Resources
          </Link>
          <Link 
            href="/register" 
            className="flex items-center gap-2 bg-white text-emerald-700 border-2 border-emerald-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-emerald-50 transition-colors w-full sm:w-auto justify-center"
          >
            <Leaf className="w-5 h-5" />
            List a Resource
          </Link>
        </div>

        {/* Workflow Section */}
        <div className="pt-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xl mb-2">1</div>
              <h3 className="font-semibold text-gray-900">List</h3>
              <p className="text-sm text-gray-500">Providers list organic materials.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xl mb-2">2</div>
              <h3 className="font-semibold text-gray-900">Search</h3>
              <p className="text-sm text-gray-500">Farmers search for needed resources.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xl mb-2">3</div>
              <h3 className="font-semibold text-gray-900">Match</h3>
              <p className="text-sm text-gray-500">AgriLoop finds the best matches.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xl mb-2">4</div>
              <h3 className="font-semibold text-gray-900">Request</h3>
              <p className="text-sm text-gray-500">Farmer sends a request.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xl mb-2">5</div>
              <h3 className="font-semibold text-gray-900">Confirm</h3>
              <p className="text-sm text-gray-500">Provider accepts and confirms.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
