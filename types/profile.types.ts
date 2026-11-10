export interface Profile {
  id: string;
  /** Same as display_name. Kept so older screens keep working. */
  username: string;
  display_name: string;
  home_city: string | null;
  usual_country: string | null;
  car: string | null;
  avatar_url: string | null;
  vehicle_type: "car" | "ev" | "truck" | "motorcycle";
  fuel_type: "diesel" | "petrol" | "lpg" | "electric";
  tank_capacity_liters: number | null;
  ev_range_km: number | null;
}
