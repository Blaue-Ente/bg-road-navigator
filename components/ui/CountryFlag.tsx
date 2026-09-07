interface CountryFlagProps {
  code?: string;
  className?: string;
}

const FLAG: Record<string, { bands: string[]; vertical?: boolean }> = {
  BG: { bands: ["#ffffff", "#00966e", "#d62612"] },
  DE: { bands: ["#000000", "#dd0000", "#ffce00"] },
  HU: { bands: ["#ce2939", "#ffffff", "#477050"] },
  NL: { bands: ["#ae1c28", "#ffffff", "#21468b"] },
  LU: { bands: ["#ed2939", "#ffffff", "#00a1de"] },
  RU: { bands: ["#ffffff", "#0039a6", "#d52b1e"] },
  AT: { bands: ["#ed2939", "#ffffff", "#ed2939"] },
  LV: { bands: ["#9e3039", "#ffffff", "#9e3039"] },
  EE: { bands: ["#0072ce", "#000000", "#ffffff"] },
  LT: { bands: ["#fdb913", "#006a44", "#c1272d"] },
  AM: { bands: ["#d90012", "#0033a0", "#f2a800"] },
  SI: { bands: ["#ffffff", "#005ce5", "#ed1c24"] },
  SK: { bands: ["#ffffff", "#0b4ea2", "#ee1c25"] },
  HR: { bands: ["#ff0000", "#ffffff", "#171796"] },
  RS: { bands: ["#c6363c", "#0c4076", "#ffffff"] },
  IT: { bands: ["#009246", "#ffffff", "#ce2b37"], vertical: true },
  FR: { bands: ["#002395", "#ffffff", "#ed2939"], vertical: true },
  BE: { bands: ["#000000", "#fada4a", "#ef3340"], vertical: true },
  RO: { bands: ["#002b7f", "#fcd116", "#ce1126"], vertical: true },
  MD: { bands: ["#003da5", "#ffd200", "#cc092f"], vertical: true },
  IE: { bands: ["#169b62", "#ffffff", "#ff883e"], vertical: true },
};

function SimpleBands({
  bands,
  vertical,
}: {
  bands: string[];
  vertical?: boolean;
}) {
  const size = 100 / bands.length;
  return (
    <>
      {bands.map((color, index) =>
        vertical ? (
          <rect
            key={color + index}
            x={index * size}
            y={0}
            width={size}
            height={100}
            fill={color}
          />
        ) : (
          <rect
            key={color + index}
            x={0}
            y={index * size}
            width={100}
            height={size}
            fill={color}
          />
        )
      )}
    </>
  );
}

