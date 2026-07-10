import { Suspense } from "react";
import HqClient from "./hq-client";

export const metadata = {
  title: "Nynäskalaset · Festival HQ",
  description: "Mission control — Nynäskalaset 2026",
};

export const dynamic = "force-dynamic";

export default function NynaskalasetHqPage() {
  return (
    <Suspense fallback={null}>
      <HqClient />
    </Suspense>
  );
}
