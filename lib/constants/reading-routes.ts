/** Full-width pages without the map column beside the panel. */
export const READING_ROUTES = new Set([
  "/tips",
  "/emergency",
  "/vignettes",
  "/setup",
  "/profile",
  "/hotels",
]);

export function isReadingRoute(pathname: string): boolean {
  return READING_ROUTES.has(pathname);
}