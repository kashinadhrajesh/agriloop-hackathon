'use client'

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts'
import { Leaf, Users, Sprout, Handshake } from 'lucide-react'

// Dummy data for MVP Impact statistics
const STATS = {
  totalListed: '4,500 kg',
  totalReused: '3,200 kg',
  successfulMatches: 45,
  activeUsers: 120,
}

const CATEGORY_DATA = [
  { name: 'Vegetable Waste', amount: 1200 },
  { name: 'Cow Dung', amount: 800 },
  { name: 'Crop Residue', amount: 600 },
  { name: 'Compost', amount: 400 },
  { name: 'Fruit Waste', amount: 200 },
]

const USER_SPLIT_DATA = [
  { name: 'Farmers', value: 75 },
  { name: 'Providers', value: 45 },
]

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0']
const PIE_COLORS = ['#059669', '#f59e0b']

export default function ImpactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Our Environmental Impact</h1>
        <p className="text-xl text-gray-600">
          See how the AgriLoop community is turning organic waste into valuable agricultural resources.
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            <Leaf className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{STATS.totalListed}</p>
          <p className="text-gray-500 font-medium">Total Material Listed</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            <Sprout className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-600 mb-1">{STATS.totalReused}</p>
          <p className="text-gray-500 font-medium">Successfully Reused</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            <Handshake className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{STATS.successfulMatches}</p>
          <p className="text-gray-500 font-medium">Matches Confirmed</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{STATS.activeUsers}</p>
          <p className="text-gray-500 font-medium">Active Community Members</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Bar Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Organic Resources Reused (kg)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CATEGORY_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="amount" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Community Distribution</h2>
          <div className="h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={USER_SPLIT_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {USER_SPLIT_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
      
      {/* Call to action */}
      <div className="mt-12 bg-emerald-700 rounded-2xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Ready to make an impact?</h2>
        <p className="text-emerald-100 mb-6 max-w-2xl mx-auto">
          Whether you have organic waste to provide or need affordable resources for your farm, joining AgriLoop makes a tangible difference to our environment.
        </p>
        <button className="bg-white text-emerald-700 px-6 py-3 rounded-lg font-bold hover:bg-emerald-50 transition-colors">
          Join the Platform Today
        </button>
      </div>
    </div>
  )
}
