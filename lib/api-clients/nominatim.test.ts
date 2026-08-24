import { describe, expect, it } from "vitest";
import { formatNominatimAddress, normalizeGeocodeQuery } from "@/lib/api-clients/nominatim";

describe("formatNominatimAddress", () => {
  it("prefers street and house number over the POI name", () => {
    const formatted = formatNominatimAddress({
      name: "София",
      display_name:
        "15, улица Патриарх Евтимий, София, 1000, България",
      address: {
        house_number: "15",
        road: "улица Патриарх Евтимий",
        city: "София",
        postcode: "1000",
        country: "България",
      },
    });
    expect(formatted.label).toBe("улица Патриарх Евтимий 15");
    expect(formatted.subtitle).toContain("София");
    expect(formatted.subtitle).toContain("1000");
    expect(formatted.subtitle).toContain("България");
  });

  it("falls back to a named place when there is no street", () => {
    const formatted = formatNominatimAddress({
      name: "München Hauptbahnhof",
      display_name: "München Hauptbahnhof, München, Bayern, Deutschland",
      address: {
        city: "München",
        country: "Deutschland",
      },
    });
    expect(formatted.label).toBe("München Hauptbahnhof");
    expect(formatted.subtitle).toContain("München");
  });

  it("uses the first display_name token when address parts are missing", () => {
    const formatted = formatNominatimAddress({
      display_name: "Karlovo, Пловдивска област, България",
    });
    expect(formatted.label).toBe("Karlovo");
    expect(formatted.subtitle).toContain("България");
  });
});

describe("normalizeGeocodeQuery", () => {
  it("strips Bulgarian street prefixes so house numbers match", () => {
    expect(normalizeGeocodeQuery("улица Патриарх Евтимий 15 София")).toBe(
      "Патриарх Евтимий 15 София"
    );
    expect(normalizeGeocodeQuery("ул. Витоша 1, София")).toBe("Витоша 1, София");
    expect(normalizeGeocodeQuery("бул. Витоша 1 София")).toBe("Витоша 1 София");
    expect(normalizeGeocodeQuery("село Белчин")).toBe("Белчин");
  });

  it("leaves queries without a prefix unchanged", () => {
    expect(normalizeGeocodeQuery("Marienplatz 1 München")).toBe(
      "Marienplatz 1 München"
    );
  });
});
