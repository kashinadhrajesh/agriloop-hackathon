// Mock Supabase Server Client
import { cookies } from 'next/headers'
import {
  mockGetUser,
  mockSelect,
  mockInsert,
  mockUpdate
} from '@/lib/mock-db/store'

class MockServerQueryBuilder {
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
    try {
      if (this.action === 'select') {
        const res = mockSelect(this.table, this.filters, this.selectQuery, this.orderOpt)
        let data = res.data
        if (this.isSingle) {
          data = Array.isArray(data) ? (data[0] || null) : data
        }
        return { data, error: null }
      }

      if (this.action === 'insert') {
        const res = mockInsert(this.table, this.insertData)
        let data = res.data
        if (this.isSingle) {
          data = Array.isArray(data) ? data[0] : data
        }
        return { data, error: null }
      }

      if (this.action === 'update') {
        const res = mockUpdate(this.table, this.updateData, this.filters)
        return { data: res.data, error: null }
      }

      return { data: null, error: null }
    } catch (e: any) {
      return { data: null, error: { message: e?.message || 'Server error' } }
    }
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected)
  }
}

export function createClient() {
  const cookieStore = cookies()
  const userId = cookieStore.get('mock_auth_user_id')?.value

  return {
    auth: {
      async getUser() {
        return mockGetUser(userId)
      }
    },
    from(table: string) {
      return new MockServerQueryBuilder(table)
    }
  }
}
