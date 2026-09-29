// Mock Supabase Browser Client

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const cookies = document.cookie.split(';')
  for (let i = cookies.length - 1; i >= 0; i--) {
    const c = cookies[i].trim()
    if (c.startsWith(name + '=')) {
      return decodeURIComponent(c.substring(name.length + 1))
    }
  }
  return undefined
}

function getStoredUserId(): string | undefined {
  if (typeof window !== 'undefined') {
    try {
      const fromLocal = localStorage.getItem('mock_auth_user_id')
      if (fromLocal) return fromLocal
    } catch (e) {}
  }
  return getCookie('mock_auth_user_id')
}

function setStoredUserId(value: string) {
  if (typeof document !== 'undefined') {
    // Clear old cookies to prevent duplicates
    document.cookie = `mock_auth_user_id=; path=/; max-age=0`
    document.cookie = `mock_auth_user_id=${encodeURIComponent(value)}; path=/; max-age=86400; SameSite=Lax`
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('mock_auth_user_id', value)
    } catch (e) {}
  }
}

function clearStoredUserId() {
  if (typeof document !== 'undefined') {
    document.cookie = `mock_auth_user_id=; path=/; max-age=0`
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem('mock_auth_user_id')
    } catch (e) {}
  }
}

class MockQueryBuilder {
  private table: string
  private action: 'select' | 'insert' | 'update' = 'select'
  private selectQuery?: string
  private filters: Record<string, any> = {}
  private updateData?: any
  private insertData?: any
  private isSingle = false
  private orderOpt?: { col: string; ascending: boolean }

  constructor(table: string) {
    this.table = table
  }

  select(query: string = '*') {
    this.action = 'select'
    this.selectQuery = query
    return this
  }

  eq(column: string, value: any) {
    this.filters[column] = value
    return this
  }

  order(column: string, options: { ascending: boolean } = { ascending: true }) {
    this.orderOpt = { col: column, ascending: options.ascending }
    return this
  }

  insert(data: any) {
    this.action = 'insert'
    this.insertData = data
    return this
  }

  update(data: any) {
    this.action = 'update'
    this.updateData = data
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  async execute() {
    let payload: any = {}
    if (this.action === 'select') {
      payload = { table: this.table, filters: this.filters, select: this.selectQuery, order: this.orderOpt }
    } else if (this.action === 'insert') {
      payload = { table: this.table, data: this.insertData }
    } else if (this.action === 'update') {
      payload = { table: this.table, updates: this.updateData, filters: this.filters }
    }

    try {
      const res = await fetch('/api/mock-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: `db.${this.action}`,
          payload
        })
      })

      const json = await res.json()
      if (json.error) {
        return { data: null, error: json.error }
      }

      let data = json.data
      if (this.action === 'select' && this.isSingle) {
        data = Array.isArray(data) ? (data[0] || null) : data
      } else if (this.action === 'insert' && this.isSingle) {
        data = Array.isArray(data) ? data[0] : data
      }

      return { data, error: null }
    } catch (e: any) {
      return { data: null, error: { message: e?.message || 'Network error' } }
    }
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected)
  }
}

export function createClient() {
  return {
    auth: {
      async signUp({ email, password, options }: { email: string; password: string; options?: any }) {
        try {
          const res = await fetch('/api/mock-supabase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'auth.signUp',
              payload: { email, password, options }
            })
          })
          const json = await res.json()
          if (json.data?.user?.id) {
            setStoredUserId(json.data.user.id)
          }
          return json
        } catch (e: any) {
          return { data: { user: null }, error: { message: e?.message || 'Sign up failed' } }
        }
      },

      async signInWithPassword({ email, password }: { email: string; password: string }) {
        try {
          const res = await fetch('/api/mock-supabase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'auth.signIn',
              payload: { email, password }
            })
          })
          const json = await res.json()
          if (json.data?.user?.id) {
            setStoredUserId(json.data.user.id)
          }
          return json
        } catch (e: any) {
          return { data: { user: null }, error: { message: e?.message || 'Sign in failed' } }
        }
      },

      async getUser() {
        const userId = getStoredUserId()
        try {
          const res = await fetch('/api/mock-supabase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'auth.getUser',
              payload: { userId }
            })
          })
          return await res.json()
        } catch (e: any) {
          return { data: { user: null }, error: { message: e?.message } }
        }
      },

      async signOut() {
        clearStoredUserId()
        try {
          await fetch('/api/mock-supabase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'auth.signOut' })
          })
        } catch (e) {
          // Ignore
        }
        return { error: null }
      }
    },

    from(table: string) {
      return new MockQueryBuilder(table)
    }
  }
}
