#!/usr/bin/env python3
"""
Builds lib/data/speed-cameras.json: every fixed speed camera (OpenStreetMap
highway=speed_camera) in the countries the app covers.

Needs `osmium` (osmium-tool) and internet access to download.geofabrik.de.
Data: (c) OpenStreetMap contributors, ODbL. France and Switzerland are left out
on purpose: showing camera positions there is banned.

Run: python3 scripts/speed-cameras/build.py [workdir]
"""
import json
import os
import re
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone

# country code -> Geofabrik path under https://download.geofabrik.de/
COUNTRIES = {
    "BG": "europe/bulgaria",
    "RS": "europe/serbia",
    "RO": "europe/romania",
    "HU": "europe/hungary",
    "GR": "europe/greece",
    "MK": "europe/macedonia",
    "TR": "europe/turkey",
    "DE": "europe/germany",
    "AT": "europe/austria",
    "PL": "europe/poland",
    "CZ": "europe/czech-republic",
    "SK": "europe/slovakia",
    "SI": "europe/slovenia",
    "HR": "europe/croatia",
    "NL": "europe/netherlands",
    "BE": "europe/belgium",
    "DK": "europe/denmark",
    "IT": "europe/italy",
    "ES": "europe/spain",
    "PT": "europe/portugal",
}

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "lib", "data", "speed-cameras.json")


def download(path: str, dest: str) -> None:
    url = f"https://download.geofabrik.de/{path}-latest.osm.pbf"
    req = urllib.request.Request(url, headers={"User-Agent": "BG-Road-Navigator-data-build/1.0"})
    with urllib.request.urlopen(req, timeout=600) as response, open(dest, "wb") as out:
        while chunk := response.read(1 << 20):
            out.write(chunk)


def maxspeed(raw) -> int:
    match = re.match(r"^(\d{2,3})(?:\s*km/h)?$", str(raw or ""), re.I)
    if not match:
        return 0
    value = int(match.group(1))
    return value if 20 <= value <= 140 else 0


def cameras_in(pbf: str, work: str, code: str) -> list:
    filtered = os.path.join(work, f"{code}-cams.osm.pbf")
    seq = os.path.join(work, f"{code}-cams.geojsonseq")
    subprocess.run(
        ["osmium", "tags-filter", "-o", filtered, "--overwrite", pbf, "n/highway=speed_camera"],
        check=True,
    )
    subprocess.run(
        ["osmium", "export", "-f", "geojsonseq", "--geometry-types=point", "-o", seq, "--overwrite", filtered],
        check=True,
    )
    points = []
    with open(seq, encoding="utf-8") as handle:
        for line in handle:
            line = line.strip().lstrip("\x1e")
            if not line:
                continue
            feature = json.loads(line)
            lng, lat = feature["geometry"]["coordinates"][:2]
            points.append([round(lng, 5), round(lat, 5), maxspeed(feature.get("properties", {}).get("maxspeed"))])
    return points


def main() -> None:
    work = sys.argv[1] if len(sys.argv) > 1 else "/tmp/speed-cameras"
    os.makedirs(work, exist_ok=True)
    seen = set()
    points = []
    built = []
    for code, path in COUNTRIES.items():
        pbf = os.path.join(work, f"{code}.osm.pbf")
        print(f"{code}: downloading {path}", flush=True)
        download(path, pbf)
        found = cameras_in(pbf, work, code)
        os.remove(pbf)
        added = 0
        for point in found:
            key = (point[0], point[1])
            if key in seen:
                continue
            seen.add(key)
            points.append(point)
            added += 1
        built.append(code)
        print(f"{code}: {added} cameras", flush=True)
    points.sort()
    payload = {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "source": "OpenStreetMap contributors, ODbL",
        "countries": built,
        "points": points,
    }
    with open(OUT, "w", encoding="utf-8") as out:
        json.dump(payload, out, separators=(",", ":"))
        out.write("\n")
    print(f"wrote {len(points)} cameras from {len(built)} countries to {os.path.normpath(OUT)}")


if __name__ == "__main__":
    main()
