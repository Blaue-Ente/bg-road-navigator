export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  vehicle_type: "car" | "ev" | "truck" | "motorcycle";
  fuel_type: "diesel" | "petrol" | "lpg" | "electric";
  tank_capacity_liters: number | null;
  ev_range_km: number | null;
}
