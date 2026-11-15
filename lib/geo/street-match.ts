/**
 * Street names compared across бул./ул./пл. prefixes and Cyrillic/Latin spellings.
 * A street-name hit has to outrank a result that only shares the house number.
 */

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sht",
  ъ: "a",
  ь: "y",
  ю: "yu",
  я: "ya",
};

const PREFIX_TOKENS = new Set([
  "bul",
  "bulevard",
  "boulevard",
  "blvd",
  "ul",
  "ulica",
  "ulitsa",
  "pl",
  "ploshtad",
  "piazza",
  "platz",
  "via",
  "street",
  "strasse",
  "str",
]);

export type StreetTier = "exact" | "substring" | "none";

/** Lowercase, transliterate, drop a leading бул./ул./пл., drop a trailing house number. */
export function foldStreetName(value: string): string {
  const lower = value.trim().toLocaleLowerCase("bg-BG").replace(/ß/g, "ss");
  let latin = "";
  for (const char of lower) latin += CYRILLIC_TO_LATIN[char] ?? char;
  latin = latin
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\bstr\./g, "strasse")
    .replace(/\bstr\b/g, "strasse")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = latin.split(" ").filter(Boolean);
  while (tokens.length > 1 && PREFIX_TOKENS.has(tokens[0] ?? "")) tokens.shift();
  while (
    tokens.length > 1 &&
    /^\d+[a-z]?$/u.test(tokens[tokens.length - 1] ?? "")
  ) {
    tokens.pop();
  }
  return tokens.join(" ");
}

export function streetTier(wanted: string, candidate: string): StreetTier {
  const want = foldStreetName(wanted);
  const have = foldStreetName(candidate);
  if (want.length < 3 || have.length < 3) return "none";
  if (want === have) return "exact";
  if (have.includes(want)) return "substring";
  if (want.includes(have) && have.length >= 4) return "substring";
  return "none";
}

export function bestStreetTier(
  wanted: string,
  candidates: Array<string | null | undefined>
): StreetTier {
  let best: StreetTier = "none";
  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    const tier = streetTier(wanted, candidate);
    if (tier === "exact") return "exact";
    if (tier === "substring") best = "substring";
  }
  return best;
}

/** The street part of "Витоша 1, София" or "бул. Vitosha 1, Sofia". */
export function queriedStreet(query: string): string {
  const parts = query
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const withNumber = parts.find((part) => /\d/u.test(part));
  const raw = withNumber ?? parts[0] ?? query;
  return raw
    .replace(/\d+[a-zа-я]?/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
