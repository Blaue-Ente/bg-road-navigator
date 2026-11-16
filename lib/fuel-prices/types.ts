export type PriceFuel = "diesel" | "petrol" | "lpg";

export interface PriceQuery {
  countryCode: string | null;
  fuel: PriceFuel;
  lat: number;
  lng: number;
}

export interface KnownPrice {
  amount: number;
  currency: "EUR";
  unit: "L";
  source: "e-control" | "tankerkoenig" | "nakordoni";
  observedAt: string;
  stationName: string | null;
  brand: string | null;
  lat: number;
  lng: number;
}

export interface PriceLookupResult {
  price: KnownPrice | null;
  /** Present whenever `price` is null. */
  reason: "price unknown" | null;
}

export interface PriceDeps {
  fetchImpl?: typeof fetch;
  now?: Date;
  tankerkoenigKey?: string | null;
}
