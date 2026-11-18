"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, FileDown, Trash2 } from "lucide-react";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { WazeCard } from "@/components/ui/WazeCard";
import type { ChecklistRow } from "@/lib/db/checklists";
import { formatTemplate } from "@/lib/i18n/format-template";
import { makeTripPdf, pdfFilename, savePdfFile } from "@/lib/pdf/make-trip-pdf";
import { pdfGroupsWithChecks } from "@/lib/pdf/plan-pdf";
import { TripLedger } from "@/components/profile/TripLedger";

function progress(row: ChecklistRow): { done: number; total: number } {
  const ids = row.groups.flatMap((group) => group.items.map((item) => item.id));
  return {
    done: ids.filter((id) => row.checks[id] === true).length,
    total: ids.length,
  };
}

/** The checklists of planned trips, named by the date and the destination, with what is ready ticked off. */
export function MyChecklistsPanel() {
  const m = useMessages();
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-checklists"],
    queryFn: async () => {
      const response = await fetch("/api/checklists");
      if (!response.ok) throw new Error("checklists");
      return (await response.json()) as {
        checklists: ChecklistRow[];
        configured: boolean;
      };
    },
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["my-checklists"] });

  const tick = async (row: ChecklistRow, itemId: string, checked: boolean) => {
    const checks = { ...row.checks, [itemId]: checked };
    // Show the tick at once; the server copy follows.
    queryClient.setQueryData<{
      checklists: ChecklistRow[];
      configured: boolean;
    }>(["my-checklists"], (current) =>
      current
        ? {
            ...current,
            checklists: current.checklists.map((item) =>
              item.id === row.id ? { ...item, checks } : item
            ),
          }
        : current
    );
    const response = await fetch(`/api/checklists/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checks }),
    }).catch(() => null);
    if (!response?.ok) await refresh();
  };

  const remove = async (row: ChecklistRow) => {
    if (!window.confirm(m.profile.checklistsConfirmDelete)) return;
    const response = await fetch(`/api/checklists/${row.id}`, {
      method: "DELETE",
    }).catch(() => null);
    if (response?.ok) await refresh();
  };

  const download = async (row: ChecklistRow) => {
    const bytes = await makeTripPdf({
      title: row.title,
      subtitle: row.destination,
      intro: "",
      sections: [],
      overnight: [],
      closing: "",
      footnote: "",
      checklistTitle: row.title,
      checklistHint: m.pdf.checklistHint,
      checklist: pdfGroupsWithChecks(row.groups, row.checks),
    }).catch(() => null);
    if (bytes) {
      savePdfFile(
        bytes,
        pdfFilename(row.destination, row.depart_at ?? row.updated_at)
      );
    }
  };

  return (
    <WazeCard className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--waze-accent-text)]">
        {m.profile.checklistsTitle}
      </h2>
      {isLoading ? null : isError ? (
        <p className="text-sm text-[var(--waze-danger)]">
          {m.profile.checklistsLoadFailed}
        </p>
      ) : data && !data.configured ? (
        <p className="text-sm text-[var(--waze-text-secondary)]">
          {m.profile.checklistsNotReady}
        </p>
      ) : !data || data.checklists.length === 0 ? (
        <p className="text-sm text-[var(--waze-text-secondary)]">
          {m.profile.checklistsEmpty}
        </p>
      ) : (
        <ul className="space-y-2">
          {data.checklists.map((row) => {
            const count = progress(row);
            const open = openId === row.id;
            return (
              <li
                key={row.id}
                className="rounded-xl bg-[var(--waze-surface-elevated)] p-3"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : row.id)}
                  aria-expanded={open}
                  className="flex min-h-11 w-full items-center justify-between gap-2 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-[var(--waze-text)]">
                      {row.title}
                    </span>
                    <span className="block text-xs text-[var(--waze-text-secondary)]">
                      {formatTemplate(m.profile.checklistsProgress, {
                        done: String(count.done),
                        total: String(count.total),
                      })}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition ${open ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {open && (
                  <div className="mt-2 space-y-3">
                    {row.groups.map((group) => (
                      <div key={group.id}>
                        <h3 className="text-sm font-semibold text-[var(--waze-text)]">
                          {group.title}
                        </h3>
                        <ul className="mt-1 space-y-1">
                          {group.items.map((item) => (
                            <li key={item.id}>
                              <label className="flex min-h-11 items-start gap-3 text-sm text-[var(--waze-text)]">
                                <input
                                  type="checkbox"
                                  checked={row.checks[item.id] === true}
                                  onChange={(event) =>
                                    void tick(
                                      row,
                                      item.id,
                                      event.target.checked
                                    )
                                  }
                                  className="mt-1 h-5 w-5 shrink-0 accent-[var(--waze-accent)]"
                                />
                                <span>
                                  <span className="font-medium">
                                    {item.title}
                                  </span>
                                  {item.detail ? (
                                    <span className="block text-xs text-[var(--waze-text-secondary)]">
                                      {item.detail}
                                    </span>
                                  ) : null}
                                </span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <TripLedger
                      key={`${row.id}-${row.updated_at}`}
                      row={row}
                      onSaved={(log) =>
                        queryClient.setQueryData<{
                          checklists: ChecklistRow[];
                          configured: boolean;
                        }>(["my-checklists"], (current) =>
                          current
                            ? {
                                ...current,
                                checklists: current.checklists.map((item) =>
                                  item.id === row.id
                                    ? {
                                        ...item,
                                        trip_log: { ...item.trip_log, ...log },
                                      }
                                    : item
                                ),
                              }
                            : current
                        )
                      }
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void download(row)}
                        className="waze-btn-secondary inline-flex min-h-11 items-center gap-2 px-4 text-sm"
                      >
                        <FileDown className="h-4 w-4" aria-hidden />
                        {m.profile.checklistsDownload}
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(row)}
                        className="inline-flex min-h-11 items-center gap-2 px-3 text-sm text-[var(--waze-danger)]"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                        {m.profile.checklistsDelete}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </WazeCard>
  );
}
