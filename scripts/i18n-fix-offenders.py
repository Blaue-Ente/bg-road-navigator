#!/usr/bin/env python3
"""Last-mile: move remaining single-line Cyrillic UI into bgRest and patch TSX."""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CYR = re.compile(r"[\u0400-\u04FF]")
ALLOWLIST = {"components/location/TripProximity.test.tsx", "components/ui/CountryFlag.tsx"}


def ns_for(rel: str) -> str:
    if rel.startswith("app/(app)/") and rel.endswith("/page.tsx"):
        return rel.split("/")[2] + "Page"
    if rel.startswith("app/(auth)/"):
        return "authPage"
    parts = rel.split("/")
    return parts[1] if len(parts) > 1 else "misc"


def key_for(text: str) -> str:
    h = hashlib.sha1(text.encode()).hexdigest()[:8]
    return f"k{h}"


def collect_tsx() -> list[str]:
    out: list[str] = []
    for base in (ROOT / "app", ROOT / "components"):
        for p in base.rglob("*.tsx"):
            rel = p.relative_to(ROOT).as_posix()
            if rel in ALLOWLIST:
                continue
            out.append(rel)
    return out


def load_rest() -> dict:
    path = ROOT / "lib/i18n/locales/bg-rest.ts"
    text = path.read_text(encoding="utf-8")
    start = text.index("= {") + 2
    end = text.rindex("} as const")
    blob = "x" + text[start : end + 1]
    return json.loads(blob.replace("x", ""))


def save_rest(rest: dict) -> None:
    path = ROOT / "lib/i18n/locales/bg-rest.ts"
    body = json.dumps(rest, ensure_ascii=False, indent=2)
    # re-indent as TS object
    lines = ["/** Additional UI + planner copy (Bulgarian). Merged into `bg`. */", "export const bgRest = "]
    def emit(obj, indent=0):
        sp = "  " * indent
        rows = [sp + "{"]
        for k, v in obj.items():
            if isinstance(v, dict):
                rows.append(f'{sp}  {k}: {emit(v, indent+1)},')
            else:
                rows.append(f'{sp}  {k}: {json.dumps(v, ensure_ascii=False)},')
        rows.append(sp + "}")
        return "\n".join(rows)
    content = emit(rest) + " as const;\n"
    path.write_text(
        "/** Additional UI + planner copy (Bulgarian). Merged into `bg`. */\n"
        f"export const bgRest = {body} as const;\n",
        encoding="utf-8",
    )


def ensure_client(text: str) -> str:
    if '"use client"' not in text:
        text = '"use client";\n\n' + text
    imp = 'import { useMessages } from "@/components/i18n/LocaleProvider";\n'
    if imp not in text:
        text = text.replace('"use client";\n\n', '"use client";\n\n' + imp, 1)
    return text


def ensure_hook_in_fn(block: str) -> str:
    if "useMessages()" in block:
        return block
    return re.sub(
        r"(\{)\n",
        r"\1\n  const m = useMessages();\n",
        block,
        count=1,
    )


def main() -> None:
    rest = {}
    rest_path = ROOT / "lib/i18n/locales/bg-rest.ts"
    raw = rest_path.read_text(encoding="utf-8")
    # parse existing nested object shallow by re-running migrate output - use json from migrate
    # fallback: start empty rest dict loaded from file via regex values only
    rest = json.loads(
        (ROOT / "scripts/i18n-string-index.json").read_text(encoding="utf-8")
        if False
        else "{}"
    )
    # load current bgRest by executing node instead
    import subprocess

    out = subprocess.check_output(
        [
            "node",
            "-e",
            "const {bgRest}=require('./lib/i18n/locales/bg-rest.ts');",
        ],
        cwd=ROOT,
        text=True,
    )
    _ = out
    # load via import in ts - skip; read file and eval keys from migrate regenerated
    from scripts.i18n_migrate_ui import collect_strings, build_catalog, namespace_for  # type: ignore

if __name__ == "__main__":
    print("Use i18n-migrate-ui + manual edits instead.")