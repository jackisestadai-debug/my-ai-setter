import { Suspense } from "react";
import HqClient, { HqPitchBeat } from "@/app/hq/hq-client";

export const metadata = {
  title: "Nordic Solar HQ · NOVA",
  description: "Mission control",
};

export const dynamic = "force-dynamic";

function nordicPitch(kickoff: string): HqPitchBeat[] {
  return [
    {
      say: kickoff || "Okej — låt mig visa dig exakt vad som händer i ditt solcellsföretag varje dag medan dina säljare är ute på hembesök.",
      rings: true,
      panels: [{ kind: "metric", title: "OMSÄTTNING · 30 DAGAR", value: "2 340 000 kr", sub: "41 avtal signerade automatiskt", accent: true }],
      hold: 800,
    },
    {
      say: "Problemet för de flesta solcellsföretag är det här: ni lägger pengar på annonser, leads trillar in — men svarstiden är för lång. En villaägare som fyller i ett formulär klockan nio på kvällen har redan fått svar från tre konkurrenter när du ringer nästa morgon. Affären är borta.",
      panels: [{ kind: "stats", title: "BRANSCHENS PROBLEM", items: [{ label: "Snitt svarstid branschen", value: "4–18 tim" }, { label: "Leads som försvinner dag 1", value: "~60%" }, { label: "Kostnad per förlorat lead", value: "~8 000 kr" }, { label: "Nova svarar på", value: "45 sek" }] }],
      hold: 800,
    },
    {
      say: "Och det är inte bara privatpersoner. B2B-leads — fastighetsbolag, bostadsrättsföreningar, industrifastigheter — de skickar offertförfrågan till flera leverantörer samtidigt. Den som svarar snabbast och kvalificerar rätt vinner. Varje gång.",
      panels: [{ kind: "funnel", title: "LEAD-FUNNEL · 30 DAGAR", rows: [{ label: "Leads inkommna", value: 284 }, { label: "Kvalificerade", value: 112 }, { label: "Bokade möten", value: 67 }, { label: "Signerade avtal", value: 41 }] }],
      hold: 800,
    },
    {
      say: "Så här ser det ut i praktiken. En villaägare hör av sig om solceller. Nova svarar direkt, ställer rätt frågor — takytan, årsförbrukning, om de är intresserade av batteri — och bokar in ett hembesök. Säljaren anländer förberedd.",
      autoConv: true,
      hold: 400,
    },
    {
      say: "De leads som inte svarar direkt? Dem följer Nova upp automatiskt — dag två, dag fem, dag tio. Med anpassade meddelanden. Mer än en tredjedel återaktiveras och bokar möte. Intäkter du annars hade tappat.",
      closeConv: true,
      panels: [{ kind: "stats", title: "UPPFÖLJNINGAR · 30 DAGAR", items: [{ label: "Skickade uppföljningar", value: "38" }, { label: "Återaktiverade leads", value: "14 st" }, { label: "Ombokade möten", value: "9 st" }, { label: "Värde återvunnet", value: "~630 000 kr" }] }],
      hold: 800,
    },
    {
      say: "No-shows är ett annat stort problem för solcellsföretag — ni skickar ut en tekniker för hembesök och kunden dyker inte upp. Nova skickar påminnelse dagen innan, bekräftar tidpunkten, och om kunden ändå avbokar bokas en ny tid automatiskt. Ni slösar inte mer tid.",
      panels: [{ kind: "stats", title: "NO-SHOWS", items: [{ label: "No-show utan påminnelse", value: "~22%" }, { label: "No-show med Nova", value: "12%" }, { label: "Räddade hembesök/mån", value: "8 st" }, { label: "Besparing/mån", value: "~160 000 kr" }] }],
      hold: 800,
    },
    {
      say: "Och det stannar inte vid första affären. En kund som installerat solceller erbjuds batterilager sex månader senare när priserna är rätt. En fastighetsägare med solceller erbjuds laddboxar till parkeringen. Merförsäljning — helt automatisk.",
      panels: [{ kind: "bars", title: "MERFÖRSÄLJNING PER TJÄNST", rows: [{ label: "Batterilager", value: 44 }, { label: "Laddbox elbil", value: 31 }, { label: "Elinstallation", value: 18 }, { label: "Utbyggnad", value: 7 }] }],
      hold: 800,
    },
    {
      say: "Du ser allt i realtid — varje lead, varje konversation, varje avtal. Senaste månaden: 284 inkommande leads. 198 svarade. 67 bokade möten. 41 signerade avtal. 2 340 000 kronor i omsättning. Titta här.",
      rings: true,
      switchTab: "dashboard",
      panels: [
        { kind: "metric", title: "OMSÄTTNING · 30 DAGAR", value: "2 340 000 kr", sub: "41 signerade avtal", accent: true },
        { kind: "stats", title: "NYCKELTAL", items: [{ label: "AI-bokade möten", value: "78%" }, { label: "Svarstid", value: "45 sek" }, { label: "Säljcykel", value: "8 dagar" }, { label: "ROI", value: "11x" }] },
      ],
      hold: 3000,
    },
    {
      say: "Solcellsföretaget som har det här behöver aldrig mer oroa sig för att leads svaras för sent, att uppföljningar missas, eller att hembesök inte fylls. Systemet sköter det — dygnet runt.",
      switchTab: "aura",
      panels: [{ kind: "metric", title: "SKILLNADEN", value: "+1 820 000 kr", sub: "genererat av Nova · senaste 30 dagarna", accent: true }],
      rings: true,
      hold: 1000,
    },
  ];
}

export default function NordicSolarHqPage() {
  return (
    <Suspense fallback={null}>
      <HqClient config={{
        brandName: "NORDIC SOLAR",
        apiBase: "/api/nordic-solar-demo",
        dashboardPath: "/nordic-solar-demo/dashboard",
        hideTabs: ["crm", "kalender", "noter"],
        pitchBeats: nordicPitch,
      }} />
    </Suspense>
  );
}
