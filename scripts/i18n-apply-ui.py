#!/usr/bin/env python3
"""Patch client TSX: useMessages() + replace literals inside function bodies only."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP = {"components/location/TripProximity.test.tsx", "components/ui/CountryFlag.tsx"}
CYR = re.compile(r"[\u0400-\u04FF]")
FUNC_START = re.compile(
    r"^(export default function \w+|^function \w+|^export function \w+)",
    re.M,
)


def path_to_expr(path: str) -> str:
    return "m." + ".".join(path.split("."))


def find_functions(text: str) -> list[tuple[int, int]]:
    lines = text.splitlines(keepends=True)
    starts: list[int] = []
    for i, line in enumerate(lines):
        if FUNC_START.match(line.strip()):
            starts.append(i)
    spans: list[tuple[int, int]] = []
    for idx, start in enumerate(starts):
        end = starts[idx + 1] if idx + 1 < len(starts) else len(lines)
        spans.append((start, end))
    return spans


def ensure_import(text: str) -> str:
    imp = 'import { useMessages } from "@/components/i18n/LocaleProvider";\n'
    if imp in text:
        return text
    return text.replace('"use client";\n', '"use client";\n\n' + imp, 1)


def patch_block(block: str, mapping: dict[str, str]) -> str:
    if not CYR.search(block):
        return block
    out = block
    for src, msg_path in sorted(mapping.items(), key=lambda x: -len(x[0])):
        if src not in out:
            continue
        expr = path_to_expr(msg_path)
        out = out.replace(f'"{src}"', f"{{{expr}}}")
        out = out.replace(f"'{src}'", f"{{{expr}}}")
        out = out.replace(f">{src}<", f">{{{expr}}}<")
    if out != block and "useMessages()" not in out:
        out = re.sub(
            r"(^.*\{\s*\n)",
            r"\1  const m = useMessages();\n",
            out,
            count=1,
            flags=re.M,
        )
    return out


def apply_file(rel: str, mapping: dict[str, str]) -> bool:
    path = ROOT / rel
    text = path.read_text(encoding="utf-8")
    if '"use client"' not in text or rel in SKIP:
        return False
    original = text
    lines = text.splitlines(keepends=True)
    spans = find_functions(text)
    if not spans:
        return False
    new_lines = list(lines)
    for start, end in reversed(spans):
        block = "".join(new_lines[start:end])
        patched = patch_block(block, mapping)
        if patched != block:
            new_lines[start:end] = [patched]
    text = ensure_import("".join(new_lines))
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    by_file = json.loads(
        (ROOT / "scripts/i18n-file-index.json").read_text(encoding="utf-8")
    )
    changed = 0
    for rel, mapping in by_file.items():
        if apply_file(rel, mapping):
            changed += 1
    print(f"patched files: {changed}/{len(by_file)}")


if __name__ == "__main__":
    main()