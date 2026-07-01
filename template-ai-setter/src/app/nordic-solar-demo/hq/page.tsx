import { Suspense } from "react";
import HqClient, { HqPitchBeat } from "@/app/hq/hq-client";

export const metadata = {
  title: "Nordic Solar HQ · NOVA",
  description: "Mission control",
};

export const dynamic = "force-dynamic";

const SOLAR_CONV: { role: "lead" | "setter"; text: string }[] = [
  { role: "lead",   text: "Hej! Jag är intresserad av solceller till mitt hus. Vad kostar det ungefär?" },
  { role: "setter", text: "Hej! Kul att du hör av dig 😊 Det beror lite på takytan och er förbrukning. Hur stort är huset, ungefär?" },
  { role: "lead",   text: "130 kvm, vi har elvärme så vi drar rätt mycket ström" },
  { role: "setter", text: "Perfekt förutsättning för solceller — elvärme ger snabbt återbetalningstid. Vet du hur många kWh ni förbrukar per år?" },
  { role: "lead",   text: "Ja typ 18 000 kWh per år tror jag" },
  { role: "setter", text: "Bra koll! Med 18 000 kWh passar en anläggning på ca 12–14 kWp. Ni kan täcka 70–80% av er förbrukning och sälja överskott tillbaka till elnätet. Är taket åt söder eller sydväst?" },
  { role: "lead",   text: "Sydväst, lite lutning" },
  { role: "setter", text: "Sydväst är utmärkt — nästan lika bra som söder. Jag kan boka in ett kostnadsfritt hembesök där vi mäter taket och räknar på exakt vad ni får tillbaka. Passar det dig denna vecka?" },
  { role: "lead",   text: "Ja gärna, torsdag eller fredag eftermiddag?" },
  { role: "setter", text: "Fredag 13.00 — bokat ✅ Du får en bekräftelse med all info direkt." },
  { role: "lead",   text: "Toppen, tack!" },
];

function nordicPitch(kickoff: string): HqPitchBeat[] {
  return [
    {
      say: kickoff || "Okej — låt mig visa dig exakt vad som händer i ditt solcellsföretag varje dag medan säljarna är ute på hembesök.",
      rings: true,
      panels: [{ kind: "metric", title: "OMSÄTTNING · 30 DAGAR", value: "2 340 000 kr", sub: "41 avtal signerade automatiskt", accent: true }],
      hold: 800,
    },
    {
      say: "Solcellsbranschen har ett specifikt problem: leads söker aktivt, de jämför tre till fyra leverantörer samtidigt, och de väljer den som svarar snabbast. Branschsnittet är fyra till arton timmar. Den som förlorar är den som svarar sist. Nova svarar på fyrtiofem sekunder.",
      panels: [{ kind: "stats", title: "VARFÖR LEADS GÅR TILL KONKURRENTEN", items: [{ label: "Branschsnitt svarstid", value: "4–18 tim" }, { label: "Leads som väljer första svararen", value: "~78%" }, { label: "Värde per förlorat lead", value: "~57 000 kr" }, { label: "Nova svarar på", value: "45 sek" }] }],
      hold: 800,
    },
    {
      say: "Nova kvalificerar direkt — husstorlek, förbrukning, takläge, om de är intresserade av batterilager. Säljaren åker ut till ett hembesök som redan är halvklart. Inga kallsamtal, inget slöseri med tid på leads som inte är redo.",
      panels: [{ kind: "funnel", title: "LEAD-FUNNEL · 30 DAGAR", rows: [{ label: "Leads inkommna", value: 284 }, { label: "Kvalificerade av Nova", value: 112 }, { label: "Bokade hembesök", value: 67 }, { label: "Signerade avtal", value: 41 }] }],
      hold: 800,
    },
    {
      say: "Så här ser en typisk konversation ut. En villaägare med elvärme hör av sig. Nova ställer rätt frågor, räknar på anläggningsstorlek, och bokar hembesöket — allt utan att en säljare är inblandad.",
      autoConv: true,
      conv: SOLAR_CONV,
      hold: 400,
    },
    {
      say: "De leads som inte svarar direkt är inte tappade. Nova följer upp dag två, dag fem, dag tio — med personliga meddelanden om elpriser, ROT-avdrag eller att installationsperioden tar slut. Mer än en tredjedel återaktiveras och bokar möte.",
      closeConv: true,
      panels: [{ kind: "stats", title: "UPPFÖLJNINGAR · 30 DAGAR", items: [{ label: "Skickade uppföljningar", value: "38" }, { label: "Återaktiverade leads", value: "14 st" }, { label: "Ombokade hembesök", value: "9 st" }, { label: "Värde återvunnet", value: "~513 000 kr" }] }],
      hold: 800,
    },
    {
      say: "Ni skickar ut en tekniker för hembesök och kunden dyker inte upp. Det händer i hela branschen. Nova skickar påminnelse dagen innan, bekräftar tidpunkten, och erbjuder omboka direkt om det inte passar. Ni slösar inte tid och resurser på tomma hembesök.",
      panels: [{ kind: "stats", title: "NO-SHOWS HEMBESÖK", items: [{ label: "No-show utan påminnelse", value: "~22%" }, { label: "No-show med Nova", value: "12%" }, { label: "Räddade hembesök/mån", value: "7 st" }, { label: "Besparing i teknikertid", value: "~140 000 kr" }] }],
      hold: 800,
    },
    {
      say: "Efter att solcellerna installerats är kunden varm. Nova följer automatiskt upp med batteri när elpriserna rusar, laddbox när de köper elbil, och utbyggnad av anläggningen om förbrukningen ökar. Merförsäljning utan extra säljare.",
      panels: [{ kind: "bars", title: "MERFÖRSÄLJNING EFTER INSTALLATION", rows: [{ label: "Batterilager", value: 44 }, { label: "Laddbox elbil", value: 31 }, { label: "Elinstallation", value: 18 }, { label: "Utbyggnad solceller", value: 7 }] }],
      hold: 800,
    },
    {
      say: "Du ser allt i realtid. Förra månaden: 284 inkommande leads. 112 kvalificerade. 67 hembesök bokade. 41 avtal signerade. 2 340 000 kronor i omsättning — 78% genererat av Nova. Titta här.",
      rings: true,
      switchTab: "dashboard",
      panels: [
        { kind: "metric", title: "OMSÄTTNING · 30 DAGAR", value: "2 340 000 kr", sub: "41 signerade avtal", accent: true },
        { kind: "stats", title: "NOVA · NYCKELTAL", items: [{ label: "AI-bokade möten", value: "78%" }, { label: "Svarstid", value: "45 sek" }, { label: "Säljcykel", value: "8 dagar" }, { label: "ROI", value: "11x" }] },
      ],
      hold: 3000,
    },
    {
      say: "Solcellsföretaget som har det här svarar snabbast, kvalificerar bäst, och förlorar inga leads till konkurrenter som råkar ringa en timme tidigare. Systemet sköter det — dygnet runt.",
      switchTab: "aura",
      panels: [{ kind: "metric", title: "NOVA → OMSÄTTNING", value: "1 820 000 kr", sub: "av totala 2 340 000 kr · senaste 30 dagarna", accent: true }],
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
        pitchBeats: nordicPitch(""),
      }} />
    </Suspense>
  );
}
