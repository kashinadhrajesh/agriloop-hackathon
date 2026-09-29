import { createClient } from '../supabase/client'

// Valid status transitions for resources
export const RESOURCE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  REQUESTED: 'REQUESTED',
  RESERVED: 'RESERVED',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  UNAVAILABLE: 'UNAVAILABLE'
}

// Valid status transitions for requests
export const REQUEST_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
}

export async function createRequest(resourceId: string, farmerId: string, providerId: string, quantity: number, message: string = '') {
  const supabase = createClient()
  
  // 1. Create the request
  const { data: request, error: reqError } = await supabase
    .from('requests')
    .insert([
      { 
        resource_id: resourceId, 
        farmer_id: farmerId, 
        provider_id: providerId, 
        requested_quantity: quantity,
        message,
        status: REQUEST_STATUS.PENDING 
      }
    ])
    .select()
    .single()

  if (reqError) throw reqError

  // 2. Update resource status to REQUESTED
  const { error: resError } = await supabase
    .from('resources')
    .update({ status: RESOURCE_STATUS.REQUESTED, updated_at: new Date().toISOString() })
    .eq('id', resourceId)

  if (resError) throw resError

  // 3. Create notification for provider
  await supabase.from('notifications').insert([
    {
      user_id: providerId,
      title: 'New Resource Request',
      message: `You received a new request for ${quantity} of your resource.`,
      type: 'REQUEST_RECEIVED'
    }
  ])

  return request
}

export async function acceptRequest(requestId: string, resourceId: string, farmerId: string) {
  const supabase = createClient()
  
  // 1. Update request status
  const { error: reqError } = await supabase
    .from('requests')
    .update({ status: REQUEST_STATUS.ACCEPTED, updated_at: new Date().toISOString() })
    .eq('id', requestId)

  if (reqError) throw reqError

  // 2. Update resource status to RESERVED/CONFIRMED
  const { error: resError } = await supabase
    .from('resources')
    .update({ status: RESOURCE_STATUS.RESERVED, updated_at: new Date().toISOString() })
    .eq('id', resourceId)

  if (resError) throw resError

  // 3. Create notification for farmer
  await supabase.from('notifications').insert([
    {
      user_id: farmerId,
      title: 'Request Accepted',
      message: `Your request was accepted! The resource is now reserved for you.`,
      type: 'REQUEST_ACCEPTED'
    }
  ])

  return true
}

export async function rejectRequest(requestId: string, resourceId: string, farmerId: string) {
  const supabase = createClient()
  
  // 1. Update request status
  const { error: reqError } = await supabase
    .from('requests')
    .update({ status: REQUEST_STATUS.REJECTED, updated_at: new Date().toISOString() })
    .eq('id', requestId)

  if (reqError) throw reqError

  // 2. Revert resource status back to AVAILABLE
  const { error: resError } = await supabase
    .from('resources')
    .update({ status: RESOURCE_STATUS.AVAILABLE, updated_at: new Date().toISOString() })
    .eq('id', resourceId)

  if (resError) throw resError

  // 3. Create notification for farmer
  await supabase.from('notifications').insert([
    {
      user_id: farmerId,
      title: 'Request Rejected',
      message: `Unfortunately, the provider was unable to accept your request.`,
      type: 'REQUEST_REJECTED'
    }
  ])

  return true
}
