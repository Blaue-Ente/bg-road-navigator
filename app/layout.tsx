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
  themeColor: "#0B0F14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bg" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#0B0F14" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var r=localStorage.getItem('bg-road-theme');if(!r)return;var t=JSON.parse(r);var s=t&&t.state&&t.state.scheme;if(s==='light'||s==='dark'){document.documentElement.dataset.theme=s;document.documentElement.style.colorScheme=s;}}catch(e){}})();",
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans bg-[var(--waze-bg)] text-[var(--waze-text)] min-h-screen antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-lg focus:bg-[var(--waze-accent)] focus:px-3 focus:py-2 focus:text-[#0b0f14]"
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
