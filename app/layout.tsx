import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "@/app/globals.css";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/constants/brand";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n/locale";
import { bg } from "@/lib/i18n/locales/bg";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialLocale = parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  return (
    <html lang={initialLocale} data-theme="light" suppressHydrationWarning>
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
              "(function(){try{var r=localStorage.getItem('bg-road-theme');var s='light';if(r){var t=JSON.parse(r);if(t&&t.state&&(t.state.scheme==='light'||t.state.scheme==='dark'))s=t.state.scheme;}else if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){s='dark';}document.documentElement.dataset.theme=s;document.documentElement.style.colorScheme=s;var m=document.querySelector('meta[name=\"theme-color\"]');if(m)m.setAttribute('content',s==='dark'?'#0b0f14':'#f3f5f8');}catch(e){}})();",
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var l=localStorage.getItem('bg-road-locale');if(l==='en'||l==='tr'||l==='ro'||l==='bg')document.documentElement.lang=l;}catch(e){}})();",
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
          {bg.nav.skipToContent}
        </a>
        <Providers initialLocale={initialLocale}>
          {children}
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}