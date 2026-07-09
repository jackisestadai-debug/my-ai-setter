import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rekvo Partners – AI-säljare som bokar möten åt dig",
  description:
    "Rekvo bygger smarta AI-system som svarar på kundmeddelanden, kvalificerar leads och bokar möten automatiskt – dygnet runt, på svenska.",
  openGraph: {
    title: "Rekvo Partners – AI-säljare som bokar möten åt dig",
    description:
      "Rekvo bygger smarta AI-system som svarar på kundmeddelanden, kvalificerar leads och bokar möten automatiskt – dygnet runt, på svenska.",
    url: "https://rekvo.se",
    siteName: "Rekvo Partners",
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rekvo Partners – AI-säljare som bokar möten åt dig",
    description:
      "Rekvo bygger smarta AI-system som svarar på kundmeddelanden, kvalificerar leads och bokar möten automatiskt – dygnet runt, på svenska.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
