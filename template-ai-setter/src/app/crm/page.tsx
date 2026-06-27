import { Suspense } from "react";
import CrmClient from "./crm-client";

export const metadata = {
  title: "CRM · Rekvo",
  description: "Daglig aktivitetstracker och lead-CRM",
};

export const dynamic = "force-dynamic";

export default function CrmPage() {
  return (
    <Suspense fallback={null}>
      <CrmClient />
    </Suspense>
  );
}
