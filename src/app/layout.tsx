import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono, JetBrains_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import { OmniChat } from "@/components/ia/omni-chat";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Astra | Virtual Assistant",
  description: "Advanced Governance, Risk, and Compliance Decision System",
};

// Required for CSP nonce: each request gets a fresh nonce from middleware.
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? "";
  return (
    <html lang="en" nonce={nonce} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} ${dmSans.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <OmniChat />
        </Providers>
      </body>
    </html>
  );
}
