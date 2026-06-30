import { Suspense } from "react";
import HqClient from "@/app/hq/hq-client";

export const metadata = {
  title: "Nordic Solar HQ · NOVA",
  description: "Mission control",
};

export const dynamic = "force-dynamic";

export default function NordicSolarHqPage() {
  return (
    <Suspense fallback={null}>
      <HqClient config={{ brandName: "NORDIC SOLAR", apiBase: "/api/nordic-solar-demo", dashboardPath: "/nordic-solar-demo/dashboard", hideTabs: ["crm", "kalender", "noter"] }} />
    </Suspense>
  );
}
