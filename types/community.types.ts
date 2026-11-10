/**
 * BG Road Navigator — community types
 */

export type CommunityPinCategory =
  | "traffic_jam"
  | "accident"
  | "border_queue"
  | "rest_stop"
  | "shortcut"
  | "hotel"
  | "place_to_visit"
  | "police"
  | "road_works"
  | "other";

export interface CommunityPin {
  id: string;
  user_id?: string | null;
  category: CommunityPinCategory;
  title: string;
  description: string | null;
  text?: string | null;
  coords: { lng: number; lat: number };
  photo_url?: string | null;
  is_verified: boolean;
  upvotes: number;
  gone_count?: number;
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
