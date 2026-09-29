import Link from 'next/link'
import { Plus, Edit2, Trash2, EyeOff } from 'lucide-react'

// Dummy data for MVP layout
const LISTINGS = [
  {
    id: '1',
    type: 'Vegetable Waste',
    quantity: 500,
    unit: 'kg',
    status: 'AVAILABLE',
    added_at: '2024-10-25'
  },
  {
    id: '2',
    type: 'Cow Dung',
    quantity: 200,
    unit: 'kg',
    status: 'RESERVED',
    added_at: '2024-10-24'
  },
  {
    id: '3',
    type: 'Fruit Waste',
    quantity: 300,
    unit: 'kg',
    status: 'AVAILABLE',
    added_at: '2024-10-22'
  }
]

export default function ProviderResourcesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Listings</h1>
          <p className="text-gray-600 mt-1">Manage the organic resources you are providing.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <Link 
            href="/provider/resources/new" 
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Resource
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Added
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {LISTINGS.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{listing.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {listing.quantity} {listing.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      listing.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 
                      listing.status === 'RESERVED' ? 'bg-amber-100 text-amber-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {listing.added_at}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-3">
                      <button className="text-gray-400 hover:text-gray-900" title="Mark Unavailable">
                        <EyeOff className="w-4 h-4" />
                      </button>
                      <button className="text-blue-400 hover:text-blue-900" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="text-red-400 hover:text-red-900" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
