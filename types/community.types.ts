/**
 * BG Road Navigator — community types
 */

export type CommunityPinCategory =
  | "police"
  | "accident"
  | "hazard"
  | "road_works"
  | "traffic_jam"
  | "fuel_issue"
  | "border_info"
  | "rest_area"
  | "point_of_interest"
  | "other";

export interface CommunityPin {
  id: string;
  user_id?: string | null;
  category: CommunityPinCategory;
  title: string;
  description: string | null;
  coords: { lng: number; lat: number };
  is_verified: boolean;
  upvotes: number;
  expires_at: string | null;
  created_at: string;
}

export interface PinComment {
  id: string;
  pin_id: string;
  user_id?: string | null;
  body: string;
  created_at: string;
}
