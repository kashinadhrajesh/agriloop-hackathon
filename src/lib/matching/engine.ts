import { calculateDistance } from '../distance/haversine';

export interface Resource {
  id: string;
  provider_id?: string;
  resource_type: string;
  quantity: number;
  latitude: number;
  longitude: number;
  available_from: string | Date;
  available_until: string | Date;
}

export interface SearchCriteria {
  resource_type: string;
  requested_quantity: number;
  max_distance_km: number;
  needed_by_date: string | Date;
  farmer_lat: number;
  farmer_lon: number;
}

export interface MatchResult extends Resource {
  distance_km: number;
  match_score: number;
}

/**
 * Deterministic AgriLoop Matching Engine
 * Weights:
 * 40% Resource Type
 * 30% Distance
 * 20% Quantity Fit
 * 10% Availability
 */
export function calculateMatchScore(resource: Resource, search: SearchCriteria): MatchResult {
  // 1. Type Score (40%)
  const typeScore = resource.resource_type.toLowerCase() === search.resource_type.toLowerCase() ? 100 : 0;
  
  // 2. Distance Score (30%)
  const distance = calculateDistance(
    search.farmer_lat, 
    search.farmer_lon, 
    resource.latitude, 
    resource.longitude
  );
  
  let distanceScore = 0;
  if (distance <= search.max_distance_km) {
    // Closer is better. 0km = 100, max_distance = 0
    distanceScore = 100 - ((distance / search.max_distance_km) * 100);
    // Ensure no negative scores just in case
    distanceScore = Math.max(0, distanceScore);
  }

  // 3. Quantity Score (20%)
  let quantityScore = 0;
  if (resource.quantity >= search.requested_quantity) {
    quantityScore = 100; // Perfect match or abundance
  } else {
    // Partial score if they have less than requested
    quantityScore = (resource.quantity / search.requested_quantity) * 100;
  }

  // 4. Availability Score (10%)
  let availabilityScore = 0;
  const neededDate = new Date(search.needed_by_date).getTime();
  const availableFrom = new Date(resource.available_from).getTime();
  const availableUntil = new Date(resource.available_until).getTime();

  if (neededDate >= availableFrom && neededDate <= availableUntil) {
    availabilityScore = 100;
  } else if (neededDate >= availableFrom) {
    // It's available, but perhaps the 'until' date is missing or already passed (edge cases)
    availabilityScore = 50; 
  } else {
    // Not available yet
    availabilityScore = 0;
  }

  // Final deterministic calculation
  const finalScore = 
    (typeScore * 0.40) + 
    (distanceScore * 0.30) + 
    (quantityScore * 0.20) + 
    (availabilityScore * 0.10);

  return {
    ...resource,
    distance_km: Number(distance.toFixed(1)),
    match_score: Math.round(finalScore)
  };
}

/**
 * Filter and sort a list of resources based on the matching engine.
 */
export function getMatchingResources(resources: Resource[], search: SearchCriteria): MatchResult[] {
  return resources
    .map(r => calculateMatchScore(r, search))
    // Optionally filter out absolute garbage matches, e.g., wrong type or too far
    .filter(r => r.distance_km <= search.max_distance_km && r.match_score >= 40)
    .sort((a, b) => b.match_score - a.match_score);
}
