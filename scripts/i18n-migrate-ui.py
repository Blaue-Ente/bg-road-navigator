#!/usr/bin/env python3
"""One-shot helper: expand bg-rest.ts and patch client TSX to use useMessages()."""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCAN = [ROOT / "app", ROOT / "components"]
ALLOWLIST = {
    "components/location/TripProximity.test.tsx",
}
CYR = re.compile(r"[\u0400-\u04FF]")
STR_LIT = re.compile(
    r"""(['"])(?:\\.|(?!\1)[^\n])*[\u0400-\u04FF](?:\\.|(?!\1)[^\n])*?\1"""
)
TPL_LIT = re.compile(
    r"""`(?:\\.|[^`\\])*[\u0400-\u04FF](?:\\.|[^`\\])*?`"""
)
JSX_TEXT = re.compile(r">([^<{\n][^<{\n]*[\u0400-\u04FF][^<{\n]*)<")

# exact string -> messages path (without m.)
MANUAL: dict[str, str] = {
    "Приближи": "mapControls.zoomIn",
    "Отдалечи": "mapControls.zoomOut",
    "Моето място": "mapControls.myLocation",
    "Слоеве": "mapControls.layers",
    "Няма интернет. Спешните номера са офлайн.": "offline.body",
    "Отвори": "offline.open",
    "Зареждане на гориво": "fuelPage.loading",
    "Гориво и зарядка": "fuelPage.title",
    "Оценка на разход": "fuelEstimate.title",
    "Оценка на разхода, не оферта за гориво.": "fuelEstimate.disclaimer",
    "Изчисли маршрут": "planning.calculate",
    "Български": "locale.bg",
}


def rel(p: Path) -> str:
    return p.relative_to(ROOT).as_posix()


def namespace_for(path: str) -> str:
    if path.startswith("app/(app)/"):
        name = path.split("/")[2].replace(".tsx", "")
        if name == "page":
            return "home"
        return f"{name}Page"
    if path.startswith("app/(auth)/"):
        part = path.split("/")[2].replace(".tsx", "")
        return f"auth{part.title()}Page" if part != "page" else "authPage"
    if path.startswith("components/"):
        parts = path.split("/")
        return parts[1]
    return "misc"


def slug_key(text: str) -> str:
    h = hashlib.sha1(text.encode()).hexdigest()[:10]
    prefix = "msg"
    clean = re.sub(r"[^a-zA-Z0-9]+", " ", text[:48]).strip().split()
    if clean and all(ord(c[0]) < 128 for c in clean if c):
        stem = "".join(w[:1].upper() + w[1:].lower() for w in clean[:3])
        stem = stem[0].lower() + stem[1:] if stem else prefix
        stem = re.sub(r"[^a-zA-Z0-9]", "", stem)[:24]
        if stem and stem[0].isalpha():
            return f"{stem}{h[:4]}"
    return f"{prefix}{h}"


def collect_strings() -> dict[str, list[tuple[str, str]]]:
    """path -> list of (kind, text)"""
    out: dict[str, list[tuple[str, str]]] = {}
    for base in SCAN:
        for path in base.rglob("*.tsx"):
            rp = rel(path)
            if rp in ALLOWLIST or "lib/i18n" in rp:
                continue
            text = path.read_text(encoding="utf-8")
            if not CYR.search(text):
                continue
            hits: list[tuple[str, str]] = []
            for m in STR_LIT.finditer(text):
                inner = m.group(0)[1:-1]
                if len(inner) < 2 or "\\n" in inner:
                    continue
                hits.append(("lit", inner))
            for m in TPL_LIT.finditer(text):
                inner = m.group(0)[1:-1]
                if "${" in inner and CYR.search(inner):
                    hits.append(("tpl", inner))
            for m in JSX_TEXT.finditer(text):
                inner = m.group(1).strip()
                if len(inner) < 2:
                    continue
                hits.append(("jsx", inner))
            for m in re.finditer(r">\s*([^<{}]+?)\s*<", text, re.DOTALL):
                inner = " ".join(m.group(1).split())
                if CYR.search(inner) and 1 < len(inner) < 240 and "${" not in inner:
                    hits.append(("jsx", inner))
            for line in text.splitlines():
                if not CYR.search(line):
                    continue
                stripped = line.strip()
                if (
                    CYR.search(stripped)
                    and not any(ch in stripped for ch in "<>{}`")
                    and 1 < len(stripped) < 220
                ):
                    hits.append(("jsx", stripped))
            if hits:
                out[rp] = hits
    return out


def build_catalog(by_file: dict[str, list[tuple[str, str]]]) -> tuple[dict, dict[str, str], dict[str, dict[str, str]]]:
    catalog: dict = {}
    index: dict[str, str] = {}
    per_file: dict[str, dict[str, str]] = {}
    for fpath, hits in sorted(by_file.items()):
        ns = namespace_for(fpath)
        bucket = catalog.setdefault(ns, {})
        file_map: dict[str, str] = {}
        for kind, text in hits:
            if text in MANUAL:
                path = MANUAL[text]
                index[text] = path
                file_map[text] = path
                continue
            if text in index:
                file_map[text] = index[text]
                continue
            key = slug_key(text)
            while key in bucket:
                key = key + "Alt"
            bucket[key] = text
            path = f"{ns}.{key}"
            index[text] = path
            file_map[text] = path
        if file_map:
            per_file[fpath] = file_map
    return catalog, index, per_file


def main() -> None:
    by_file = collect_strings()
    catalog, index, per_file = build_catalog(by_file)
    # Merge manual auth/offline/map from partial bg-rest
    merged = catalog

    def ident(k: str) -> str:
        if re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", k):
            return k
        return json.dumps(k, ensure_ascii=False)

    def emit(obj, indent=2):
        sp = " " * indent
        lines = ["{"]
        for k, v in obj.items():
            ik = ident(k)
            if isinstance(v, dict):
                lines.append(f"{sp}{ik}: {emit(v, indent + 2)},")
            else:
                lines.append(
                    f"{sp}{ik}: {json.dumps(v, ensure_ascii=False)},"
                )
        lines.append(" " * (indent - 2) + "}")
        return "\n".join(lines)

    out = (
        "/** Additional UI + planner copy (Bulgarian). Merged into `bg`. */\n"
        f"export const bgRest = {emit(merged, 2)} as const;\n"
    )
    (ROOT / "lib/i18n/locales/bg-rest.ts").write_text(out, encoding="utf-8")
    (ROOT / "scripts/i18n-string-index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (ROOT / "scripts/i18n-file-index.json").write_text(
        json.dumps(per_file, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"catalog namespaces: {len(merged)}, strings indexed: {len(index)}")


if __name__ == "__main__":
    main()