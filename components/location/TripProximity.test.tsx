import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProximityBanner } from "@/components/location/TripProximity";

describe("proximity banner", () => {
  it("stays fixed above the plan sheet, clear of the top safe area", () => {
    const html = renderToStaticMarkup(
      <ProximityBanner
        text="След 400 м: участък с чести катастрофи. Карайте внимателно."
        onDismiss={() => undefined}
      />
    );
    expect(html).toContain("data-proximity-banner");
    expect(html).toContain("fixed");
    expect(html).toContain("z-[80]");
    expect(html).toContain("safe-area-inset-top");
    expect(html).toContain("След 400 м");
  });
});
