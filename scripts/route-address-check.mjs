/**
 * Geocode street addresses and route them through the app's own APIs.
 * Usage: node scripts/route-address-check.mjs [baseUrl]
 * Nominatim policy: one search per second. This waits between searches.
 */
const base = process.argv[2] ?? "http://127.0.0.1:3000";

const pairs = [
  ["Kurfürstendamm 21, 10719 Berlin", "бул. Витоша 1, София"],
  ["Marienplatz 1, 80331 München", "ул. Княз Александър I 12, Пловдив"],
  ["Stephansplatz 1, 1010 Wien", "бул. Приморски 1, Варна"],
  ["Piazza del Duomo, Milano", "ул. Александровска 1, Бургас"],
  ["Gran Vía 1, Madrid", "ул. Стефан Стамболов 1, Велико Търново"],
  ["Dam 1, Amsterdam", "ул. Александровска 1, Русе"],
  ["Rynek Główny 1, Kraków", "пл. Македония, Благоевград"],
  ["ул. Цар Освободител 1, Свищов", "Andrássy út 1, Budapest"],
  ["ГКПП Кулата, България", "Αριστοτέλους, Θεσσαλονίκη"],
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function search(query) {
  const url = `${base}/api/places/search?q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

async function route(from, to) {
  const response = await fetch(`${base}/api/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      points: [from, to],
    }),
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

const rows = [];

for (const [fromQuery, toQuery] of pairs) {
  const fromSearch = await search(fromQuery);
  await sleep(1100);
  const toSearch = await search(toQuery);
  await sleep(1100);

  const from = fromSearch.body?.places?.[0] ?? null;
  const to = toSearch.body?.places?.[0] ?? null;
  const row = {
    from_query: fromQuery,
    to_query: toQuery,
    from_label: from?.label ?? null,
    to_label: to?.label ?? null,
    from_coords: from?.coords ?? null,
    to_coords: to?.coords ?? null,
    distance_km: null,
    duration_min: null,
    border: null,
    source: null,
    failure: null,
  };

  if (!from || !to) {
    row.failure = !from ? "origin not found" : "destination not found";
    rows.push(row);
    continue;
  }

  const routed = await route(from, to);
  const data = routed.body;
  if (!routed.status || routed.status >= 400 || !data?.geometry) {
    row.failure = data?.error ?? `route ${routed.status}`;
    rows.push(row);
    continue;
  }

  row.distance_km = data.distance_km;
  row.duration_min = data.duration_min;
  row.border = data.border_crossing?.name_bg ?? null;
  row.source = data.routing_source ?? null;
  rows.push(row);
}

console.log(JSON.stringify(rows, null, 2));
