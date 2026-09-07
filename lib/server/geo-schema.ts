import { z } from "zod";
import { EUROPE_BOUNDS } from "@/lib/geo/bounds";

export const EuropeLngSchema = z
  .number()
  .finite()
  .min(EUROPE_BOUNDS.minLng)
  .max(EUROPE_BOUNDS.maxLng);

export const EuropeLatSchema = z
  .number()
  .finite()
  .min(EUROPE_BOUNDS.minLat)
  .max(EUROPE_BOUNDS.maxLat);

export const EuropePointSchema = z.object({
  lng: EuropeLngSchema,
  lat: EuropeLatSchema,
});

export const EuropeBboxSchema = z
  .object({
    w: EuropeLngSchema,
    s: EuropeLatSchema,
    e: EuropeLngSchema,
    n: EuropeLatSchema,
  })
  .refine((b) => b.w < b.e && b.s < b.n, { message: "Invalid bbox order" })
  .refine((b) => b.e - b.w <= 25 && b.n - b.s <= 20, {
    message: "Bbox too large",
  });
