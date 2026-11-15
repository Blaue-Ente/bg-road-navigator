import { describe, expect, it } from "vitest";
import {
  parseLocationPreference,
  serializeLocationPreference,
  shouldWatchLocation,
} from "@/lib/location/preference";
import {
  DEFAULT_TRIP_PREFERENCES,
  resolveTripPreferences,
} from "@/lib/planner/preferences";

describe("location settings", () => {
  it("stays off until the toggle is turned on", () => {
    expect(DEFAULT_TRIP_PREFERENCES.location_opt_in).toBe(false);
    expect(parseLocationPreference(null).location_opt_in).toBe(false);
    expect(resolveTripPreferences({}).location_opt_in).toBe(false);
    expect(
      shouldWatchLocation({ locationOptIn: false, tripActive: true })
    ).toBe(false);
    expect(
      shouldWatchLocation({ locationOptIn: true, tripActive: false })
    ).toBe(false);

    const turnedOn = resolveTripPreferences({
      location_opt_in: true,
      notifications_opt_in: true,
      alert_radius_m: 800,
    });
    expect(turnedOn.location_opt_in).toBe(true);
    expect(turnedOn.notifications_opt_in).toBe(true);
    expect(turnedOn.alert_radius_m).toBe(800);
    expect(shouldWatchLocation({ locationOptIn: true, tripActive: true })).toBe(
      true
    );

    const stored = parseLocationPreference(
      serializeLocationPreference({
        location_opt_in: true,
        notifications_opt_in: false,
        alert_radius_m: 800,
      })
    );
    expect(stored.location_opt_in).toBe(true);
    expect(stored.alert_radius_m).toBe(800);
  });
});
