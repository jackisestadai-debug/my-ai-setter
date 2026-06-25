import { Suspense } from "react";
import HqClient from "./hq-client";

export const metadata = {
  title: "Aura HQ · Svea AI Partners",
  description: "Mission control",
};

export const dynamic = "force-dynamic";

export default function HqPage() {
  return (
    <Suspense fallback={null}>
      <HqClient />
    </Suspense>
  );
}
