'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Leaf, LogOut, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUser(user)
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, location_name')
            .eq('id', user.id)
            .single()
          if (profile) {
            setUserRole(profile.role)
          } else {
            setUserRole(user.email?.includes('provider') ? 'PROVIDER' : 'FARMER')
          }
        } else {
          setCurrentUser(null)
          setUserRole(null)
        }
      } catch (e) {
        setCurrentUser(null)
      }
    }
    checkAuth()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
    setUserRole(null)
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-emerald-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-2">
            <Leaf className="h-6 w-6" />
            <Link href="/" className="font-bold text-xl tracking-tight">
              AgriLoop
            </Link>
          </div>
          <div className="flex items-center space-x-5">
            <Link href="/map" className="hover:text-emerald-200 font-medium transition-colors">
              Live Map
            </Link>
            <Link href="/impact" className="hover:text-emerald-200 font-medium transition-colors hidden sm:block">
              Impact
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link
                  href={userRole === 'PROVIDER' ? '/provider/dashboard' : '/farmer/dashboard'}
                  className="inline-flex items-center gap-1.5 bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-600 transition-colors"
                  title={currentUser.email}
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="capitalize">{userRole ? userRole.toLowerCase() : 'Dashboard'}</span>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors border border-white/20"
                  title="Sign out of current account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="hover:text-emerald-200 font-medium transition-colors">
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="bg-white text-emerald-700 px-4 py-2 rounded-md font-semibold hover:bg-emerald-50 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
