/**
 * Waze-inspired design tokens (map-first navigation app)
 */

export const theme = {
  /** Bright route / primary accent — Waze cyan */
  accent: "#33CCFF",
  accentDark: "#1A9FD4",
  accentMuted: "rgba(51, 204, 255, 0.15)",

  /** Surfaces */
  bg: "#0B0F14",
  surface: "#161B22",
  surfaceElevated: "#1E2530",
  surfaceOverlay: "rgba(22, 27, 34, 0.92)",

  /** Route on map */
  routeLine: "#33CCFF",
  routeCasing: "#0E7490",
  routeAlt: ["#4ADE80", "#FBBF24", "#A78BFA"],

  /** Traffic / wait status */
  statusGreen: "#22C55E",
  statusYellow: "#EAB308",
  statusOrange: "#F97316",
  statusRed: "#EF4444",

  /** Text */
  textPrimary: "#F4F4F5",
  textSecondary: "#A1A1AA",
  textMuted: "#71717A",

  /** PWA */
  themeColor: "#0B0F14",
} as const;
