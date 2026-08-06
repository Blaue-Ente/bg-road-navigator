"use client";

/**
 * Comments UI placeholder until Phase 2 wires pin_comments API.
 * Avoids fake local-only persistence that looks like it worked.
 */
export function CommentThread({ pinId }: { pinId: string }) {
  void pinId;
  return (
    <div className="waze-panel p-3 text-sm text-[var(--waze-text-muted)]">
      Коментарите към сигналите идват скоро. Засега ползвайте гласуване и
      докладване.
    </div>
  );
}
