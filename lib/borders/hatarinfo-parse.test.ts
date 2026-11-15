import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { crossingIdForHatarinfoName } from "@/lib/constants/border-official-links";
import {
  HATARINFO_UNDER_15_MINUTES,
  parseHatarinfoHtml,
} from "@/lib/borders/hatarinfo-parse";

const html = readFileSync(
  new URL("./fixtures/hatarinfo-rs.html", import.meta.url),
  "utf8"
);

describe("parseHatarinfoHtml", () => {
  const panels = parseHatarinfoHtml(html);
  const byId = new Map(
    panels.map((panel) => [crossingIdForHatarinfoName(panel.name), panel])
  );

  it("reads every Serbian-section post in the fixture", () => {
    expect([...byId.keys()].sort()).toEqual(
      [
        "asotthalom",
        "bacsalmas",
        "bacsszentgyorgy",
        "hercegszanto",
        "horgos",
        "horgos-road",
        "kubehaza",
        "tiszasziget",
        "tompa",
      ].sort()
    );
  });

  it("keeps the Röszke motorway at 30 minutes both ways", () => {
    const motorway = byId.get("horgos");
    expect(motorway?.out).toMatchObject({ minutes: 30, band: "measured" });
    expect(motorway?.in).toMatchObject({ minutes: 30, band: "measured" });
    expect(motorway?.name).toContain("autópálya");
  });

  it("reads the Röszke road as 30 out and the under-15 ceiling in", () => {
    const road = byId.get("horgos-road");
    expect(road?.out).toMatchObject({ minutes: 30, band: "measured", raw: "30 perc" });
    expect(road?.in).toMatchObject({
      minutes: HATARINFO_UNDER_15_MINUTES,
      band: "under_15",
    });
    expect(road?.in?.raw.toLowerCase()).toContain("nincs 15 percet");
  });

  it("reads Tompa and Hercegszántó as the under-15 ceiling both ways", () => {
    for (const id of ["tompa", "hercegszanto"]) {
      const panel = byId.get(id);
      expect(panel?.out?.band).toBe("under_15");
      expect(panel?.in?.band).toBe("under_15");
      expect(panel?.out?.minutes).toBe(HATARINFO_UNDER_15_MINUTES);
      expect(panel?.in?.minutes).toBe(HATARINFO_UNDER_15_MINUTES);
    }
  });

  it("reads an hour-and-minute car wait from the szgk cell", () => {
    const parsed = parseHatarinfoHtml(`
      <div class="panel panel-primary">
        <span>Röszke - Horgoš autópálya-</span>
        <div class="panel-body">
          <div class="label">Várakozási idő Magyarország felől (ki):</div>
          <div><div class="szgk">1 óra 20 perc</div></div>
          <div class="label">Várakozási idő Magyarország felé (be):</div>
          <div>Nincs 15 percet meghaladó várakozás</div>
        </div>
      </div>
    `);
    expect(parsed[0]?.out).toMatchObject({ minutes: 80, band: "measured" });
    expect(parsed[0]?.in?.band).toBe("under_15");
  });
});
