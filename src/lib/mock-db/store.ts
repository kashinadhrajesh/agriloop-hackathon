import fs from 'fs'
import path from 'path'

export interface MockUser {
  id: string
  email: string
  password?: string
  full_name: string
  role: 'FARMER' | 'PROVIDER'
  latitude?: number
  longitude?: number
  location_name?: string
  location_mode?: 'REAL' | 'DEMO'
  created_at: string
  updated_at?: string
}

export interface MockResource {
  id: string
  provider_id: string
  title: string
  description?: string
  quantity: number
  unit: string
  resource_type: string
  location?: string
  latitude?: number
  longitude?: number
  available_from?: string
  available_until?: string
  status: string
  created_at: string
  updated_at?: string
}

export interface MockRequest {
  id: string
  resource_id: string
  farmer_id: string
  provider_id: string
  requested_quantity?: number
  message?: string
  status: string
  created_at: string
  updated_at?: string
  resources?: MockResource | null
  farmer?: { full_name: string } | null
}

export interface MockNotification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  created_at: string
}

export interface MockDB {
  users: MockUser[]
  resources: MockResource[]
  requests: MockRequest[]
  notifications: MockNotification[]
}

const DB_DIR = path.join(process.cwd(), '.mock-data')
const DB_FILE = path.join(DB_DIR, 'mock_db.json')

function getInitialDB(): MockDB {
  return {
    users: [
      {
        id: 'seed-farmer-1',
        email: 'farmer@demo.com',
        password: 'Password123!',
        full_name: 'Demo Farmer',
        role: 'FARMER',
        latitude: 9.6031,
        longitude: 77.1615,
        location_name: 'Kumily, Kerala',
        location_mode: 'DEMO',
        created_at: new Date().toISOString()
      },
      {
        id: 'seed-provider-1',
        email: 'provider@demo.com',
        password: 'Password123!',
        full_name: 'Green Valley Canteen',
        role: 'PROVIDER',
        latitude: 9.7547,
        longitude: 77.1192,
        location_name: 'Kattappana, Kerala',
        location_mode: 'DEMO',
        created_at: new Date().toISOString()
      },
      {
        id: 'seed-farmer-agriloop',
        email: 'farmer@agriloop.demo',
        password: 'Password123!',
        full_name: 'Demo Farmer',
        role: 'FARMER',
        latitude: 9.6031,
        longitude: 77.1615,
        location_name: 'Kumily, Kerala',
        location_mode: 'DEMO',
        created_at: new Date().toISOString()
      },
      {
        id: 'seed-provider-agriloop',
        email: 'provider@agriloop.demo',
        password: 'Password123!',
        full_name: 'Demo Provider',
        role: 'PROVIDER',
        latitude: 9.7547,
        longitude: 77.1192,
        location_name: 'Kattappana, Kerala',
        location_mode: 'DEMO',
        created_at: new Date().toISOString()
      }
    ],
    resources: [
      {
        id: 'seed-res-1',
        provider_id: 'seed-provider-agriloop',
        title: '500 kg of Vegetable Waste',
        resource_type: 'Vegetable Waste',
        quantity: 500,
        unit: 'kg',
        location: 'Kumily Market Collection Center',
        latitude: 9.6050,
        longitude: 77.1630,
        available_from: '2024-01-01',
        available_until: '2099-12-31',
        status: 'available',
        created_at: new Date().toISOString()
      },
      {
        id: 'seed-res-2',
        provider_id: 'seed-provider-agriloop',
        title: '300 kg of Cow Dung',
        resource_type: 'Cow Dung',
        quantity: 300,
        unit: 'kg',
        location: 'High Range Dairy, Kattappana',
        latitude: 9.7547,
        longitude: 77.1192,
        available_from: '2024-01-01',
        available_until: '2099-12-31',
        status: 'available',
        created_at: new Date().toISOString()
      },
      {
        id: 'seed-res-3',
        provider_id: 'seed-provider-agriloop',
        title: '500 kg of Crop Residue',
        resource_type: 'Crop Residue',
        quantity: 500,
        unit: 'kg',
        location: 'Kattappana Agro Supply',
        latitude: 9.7580,
        longitude: 77.1230,
        available_from: '2024-01-01',
        available_until: '2099-12-31',
        status: 'available',
        created_at: new Date().toISOString()
      }
    ],
    requests: [],
    notifications: []
  }
}

