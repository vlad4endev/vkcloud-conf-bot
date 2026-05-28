import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Unbounded } from "next/font/google";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-unbounded-var",
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter-var",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-var",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "VK Cloud Conf'26 — Проектируем будущее с VK Cloud",
  description:
    "VK Cloud Conf'26 — 17 июня 2026, Москва. Самая масштабная отраслевая конференция облачных технологий.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${unbounded.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
