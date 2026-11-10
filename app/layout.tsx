import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/constants/brand";

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description: PRODUCT_TAGLINE,
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#F3F5F8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bg" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#F3F5F8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var r=localStorage.getItem('bg-road-theme');var s='light';if(r){var t=JSON.parse(r);if(t&&t.state&&(t.state.scheme==='light'||t.state.scheme==='dark'))s=t.state.scheme;}document.documentElement.dataset.theme=s;document.documentElement.style.colorScheme=s;var m=document.querySelector('meta[name=\"theme-color\"]');if(m)m.setAttribute('content',s==='dark'?'#0b0f14':'#f3f5f8');}catch(e){}})();",
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans bg-[var(--waze-bg)] text-[var(--waze-text)] min-h-screen antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-lg focus:bg-[var(--waze-accent)] focus:px-3 focus:py-2 focus:text-white"
        >
          Към съдържанието
        </a>
        <Providers>
          {children}
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
