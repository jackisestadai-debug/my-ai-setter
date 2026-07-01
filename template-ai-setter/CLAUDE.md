# Regler för Claude-sessioner i detta projekt

## ABSOLUT FÖRBJUDET

**Ändra ALDRIG dessa filer direkt:**
- `src/app/hq/hq-client.tsx` — delad av ALLA klienter (Rekvo, Glow Studio, Nordic Solar, alla framtida)
- `src/lib/brain.ts`
- `src/lib/prompts/master.ts`

Dessa filer är INFRASTRUKTUR. Ändringar påverkar ALLA klienter samtidigt.

## Rätt sätt att lägga till features

All ny funktionalitet för en specifik klient ska gå via **HqConfig-prop**:

```tsx
// I klientens HQ-sida (t.ex. src/app/klinik-demo/hq/page.tsx)
<HqClient config={{
  brandName: "GLOW STUDIO",
  apiBase: "/api/klinik-demo",
  dashboardPath: "/klinik-demo/dashboard",
  hideTabs: ["crm", "kalender", "noter"],
  // Lägg till nya opt-in features här
}} />
```

Om en feature kräver en ny prop i HqConfig — lägg till den i interfacet med `?` (optional) så befintliga klienter inte påverkas.

## Isoleringsregler

Varje klient har:
- Eget slug i `clients`-tabellen
- Egna API-routes under `/api/<klient-slug>/`
- Egna sidor under `/app/<klient-slug>/`
- Egen `hq_access_key`

| Klient | Slug | Access key |
|--------|------|------------|
| Rekvo (produktion) | `owner` | Hemlig — rör INTE |
| Glow Studio (demo) | `klinik-demo` | `glow-hq-2025` |
| Nordic Solar (demo) | `nordic-solar-demo` | `nordic-hq-2025` |

**Rekvo (slug='owner') får aldrig påverkas av demo-ändringar.**

## Fel som hänt tidigare (lär dig av dessa)

- Nordic Solar-sessionen lade till `<a href="/test-chat">TEST AI</a>` hårdkodat i `hq-client.tsx` — detta kraschade Glow Studio HQ. Rätt sätt: lägg till via HqConfig.
- En session körde SQL i fel Supabase-projekt (itxaapvblgtvslsccbeg istället för whimcvsgiegosrxwsidn).

## Supabase

Rätt projekt: `whimcvsgiegosrxwsidn` (Ireland)
