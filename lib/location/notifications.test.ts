import { describe, expect, it } from "vitest";
import { notificationPrompt } from "@/lib/location/notifications";

describe("notification permission copy", () => {
  it("says notifications are allowed only after the browser grants them", () => {
    expect(notificationPrompt("granted").text).toBe("Известията са разрешени");
    expect(notificationPrompt("default").text).toBe(
      "Разреши известия на устройството"
    );
    expect(notificationPrompt("denied").text).toContain("настройките на браузъра");
    expect(notificationPrompt("denied").text).not.toContain("са разрешени");
  });
});
