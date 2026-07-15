/**
 * BG Road Navigator - Community Types
 */

// Community pin data
export interface CommunityPin {
  id: string;
  user_id?: string | null;
  category: "police" | "accident" | "hazard" | "road_works" | "traffic_jam" | "fuel_issue" | "border_info" | "rest_area" | "point_of_interest" | "other";
  title: string;
  description: string | null;
  coords: { lng: number; lat: number };
  is_verified: boolean;
  upvotes: number;
  expires_at: string | null;
  created_at: string;
}

// Pin comments
export interface PinComment {
  id: string;
  pin_id: string;
  body: string;
  created_at: string;
}

export interface CommunityState {
  pins: CommunityPin[];
  comments: PinComment[];
  selectedPin: CommunityPin | null;
}