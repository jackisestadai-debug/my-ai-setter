import { Suspense } from "react";
import HqClient from "@/app/hq/hq-client";

export const metadata = {
  title: "Glow Studio HQ · AURA",
  description: "Mission control",
};

export const dynamic = "force-dynamic";

export default function GlowStudioHqPage() {
  return (
    <Suspense fallback={null}>
      <HqClient config={{ brandName: "GLOW STUDIO", apiBase: "/api/klinik-demo", dashboardPath: "/klinik-demo/dashboard" }} />
    </Suspense>
  );
}
