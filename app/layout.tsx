import type { Metadata } from "next";
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
  title: "F1 Frameable Map",
  description:
    "Este es un mapa de F1 en tiempo real con el propósito de ser utilizado como frame.",
  authors: [{ name: "Mateo Nuñez" }, { name: "Skon" }],
  icons: "/favicon.ico",
  keywords: [
    "f1",
    "formula 1",
    "map",
    "mapa",
    "formula",
    "frameable",
    "iframe",
    "svg",
    "colapinto",
    "franco",
    "fórmula",
    "carrera",
  ],
  openGraph: {
    title: "Mapa de Fórmula 1 en Tiempo Real | F1 Frameable Map",
    description:
      "Mapa interactivo y gratuito de Fórmula 1 en tiempo real. Embébelo en tu web y sigue la carrera en vivo.",
    // url: "https://tusitio.com",
    siteName: "F1 Frameable Map",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mapa de Fórmula 1 en Tiempo Real | F1 Frameable Map",
    description:
      "Mapa interactivo y gratuito de Fórmula 1 en tiempo real. Embébelo en tu web y sigue la carrera en vivo.",
  },
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1",
  // alternates: {
  //   canonical: "https://tusitio.com", 
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
