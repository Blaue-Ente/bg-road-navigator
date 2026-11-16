import { describe, expect, it } from "vitest";
import { preferenceBorderCrossings } from "@/lib/constants/preference-borders";
import { borderDisplayName } from "@/lib/constants/border-crossings";

describe("preferenceBorderCrossings", () => {
  it("includes Bulgarian, Serbia–Hungary and HU–RO posts", () => {
    const ids = preferenceBorderCrossings().map((row) => row.id);
    expect(ids).toContain("kalotina");
    expect(ids).toContain("horgos");
    expect(ids).toContain("nadlac");
    expect(ids).toContain("bors");
    expect(ids).toContain("danube-bridge-vidin");
  });

  it("localises Nădlac for Romanian", () => {
    const nadlac = preferenceBorderCrossings().find((row) => row.id === "nadlac");
    expect(nadlac).toBeDefined();
    expect(borderDisplayName("ro", nadlac!)).toBe("Nădlac II — Nădlac");
  });
});