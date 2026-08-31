import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Geist_Mono, Lusitana } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { UnregisterLegacyServiceWorker } from "@/components/features/shared/unregister-legacy-service-worker";

const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const lusitana = Lusitana({
  variable: "--font-lusitana",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Auto Help Desk",
  description: "Consola operativa de soporte con asistencia LLM responsable",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${atkinson.variable} ${lusitana.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <UnregisterLegacyServiceWorker />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
