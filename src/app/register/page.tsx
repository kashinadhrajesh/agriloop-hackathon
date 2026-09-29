'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sprout } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'FARMER' | 'PROVIDER'>('FARMER')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          }
        }
      })

      if (authError) throw authError

      // Note: Supabase triggers can automatically insert into the users table, 
      // or we can do it manually if RLS permits. For MVP, assuming a trigger 
      if (authData.user) {
        const isFarmer = role === 'FARMER'
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            { 
              id: authData.user.id, 
              full_name: fullName,
              email: email,
              role: role,
              latitude: isFarmer ? 9.6031 : 9.7547,
              longitude: isFarmer ? 77.1615 : 77.1192,
              location_name: isFarmer ? 'Kumily, Kerala' : 'Kattappana, Kerala',
              location_mode: 'DEMO'
            }
          ])

        // If insert fails
        if (profileError && profileError.code !== '23505') { // 23505 = unique violation
          console.error('Profile creation error:', profileError)
          setError('Failed to create profile: ' + profileError.message)
          setLoading(false)
          return
        }
        
        // Redirect to login or dashboard
        router.push('/login?message=Registration successful, please log in.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
            <Sprout className="h-6 w-6 text-emerald-700" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
              sign in to existing account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('FARMER')}
                  className={`py-3 px-4 rounded-md border-2 font-medium text-sm transition-colors ${
                    role === 'FARMER' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800' 
                      : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-200'
                  }`}
                >
                  Farmer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('PROVIDER')}
                  className={`py-3 px-4 rounded-md border-2 font-medium text-sm transition-colors ${
                    role === 'PROVIDER' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800' 
                      : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-200'
                  }`}
                >
                  Provider
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
