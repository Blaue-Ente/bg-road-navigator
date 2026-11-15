#!/usr/bin/env python3
"""Pull official accident points along the travel corridors. Raw files stay in /tmp."""

import sys
import csv
import json
import math
import os
import re
import subprocess
import time
import urllib.parse
import urllib.request
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

from pyproj import Transformer

ROOT = Path("/tmp/hotspots")
OUT = ROOT / "points.jsonl"
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
JTSK = Transformer.from_crs("EPSG:5514", "EPSG:4326", always_xy=True)
AT_URL = "https://www.statistik.at/gs-open/ATLAS_UNFALL_OPEN/wms"
UA = "BG-Road-Navigator/1.0 (+https://github.com/Blaue-Ente/bg-road-navigator)"

notes = []
counts = {}
output = None


def main():
    global output
    lines = json.loads((ROOT / "corridors.json").read_text())["lines"]
    austria_only = len(sys.argv) > 1 and sys.argv[1] == "austria"
    output = OUT.open("a" if austria_only else "w", buffering=1)
    if not austria_only:
        serbia(lines)
        germany(lines)
        hungary(lines)
        czechia(lines)
    austria(lines)
    notes.append(
        "Bulgaria: Cherna pista slot stays empty. CHERNA_PISTA_LAYER is off and no file was fetched."
    )
    notes.append("Romania stays a link-out. No accident archive was downloaded.")
    (ROOT / "extract-report.json").write_text(
        json.dumps({"counts": counts, "notes": notes}, ensure_ascii=False, indent=2)
    )
    output.close()
    print(json.dumps({"counts": counts, "notes": notes}, ensure_ascii=False, indent=2))


def emit(country, lng, lat, year, kind, source, lines):
    if year < 2021 or year > 2026:
        return
    if not near(lng, lat, lines, 50):
        return
    output.write(
        json.dumps(
            {
                "country": country,
                "lng": round(lng, 6),
                "lat": round(lat, 6),
                "year": year,
                "kind": kind,
                "source_id": source,
            },
            ensure_ascii=False,
        )
        + "\n"
    )
    counts[source] = counts.get(source, 0) + 1


def near(lng, lat, lines, buffer_km):
    pad = buffer_km / 80
    point = (lng, lat)
    for line in lines:
        for start, end in zip(line, line[1:]):
            west = min(start[0], end[0]) - pad
            east = max(start[0], end[0]) + pad
            south = min(start[1], end[1]) - pad
            north = max(start[1], end[1]) + pad
            if lng < west or lng > east or lat < south or lat > north:
                continue
            if haversine(point, closest(start, end, point)) <= buffer_km:
                return True
    return False


def haversine(a, b):
    r = 6371
    dlat = math.radians(b[1] - a[1])
    dlng = math.radians(b[0] - a[0])
    lat1 = math.radians(a[1])
    lat2 = math.radians(b[1])
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(h), math.sqrt(1 - h))


def closest(start, end, point):
    lat0 = math.radians((start[1] + end[1]) / 2)
    kx = math.cos(lat0)
    ax, ay = start[0] * kx, start[1]
    bx, by = end[0] * kx, end[1]
    px, py = point[0] * kx, point[1]
    dx, dy = bx - ax, by - ay
    len2 = dx * dx + dy * dy
    raw = 0 if len2 == 0 else ((px - ax) * dx + (py - ay) * dy) / len2
    t = min(1, max(0, raw))
    return (start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t)


def serbia(lines):
    kept = 0
    for year in range(2021, 2026):
        path = ROOT / f"rs{year}.xlsx"
        if not path.exists():
            notes.append(f"Serbia {year}: workbook missing, skipped.")
            continue
        for row in xlsx_rows(path):
            outcome = (row.get("G") or "").strip().lower()
            if "poginul" in outcome:
                kind = "fatal"
            elif "povred" in outcome:
                kind = "slight"
            else:
                continue
            try:
                lng = float(row["E"]) / 1_000_000
                lat = float(row["F"]) / 1_000_000
            except (KeyError, TypeError, ValueError):
                continue
            before = counts.get("rs-mup", 0)
            emit("RS", lng, lat, year, kind, "rs-mup", lines)
            kept += counts.get("rs-mup", 0) - before
    print("serbia corridor points", kept, flush=True)


