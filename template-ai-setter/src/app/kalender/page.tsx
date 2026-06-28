import { Suspense } from "react";
import KalenderClient from "./kalender-client";

export const metadata = {
  title: "Kalender · Rekvo",
};

export const dynamic = "force-dynamic";

export default function KalenderPage() {
  return (
    <Suspense fallback={null}>
      <KalenderClient />
    </Suspense>
  );
}
