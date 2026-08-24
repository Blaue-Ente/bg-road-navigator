import { describe, expect, it } from "vitest";
import {
  extractQueueWait,
  normalizeNakordoniMultiData,
} from "@/lib/api-clients/nakordoni";

describe("Nakordoni live payload", () => {
  it("reads wait times from data[ppid].queue", () => {
    const rows = normalizeNakordoniMultiData({
      id_390: {
        queue: {
          wait_min: 45,
          queue_now: 12,
          wait_status: "yellow",
          updated_at: "2026-08-24 04:45:22",
        },
      },
      id_384: {
        queue: {
          wait_min: 90,
          queue_now: 40,
          wait_status: "red",
        },
      },
    });

    expect(rows.map((row) => row.ppid)).toEqual(["id_390", "id_384"]);
    expect(extractQueueWait(rows[0]?.item)).toMatchObject({
      waitMinutes: 45,
      queueLength: 12,
      status: "yellow",
    });
    expect(extractQueueWait(rows[1]?.item).waitMinutes).toBe(90);
  });

  it("still accepts the older snapshot / items shapes", () => {
    const fromItems = normalizeNakordoniMultiData({
      items: [{ ppid: "id_484", snapshot: { wait_min: 20, queue_now: 5 } }],
    });
    expect(fromItems).toHaveLength(1);
    expect(extractQueueWait(fromItems[0]?.item).waitMinutes).toBe(20);

    const fromArray = normalizeNakordoniMultiData([
      { ppid: "id_289", wait_min: 15, queue_now: 3 },
    ]);
    expect(extractQueueWait(fromArray[0]?.item)).toMatchObject({
      waitMinutes: 15,
      queueLength: 3,
    });
  });
});
