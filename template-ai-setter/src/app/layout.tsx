import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rekvo Partners",
  openGraph: {
    title: "Rekvo Partners",
    url: "https://rekvo.se",
    siteName: "Rekvo Partners",
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Rekvo Partners",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
