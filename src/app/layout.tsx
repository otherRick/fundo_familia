import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fundo Família",
  description:
    "Transparência das contribuições e investimentos.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="font-sans">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 bg-[url('/fundofamilia.png')] bg-cover bg-center opacity-50"
        />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}

