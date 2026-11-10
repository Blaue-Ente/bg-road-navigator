/**
 * One calm blue. The filled button stays the same in both themes.
 * The route line shifts lighter on the dark basemap so it stays readable.
 */

export const theme = {
  accent: "#1E40AF",
  accentDark: "#1E3A8A",
  accentMuted: "rgba(30, 64, 175, 0.12)",

  bg: "#F3F5F8",
  surface: "#FFFFFF",
  surfaceElevated: "#F7F8FA",
  surfaceOverlay: "#FFFFFF",

  routeLine: "#1E40AF",
  routeLineDark: "#60A5FA",
  routeCasing: "#172554",
  routeCasingDark: "#DBEAFE",
  routeAlt: ["#0F766E", "#B45309", "#6D28D9"],

  statusGreen: "#15803D",
  statusYellow: "#A16207",
  statusOrange: "#C2410C",
  statusRed: "#B91C1C",

  textPrimary: "#0F172A",
  textSecondary: "#334155",
  textMuted: "#3E4C5E",

  themeColor: "#F3F5F8",
} as const;
