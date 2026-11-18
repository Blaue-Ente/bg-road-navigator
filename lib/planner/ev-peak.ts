/** Local calendar time of an instant in a zone. */
function localParts(iso: string, timeZone: string | null | undefined) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timeZone ?? undefined,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    weekday: get("weekday"),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/**
 * Hours when public chargers are usually busy: the commute peaks on weekdays
 * and the middle of the day on weekends, when many people are on the road.
 * A rule of thumb for advice, not a live reading of any charger.
 */
export function isPeakChargingTime(
  iso: string,
  timeZone?: string | null
): boolean {
  const local = localParts(iso, timeZone);
  if (!local) return false;
  const weekend = local.weekday === "Sat" || local.weekday === "Sun";
  const within = (from: number, to: number) =>
    local.minutes >= from && local.minutes < to;
  if (weekend) return within(10 * 60, 16 * 60);
  return within(7 * 60, 9 * 60 + 30) || within(16 * 60 + 30, 19 * 60 + 30);
}
