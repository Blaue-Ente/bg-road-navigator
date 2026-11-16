import { describe, expect, it } from "vitest";
import { catalog } from "@/lib/i18n/locale";
import { notificationPrompt } from "@/lib/location/notifications";

describe("notificationPrompt", () => {
  it("returns catalog codes instead of embedded Bulgarian text", () => {
    const granted = notificationPrompt("granted");
    expect(granted.code).toBe("granted");
    expect(catalog("bg").location.notifications[granted.code]).toBe(
      "Известията са разрешени"
    );

    const denied = notificationPrompt("denied");
    expect(catalog("en").location.notifications[denied.code]).toContain(
      "blocked"
    );
    expect(catalog("tr").location.notifications.denied).not.toMatch(
      /[А-Яа-я]/
    );

    expect(notificationPrompt("default").code).toBe("ask");
    expect(notificationPrompt("unsupported").code).toBe("unsupported");
  });
});