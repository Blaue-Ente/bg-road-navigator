import { describe, expect, it } from "vitest";
import { requestLocale } from "@/lib/i18n/request-locale";
import { LOCALE_COOKIE } from "@/lib/i18n/locale";

describe("requestLocale", () => {
  it("defaults to bg without a cookie", () => {
    expect(requestLocale(new Request("https://example.com"))).toBe("bg");
  });

  it("reads bg-road-locale from Cookie header", () => {
    const request = new Request("https://example.com", {
      headers: { cookie: `other=1; ${LOCALE_COOKIE}=tr; foo=bar` },
    });
    expect(requestLocale(request)).toBe("tr");
  });

  it("falls back to bg for unknown values", () => {
    const request = new Request("https://example.com", {
      headers: { cookie: `${LOCALE_COOKIE}=de` },
    });
    expect(requestLocale(request)).toBe("bg");
  });
});