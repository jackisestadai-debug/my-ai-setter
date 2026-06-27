import "./globals.css";

export const metadata = {
  title: "Rekvo — AI-säljare som bokar möten åt dig",
  description:
    "Rekvo levererar fullt tränade AI-assistenter som hanterar Instagram-DMs, kvalificerar leads och bokar möten — helt automatiskt, på svenska.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