def germany(lines):
    for year in range(2021, 2026):
        path = ROOT / f"de{year}.zip"
        if not path.exists():
            notes.append(f"Germany {year}: zip missing, skipped.")
            continue
        with zipfile.ZipFile(path) as archive:
            name = next(
                item
                for item in archive.namelist()
                if item.endswith(".csv") or item.endswith(".txt")
            )
            with archive.open(name) as handle:
                text = (line.decode("utf-8-sig") for line in handle)
                reader = csv.DictReader(text, delimiter=";")
                for row in reader:
                    try:
                        category = int(row["UKATEGORIE"])
                        lng = float(row["XGCSWGS84"].replace(",", "."))
                        lat = float(row["YGCSWGS84"].replace(",", "."))
                    except (KeyError, TypeError, ValueError):
                        continue
                    kind = {1: "fatal", 2: "serious", 3: "slight"}.get(category)
                    if not kind:
                        continue
                    emit("DE", lng, lat, year, kind, "de-unfallatlas", lines)
        print("germany", year, counts.get("de-unfallatlas", 0), flush=True)


def hungary(lines):
    files = {
        2021: ROOT / "hu2021.json",
        2022: ROOT / "hu2022.json",
        2023: ROOT / "baleset.json",
        2024: ROOT / "hu2024.json",
        2025: ROOT / "hu2025.json",
    }
    for year, path in files.items():
        if not path.exists():
            notes.append(f"Hungary {year}: JSON missing, skipped.")
            continue
        try:
            data = json.loads(path.read_text())
        except json.JSONDecodeError:
            notes.append(f"Hungary {year}: JSON could not be read, skipped.")
            continue
        features = data.get("features") if isinstance(data, dict) else None
        if not features:
            notes.append(f"Hungary {year}: no coordinates in the file, skipped.")
            continue
        for feature in features:
            coords = (feature.get("geometry") or {}).get("coordinates") or []
            if len(coords) < 2:
                continue
            props = feature.get("properties") or {}
            try:
                severity = int(props.get("JAAA001"))
            except (TypeError, ValueError):
                severity = 3
            kind = {1: "fatal", 2: "serious", 3: "slight"}.get(severity, "slight")
            record_year = props.get("opt_year") or year
            try:
                record_year = int(record_year)
            except (TypeError, ValueError):
                record_year = year
            emit("HU", float(coords[0]), float(coords[1]), record_year, kind, "hu-ksh", lines)
        print("hungary", year, counts.get("hu-ksh", 0), flush=True)


def czechia(lines):
    archives = [
        (ROOT / "czrar" / "2024-11.rar", "2024-11"),
        (ROOT / "czrar" / "2025-12.rar", "2025-12"),
        (ROOT / "cz.rar", "2026-06"),
    ]
    notes.append(
        "Czechia: policie.cz currently links only Data za rok 2026. "
        "2022 and 2023 monthly URLs on archiv.policie.gov.cz return 404. "
        "Ingested the newest remaining archives: 2024 through November, full 2025, and 2026 through June."
    )
    for path, label in archives:
        if not path.exists() or path.stat().st_size < 1000:
            notes.append(f"Czechia {label}: archive missing, skipped.")
            continue
        dest = ROOT / "czwork" / label
        dest.mkdir(parents=True, exist_ok=True)
        subprocess.check_call(["unar", "-o", str(dest), "-f", "-q", str(path)])
        nehody = next(dest.rglob("Inehody.xls"), None)
        gps = next(dest.rglob("IntGPS.xls"), None)
        if not nehody or not gps:
            notes.append(f"Czechia {label}: workbook pair missing, skipped.")
            continue
        places = gps_table(gps)
        injury = 0
        for row in html_rows(nehody):
            if not row:
                continue
            killed = number(row.get("p13a"))
            serious = number(row.get("p13b"))
            slight = number(row.get("p13c"))
            if killed == 0 and serious == 0 and slight == 0:
                continue
            coords = places.get(row.get("p1", ""))
            if not coords:
                continue
            year = year_of(row.get("p2a", ""))
            kind = "fatal" if killed else "serious" if serious else "slight"
            lng, lat = JTSK.transform(coords[1], coords[0])
            before = counts.get("cz-police", 0)
            emit("CZ", lng, lat, year, kind, "cz-police", lines)
            injury += counts.get("cz-police", 0) - before
        print("czechia", label, injury, flush=True)


