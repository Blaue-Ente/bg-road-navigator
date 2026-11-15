import { writeFileSync } from "node:fs";
import { corridorPolylines, CORRIDOR_BUFFER_KM } from "@/lib/hotspots/corridor";

const lines = corridorPolylines();
writeFileSync(
  "/tmp/hotspots/corridors.json",
  JSON.stringify({ buffer_km: CORRIDOR_BUFFER_KM, lines })
);
console.log(`corridors ${lines.length}`);