function SpecialFlag({ code }: { code: string }) {
  switch (code) {
    case "GR":
      return (
        <>
          <rect width="100" height="100" fill="#0d5eaf" />
          <rect y="11" width="100" height="11" fill="#fff" />
          <rect y="33" width="100" height="11" fill="#fff" />
          <rect y="55" width="100" height="11" fill="#fff" />
          <rect y="77" width="100" height="11" fill="#fff" />
          <rect width="40" height="44" fill="#0d5eaf" />
          <rect x="16" width="8" height="44" fill="#fff" />
          <rect y="18" width="40" height="8" fill="#fff" />
        </>
      );
    case "GB":
      return (
        <>
          <rect width="100" height="100" fill="#012169" />
          <path
            d="M0 0 L100 100 M100 0 L0 100"
            stroke="#fff"
            strokeWidth="20"
          />
          <path
            d="M0 0 L100 100 M100 0 L0 100"
            stroke="#c8102e"
            strokeWidth="10"
          />
          <path d="M50 0 V100 M0 50 H100" stroke="#fff" strokeWidth="24" />
          <path d="M50 0 V100 M0 50 H100" stroke="#c8102e" strokeWidth="12" />
        </>
      );
    case "CH":
      return (
        <>
          <rect width="100" height="100" fill="#da0000" />
          <rect x="38" y="18" width="24" height="64" fill="#fff" />
          <rect x="18" y="38" width="64" height="24" fill="#fff" />
        </>
      );
    case "SE":
      return (
        <>
          <rect width="100" height="100" fill="#006aa7" />
          <rect x="28" width="16" height="100" fill="#fecc00" />
          <rect y="42" width="100" height="16" fill="#fecc00" />
        </>
      );
    case "DK":
      return (
        <>
          <rect width="100" height="100" fill="#c60c30" />
          <rect x="28" width="12" height="100" fill="#fff" />
          <rect y="42" width="100" height="12" fill="#fff" />
        </>
      );
    case "FI":
      return (
        <>
          <rect width="100" height="100" fill="#fff" />
          <rect x="28" width="16" height="100" fill="#003580" />
          <rect y="42" width="100" height="16" fill="#003580" />
        </>
      );
    case "NO":
      return (
        <>
          <rect width="100" height="100" fill="#ba0c2f" />
          <rect x="26" width="20" height="100" fill="#fff" />
          <rect y="40" width="100" height="20" fill="#fff" />
          <rect x="30" width="12" height="100" fill="#00205b" />
          <rect y="44" width="100" height="12" fill="#00205b" />
        </>
      );
    case "PL":
      return (
        <>
          <rect width="100" height="50" fill="#fff" />
          <rect y="50" width="100" height="50" fill="#dc143c" />
        </>
      );
    case "UA":
      return (
        <>
          <rect width="100" height="50" fill="#005bbb" />
          <rect y="50" width="100" height="50" fill="#ffd500" />
        </>
      );
    case "CZ":
      return (
        <>
          <rect width="100" height="50" fill="#fff" />
          <rect y="50" width="100" height="50" fill="#d7141a" />
          <path d="M0 0 L45 50 L0 100 Z" fill="#11457e" />
        </>
      );
    case "ES":
      return (
        <>
          <rect width="100" height="25" fill="#aa151b" />
          <rect y="25" width="100" height="50" fill="#f1bf00" />
          <rect y="75" width="100" height="25" fill="#aa151b" />
        </>
      );
    case "TR":
      return (
        <>
          <rect width="100" height="100" fill="#e30a17" />
          <circle cx="38" cy="50" r="18" fill="#fff" />
          <circle cx="44" cy="50" r="14" fill="#e30a17" />
          <polygon
            fill="#fff"
            points="58,50 64,47 67,52 67,46 72,50 67,54 67,48 64,53"
          />
        </>
      );
    case "PT":
      return (
        <>
          <rect width="100" height="100" fill="#ff0000" />
          <rect width="38" height="100" fill="#006600" />
        </>
      );
    case "AL":
      return (
        <>
          <rect width="100" height="100" fill="#e41e20" />
          <path d="M50 22 L58 48 H42 Z M38 48 L50 78 L62 48" fill="#000" />
        </>
      );
    case "MK":
      return (
        <>
          <rect width="100" height="100" fill="#d82126" />
          <circle cx="50" cy="50" r="14" fill="#f8e200" />
        </>
      );
    default:
      return null;
  }
}

export function CountryFlag({ code, className = "h-4 w-5" }: CountryFlagProps) {
  const normalized = (code ?? "").trim().toUpperCase();
  const bands = FLAG[normalized];
  const special = SpecialFlag({ code: normalized });

  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/15 ${className}`}
      title={normalized || "държава"}
      aria-hidden
    >
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        {special ??
          (bands ? (
            <SimpleBands bands={bands.bands} vertical={bands.vertical} />
          ) : (
            <>
              <rect width="100" height="100" fill="#1e2530" />
              <text
                x="50"
                y="62"
                textAnchor="middle"
                fill="#a1a1aa"
                fontSize="36"
                fontFamily="system-ui, sans-serif"
              >
                {normalized.slice(0, 2) || "?"}
              </text>
            </>
          ))}
      </svg>
    </span>
  );
}
