import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MapIcon, SearchIcon } from "@/components/icons/NavIcons";

describe("nav icons", () => {
  it("keeps SearchIcon at 20px when the class name drops the size utility", () => {
    const html = renderToStaticMarkup(
      <SearchIcon className="shrink-0 text-[var(--waze-accent-text)]" />
    );

    expect(html).toContain('width="20"');
    expect(html).toContain('height="20"');
    expect(html).toContain("width:20px");
    expect(html).toContain("height:20px");
    expect(html).not.toContain("width:100%");
  });

  it("gives other icons an explicit pixel box", () => {
    const html = renderToStaticMarkup(<MapIcon size={20} className="shrink-0" />);
    expect(html).toContain('width="20"');
    expect(html).toContain("height:20px");
  });
});