def austria(lines):
    samples = []
    seen = set()
    for line in lines:
        for start, end in zip(line, line[1:]):
            length = haversine(start, end)
            steps = max(1, int(length / 8))
            for step in range(steps + 1):
                t = step / steps
                lng = start[0] + (end[0] - start[0]) * t
                lat = start[1] + (end[1] - start[1]) * t
                if not (12.6 <= lng <= 17.15 and 46.55 <= lat <= 48.7):
                    continue
                key = (round(lng, 2), round(lat, 2))
                if key in seen:
                    continue
                seen.add(key)
                samples.append((lng, lat))
    notes.append(
        "Austria: WFS on ATLAS_UNFALL_OPEN is disabled. "
        f"Sampled GetFeatureInfo at {len(samples)} corridor points for 2022–2024. "
        "The layer has coordinates and a year, and no injury-severity field, so each hit counts as slight. "
        "This is a corridor sample, not a full census."
    )
    cache = ROOT / "at-cache"
    cache.mkdir(exist_ok=True)
    failures = 0
    for year in (2022, 2023, 2024):
        for lng, lat in samples:
            key = f"{year}-{lng:.2f}-{lat:.2f}.json"
            path = cache / key
            if not path.exists():
                body = feature_info(year, lng, lat)
                if body:
                    path.write_bytes(body)
                    failures = 0
                else:
                    failures += 1
                time.sleep(1.1)
            if failures >= 4:
                notes.append(
                    "Austria sampling stopped after repeated 403 responses. "
                    "Earlier single GetFeatureInfo calls returned points."
                )
                print("austria stopped", year, flush=True)
                return
            if not path.exists() or path.stat().st_size < 20:
                continue
            try:
                payload = json.loads(path.read_text())
            except json.JSONDecodeError:
                continue
            for feature in payload.get("features") or []:
                coords = (feature.get("geometry") or {}).get("coordinates") or []
                if len(coords) < 2:
                    continue
                props = feature.get("properties") or {}
                record_year = props.get("jahr") or year
                try:
                    record_year = int(record_year)
                except (TypeError, ValueError):
                    record_year = year
                emit("AT", float(coords[0]), float(coords[1]), record_year, "slight", "at-statistik", lines)
        print("austria", year, counts.get("at-statistik", 0), flush=True)


def feature_info(year, lng, lat):
    query = {
        "SERVICE": "WMS",
        "VERSION": "1.1.1",
        "REQUEST": "GetFeatureInfo",
        "LAYERS": f"unfall_koord_{year}",
        "QUERY_LAYERS": f"unfall_koord_{year}",
        "INFO_FORMAT": "application/json",
        "FEATURE_COUNT": "30",
        "SRS": "EPSG:4326",
        "BBOX": f"{lng - 0.04:.2f},{lat - 0.03:.2f},{lng + 0.04:.2f},{lat + 0.03:.2f}",
        "WIDTH": "101",
        "HEIGHT": "101",
        "X": "50",
        "Y": "50",
    }
    url = AT_URL + "?" + urllib.parse.urlencode(query)
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            return response.read()
    except Exception as error:
        print("austria miss", year, round(lng, 2), error, flush=True)
        return None


def xlsx_rows(path):
    shared = []
    with zipfile.ZipFile(path) as archive:
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for item in root.findall("m:si", NS):
                shared.append(
                    "".join(
                        node.text or ""
                        for node in item.iter(
                            "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t"
                        )
                    )
                )
        root = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
    for row in root.findall("m:sheetData/m:row", NS):
        values = {}
        for cell in row.findall("m:c", NS):
            ref = cell.attrib.get("r", "A1")
            column = "".join(char for char in ref if char.isalpha())
            node = cell.find("m:v", NS)
            if node is None or node.text is None:
                continue
            if cell.attrib.get("t") == "s":
                values[column] = shared[int(node.text)]
            else:
                values[column] = node.text
        if values:
            yield values


def html_rows(path):
    text = path.read_bytes().decode("cp1250", errors="replace")
    header = None
    for match in re.finditer(r"<TR>(.*?)</TR>", text, re.I | re.S):
        cells = re.findall(r"<T[DH]>(.*?)</T[DH]>", match.group(1), re.I | re.S)
        cells = [re.sub(r"\s+", " ", cell).strip() for cell in cells]
        if header is None:
            header = cells
            continue
        yield dict(zip(header, cells))


def gps_table(path):
    places = {}
    for row in html_rows(path):
        ident = row.get("p1")
        if not ident:
            continue
        try:
            east = float(row["d"].replace(",", "."))
            north = float(row["e"].replace(",", "."))
        except (KeyError, TypeError, ValueError):
            continue
        places[ident] = (east, north)
    return places


def number(value):
    if not value:
        return 0
    try:
        return int(float(value.replace(",", ".").strip()))
    except ValueError:
        return 0


def year_of(value):
    match = re.search(r"(20\d\d)", value or "")
    return int(match.group(1)) if match else 0


if __name__ == "__main__":
    main()