export function readDB(): MockDB {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true })
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDB()
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8')
      return initial
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8')
    const db: MockDB = JSON.parse(content)

    // Ensure all users have location info
    let updated = false
    for (const user of db.users) {
      if (user.latitude == null || user.longitude == null || !user.location_name) {
        const isFarmer = user.role === 'FARMER'
        user.latitude = isFarmer ? 9.6031 : 9.7547
        user.longitude = isFarmer ? 77.1615 : 77.1192
        user.location_name = isFarmer ? 'Kumily, Kerala' : 'Kattappana, Kerala'
        user.location_mode = user.location_mode || 'DEMO'
        updated = true
      }
    }

    // Ensure demo accounts exist
    const demoFarmer = db.users.find(u => u.email.toLowerCase() === 'farmer@agriloop.demo')
    if (!demoFarmer) {
      db.users.push({
        id: 'seed-farmer-agriloop',
        email: 'farmer@agriloop.demo',
        password: 'Password123!',
        full_name: 'Demo Farmer',
        role: 'FARMER',
        latitude: 9.6031,
        longitude: 77.1615,
        location_name: 'Kumily, Kerala',
        location_mode: 'DEMO',
        created_at: new Date().toISOString()
      })
      updated = true
    }

    const demoProvider = db.users.find(u => u.email.toLowerCase() === 'provider@agriloop.demo')
    if (!demoProvider) {
      db.users.push({
        id: 'seed-provider-agriloop',
        email: 'provider@agriloop.demo',
        password: 'Password123!',
        full_name: 'Demo Provider',
        role: 'PROVIDER',
        latitude: 9.7547,
        longitude: 77.1192,
        location_name: 'Kattappana, Kerala',
        location_mode: 'DEMO',
        created_at: new Date().toISOString()
      })
      updated = true
    }

    // Ensure seed-res-3 (Crop Residue 500kg in Kattappana) exists
    if (!db.resources.find(r => r.resource_type === 'Crop Residue')) {
      db.resources.push({
        id: 'seed-res-3',
        provider_id: 'seed-provider-agriloop',
        title: '500 kg of Crop Residue',
        resource_type: 'Crop Residue',
        quantity: 500,
        unit: 'kg',
        location: 'Kattappana Agro Supply',
        latitude: 9.7580,
        longitude: 77.1230,
        available_from: '2024-01-01',
        available_until: '2099-12-31',
        status: 'available',
        created_at: new Date().toISOString()
      })
      updated = true
    }

    if (updated) {
      writeDB(db)
    }

    return db
  } catch (e) {
    console.error('Error reading mock DB:', e)
    return getInitialDB()
  }
}

export function writeDB(db: MockDB) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true })
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8')
  } catch (e) {
    console.error('Error writing mock DB:', e)
  }
}

export function mockSignUp(email: string, password: string, options?: any) {
  const db = readDB()
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (existing) {
    return { data: { user: null }, error: { message: 'User already registered' } }
  }
  const role = options?.data?.role || 'FARMER'
  const fullName = options?.data?.full_name || 'Anonymous User'
  const isFarmer = role === 'FARMER'

  const user: MockUser = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    email,
    password,
    full_name: fullName,
    role,
    latitude: options?.data?.latitude ?? (isFarmer ? 9.6031 : 9.7547),
    longitude: options?.data?.longitude ?? (isFarmer ? 77.1615 : 77.1192),
    location_name: options?.data?.location_name ?? (isFarmer ? 'Kumily, Kerala' : 'Kattappana, Kerala'),
    location_mode: options?.data?.location_mode ?? 'DEMO',
    created_at: new Date().toISOString()
  }
  db.users.push(user)
  writeDB(db)
  return { data: { user, session: { user, access_token: 'mock-token-' + user.id } }, error: null }
}

