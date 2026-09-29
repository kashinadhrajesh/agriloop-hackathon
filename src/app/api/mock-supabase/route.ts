import { NextRequest, NextResponse } from 'next/server'
import {
  mockSignUp,
  mockSignIn,
  mockGetUser,
  mockSelect,
  mockInsert,
  mockUpdate
} from '@/lib/mock-db/store'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, payload } = body

    if (action === 'auth.signUp') {
      const { email, password, options } = payload
      const result = mockSignUp(email, password, options)
      const res = NextResponse.json(result)
      if (result.data?.user?.id) {
        res.cookies.set('mock_auth_user_id', result.data.user.id, { path: '/', httpOnly: false })
      }
      return res
    }

    if (action === 'auth.signIn') {
      const { email, password } = payload
      const result = mockSignIn(email, password)
      const res = NextResponse.json(result)
      if (result.data?.user?.id) {
        res.cookies.set('mock_auth_user_id', result.data.user.id, { path: '/', httpOnly: false })
      }
      return res
    }

    if (action === 'auth.getUser') {
      const userId = payload?.userId || req.cookies.get('mock_auth_user_id')?.value
      const result = mockGetUser(userId)
      return NextResponse.json(result)
    }

    if (action === 'auth.signOut') {
      const res = NextResponse.json({ error: null })
      res.cookies.delete('mock_auth_user_id')
      return res
    }

    if (action === 'db.select') {
      const { table, filters, select, order } = payload
      const result = mockSelect(table, filters, select, order)
      return NextResponse.json(result)
    }

    if (action === 'db.insert') {
      const { table, data } = payload
      const result = mockInsert(table, data)
      return NextResponse.json(result)
    }

    if (action === 'db.update') {
      const { table, updates, filters } = payload
      const result = mockUpdate(table, updates, filters)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: { message: `Unknown action: ${action}` } }, { status: 400 })
  } catch (err: any) {
    console.error('Mock Supabase Route Error:', err)
    return NextResponse.json({ error: { message: err?.message || 'Server error' } }, { status: 500 })
  }
}
