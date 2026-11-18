import { buildTripPdf, type TripPdfInput } from "@/lib/pdf/trip-pdf";

let fontsPromise: Promise<{ regular: ArrayBuffer; bold: ArrayBuffer }> | null = null;

/** The two font files, fetched once, only when a PDF is asked for. */
function loadFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetch("/fonts/LiberationSans-Regular.ttf").then((response) => {
        if (!response.ok) throw new Error("font");
        return response.arrayBuffer();
      }),
      fetch("/fonts/LiberationSans-Bold.ttf").then((response) => {
        if (!response.ok) throw new Error("font");
        return response.arrayBuffer();
      }),
    ])
      .then(([regular, bold]) => ({ regular, bold }))
      .catch((error) => {
        fontsPromise = null;
        throw error;
      });
  }
  return fontsPromise;
}

export async function makeTripPdf(input: TripPdfInput): Promise<Uint8Array> {
  return buildTripPdf(input, await loadFonts());
}

/** Hands the file to the browser as a download, without leaving the page. */
export function savePdfFile(bytes: Uint8Array, filename: string): void {
  const copy = new Uint8Array(bytes);
  const url = URL.createObjectURL(new Blob([copy], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function pdfFilename(destination: string, departAt: string): string {
  const slug = destination
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `trip-${departAt.slice(0, 10)}-${slug || "plan"}.pdf`;
}