export function mockSignIn(email: string, password?: string) {
  const db = readDB()
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (!user) {
    return { data: { user: null }, error: { message: 'Invalid login credentials' } }
  }
  if (password && user.password && user.password !== password) {
    return { data: { user: null }, error: { message: 'Invalid login credentials' } }
  }
  return { data: { user, session: { user, access_token: 'mock-token-' + user.id } }, error: null }
}

export function mockGetUser(userId?: string) {
  if (!userId) return { data: { user: null }, error: null }
  const db = readDB()
  const user = db.users.find(u => u.id === userId) || null
  return { data: { user }, error: null }
}

export function mockSelect(table: string, filters: Record<string, any> = {}, selectQuery?: string, orderOpt?: { col: string; ascending: boolean }) {
  const db = readDB()
  let list: any[] = []
  if (table === 'users' || table === 'profiles') list = [...db.users]
  else if (table === 'resources') list = [...db.resources]
  else if (table === 'requests') list = [...db.requests]
  else if (table === 'notifications') list = [...db.notifications]

  // Filter
  list = list.filter(item => {
    for (const [key, val] of Object.entries(filters)) {
      if (val !== undefined && item[key] !== val) {
        return false
      }
    }
    return true
  })

  // Order
  if (orderOpt) {
    list.sort((a, b) => {
      const valA = a[orderOpt.col]
      const valB = b[orderOpt.col]
      if (valA === valB) return 0
      if (orderOpt.ascending) return valA > valB ? 1 : -1
      return valA < valB ? 1 : -1
    })
  }

  // Joins if table === 'requests'
  if (table === 'requests') {
    list = list.map(req => {
      const res = db.resources.find(r => r.id === req.resource_id) || null
      const farmer = db.users.find(u => u.id === req.farmer_id) || null
      return {
        ...req,
        resources: res,
        farmer: farmer ? { full_name: farmer.full_name } : null
      }
    })
  }

  return { data: list, error: null }
}

export function mockInsert(table: string, data: any) {
  const db = readDB()
  const items = Array.isArray(data) ? data : [data]
  const inserted: any[] = []

  for (const item of items) {
    const newItem = {
      id: item.id || (table + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)),
      created_at: item.created_at || new Date().toISOString(),
      ...item
    }

    if (table === 'users' || table === 'profiles') {
      const idx = db.users.findIndex(u => u.id === newItem.id)
      if (idx >= 0) {
        db.users[idx] = { ...db.users[idx], ...newItem }
        inserted.push(db.users[idx])
      } else {
        db.users.push(newItem)
        inserted.push(newItem)
      }
    } else if (table === 'resources') {
      db.resources.unshift(newItem)
      inserted.push(newItem)
    } else if (table === 'requests') {
      db.requests.unshift(newItem)
      inserted.push(newItem)
    } else if (table === 'notifications') {
      db.notifications.unshift(newItem)
      inserted.push(newItem)
    }
  }

  writeDB(db)
  return { data: Array.isArray(data) ? inserted : inserted[0], error: null }
}

export function mockUpdate(table: string, updates: Record<string, any>, filters: Record<string, any>) {
  const db = readDB()
  let targetList: any[] = []
  if (table === 'resources') targetList = db.resources
  else if (table === 'requests') targetList = db.requests
  else if (table === 'users' || table === 'profiles') targetList = db.users
  else if (table === 'notifications') targetList = db.notifications

  let count = 0
  for (const item of targetList) {
    let match = true
    for (const [k, v] of Object.entries(filters)) {
      if (item[k] !== v) {
        match = false
        break
      }
    }
    if (match) {
      Object.assign(item, updates, { updated_at: new Date().toISOString() })
      count++
    }
  }

  writeDB(db)
  return { data: count, error: null }
}
