# Nawah UX Redesign Audit

> Lead Product Design audit — **no implementation yet**.  
> Date: July 2026 · Scope: Prescription · Mission Control / Today · Financials · Analytics  
> Principle: every screen answers **one question**. Think Linear / Notion / Stripe / Raycast — not hospital software from 2012.

**Hard constraints (confirmed):**

- Do **not** invent random product features outside the redesign of existing surfaces
- Preserve architecture & database first; any schema needs will be flagged as optional follow-ups
- Target: reduce visual load ≥30% per page, max ~3 accent colors, more whitespace, typography-first

**One-question north star**

| Surface | One question it must answer in 3 seconds |
|---------|------------------------------------------|
| Prescription | What should this patient take, and can I print/send it now? |
| Mission Control | Who needs action next in the live floor? |
| Today (Home) | How is my clinic doing *right now*, and what should I do next? |
| Financials | How much did we make, and who still owes us? |
| Analytics | Is the clinic growing healthier over time? |

---

## Global UX findings (cross-cutting)

| Problem | Why it hurts | Fix direction |
|---------|--------------|---------------|
| Dashboard home = Mission Control only | No executive “Today” view; ops floor and strategy fight for home | Split: Home = Today executive · Mission Control = dedicated ops route (or deep link) |
| Competing status color systems | Queue, money, attention, rooms, wait timers all shout | One muted base + **one** accent + **one** danger |
| Duplicate metrics across screens | Same unpaid / attention / KPIs in 3 places | Each metric owns one home; others link in |
| CTAs without outcomes | Floor Print / Emergency toast / fake checkboxes | Every button = clear result or remove |
| Locale gaps | Hardcoded Arabic on Financials / Rx WhatsApp | All UI strings via i18n |

---

# 1. Prescription experience

**Current primary files**

- `src/components/clinical/PrescriptionBuilder.tsx`
- `src/lib/clinical/prescriptionCatalog.ts`
- `src/components/ehr/PatientDetailShell.tsx`
- `src/actions/savePatientPrescription.ts`

**Current one-liner:** Full-screen builder with search + 3 templates + selects + live paper — but dosage feels like forms, history is fake (notes), no favorites / prior Rx reuse.

### Problems

1. Feels like “smart textarea” — dosage/form/frequency as boring selects, not a guided builder
2. No favorites, no “previous prescriptions”, no true duplicate from history
3. Catalog tiny & static; custom add exists but weak
4. Save appends into `patients.notes` — no structured Rx entity → “past Rx” in EHR is actually visit notes
5. Two print paths (builder paper vs crude visit-note popup)
6. No chronic-meds lane, no save-as-template beyond 3 hardcoded packs
7. Preview always on even when empty — density tax
8. WhatsApp / branding strings partially hardcoded

### Why it hurts usability

Doctors write Rxs dozens of times/day. Friction compounds. Wrong history destroys trust. Print inconsistency looks unprofessional to patients.

### Proposed redesign

**Flow (visual builder):**

```
Search / Favorites / Previous / Templates
        ↓
Pick medicine (catalog | custom | chronic)
        ↓
Dosage → Frequency → Duration → Notes   (step chips, not raw text)
        ↓
Line appears on Rx
        ↓
Live Arabic prescription preview (A4)
        ↓
Print | WhatsApp | Save | Save as template | Duplicate
```

**Must-have UX**

| Capability | UX treatment |
|------------|--------------|
| Instant search | Cmd/Ctrl+K style field; recent + favorites pin above |
| Favorites | Star on line / drug; clinic-local list (user or clinic scoped) |
| Previous Rxs | Panel “Previous for this patient” — structured cards → Duplicate |
| Dosage builder | Visual steps: Dose amount · Form · Frequency · Duration · Optional note |
| Custom medicine | “Add custom” inline without leaving flow |
| Templates | System packs + **Save current as template** |
| Chronic meds | Toggle “Chronic” → longer duration presets + sticky on patient |
| Print | Single A4 path: clinic branding, doctor name/signature area, QR (ticket or verify URL), RTL Arabic body |
| Preview | Collapsible on small screens; always print-faithful |

**Architecture note (approval gate):**  
Ideal: new `prescriptions` + `prescription_lines` (+ optional `prescription_templates`, `medicine_favorites`).  
Can start **UI-first** with JSON blob in notes as interim — **not recommended** for “previous/duplicate”. Prefer thin migration after approval.

### Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ Rx · Patient Name                              [Esc] [···]  │
├──────────────────────────┬──────────────────────────────────┤
│ [🔍 Search medicines…]   │  ┌─ A4 PREVIEW ────────────────┐ │
│ Favorites · Previous ·   │  │ Clinic logo    date         │ │
│ Templates                │  │ Patient / age               │ │
│ ───────────────────────  │  │ Rx                          │ │
│ Adding: Augmentin 1g     │  │ 1) …                        │ │
│ Dose [1] Form [tab]      │  │ 2) …                        │ │
│ Freq [مرتين يومياً]       │  │                             │ │
│ Dur  [5 أيام]            │  │ Signature        [QR]       │ │
│ Notes [بعد الأكل]        │  └─────────────────────────────┘ │
│ [+ Add line]             │                                  │
│                          │                                  │
│ Lines                    │                                  │
│ • Augmentin …  [★][✎][×] │                                  │
├──────────────────────────┴──────────────────────────────────┤
│ [Duplicate] [Save template]     [WhatsApp] [Print] [Save] │
└─────────────────────────────────────────────────────────────┘
```

| Priority | Expected impact | Complexity |
|----------|-----------------|------------|
| **P0** | Highest trust + daily doctor delight | **High** (UI + likely schema) |

---

# 2. Mission Control

**Current:** `/dashboard` → `MissionControlShell` only  
Files under `src/components/dashboard/mission-control/`

**Current one-liner:** Powerful but overwhelming — 7–8 sticky KPIs, 3 scrolling columns, duplicated Attention, packed patient cards, weak Print/Emergency CTAs.

### Problems

1. Too many cards / KPIs / color languages at once
2. PatientOpsCard shows 5–8 chips before the next action
3. Attention Center duplicated left + right
4. Sticky KPI bar + triple scroll = dashboard fatigue
5. Print / Emergency feel fake or incomplete
6. Empty-state checklist looks clickable but isn’t
7. Home is fused with ops floor — no calm “Today”

### Why it hurts usability

Doctor/reception needs an answer in 3 seconds: **who is next?** Current UI asks them to parse a war room.

### Proposed redesign

**One question:** Who needs action on the live floor?

**Primary information only (per patient):**

- Patient name  
- Waiting time  
- Current stage (Outside / Waiting / Doctor)  
- **Next action** (single primary button)

Everything else (insurance, arrival source, unpaid badge, follow-up chip, room dots, multi-KPI strip) → secondary row / overflow menu / detail drawer.

**Layout**

```
┌────────────────────────────────────────────────────────────┐
│ Floor · Today                          [Walk-in] [Search]  │
│ ░░░░░░░░░░░░░░░░░ capacity thin bar ░░░░░░░░░░░░░░░░░░░░░  │
├──────────────┬──────────────┬──────────────┬───────────────┤
│ OUTSIDE      │ WAITING      │ WITH DOCTOR  │ NEXT         │
│ count        │ count        │ count        │              │
│              │              │              │ Suggested    │
│ · Name       │ · Name  12m  │ · Name       │ next patient │
│   [Check in] │   [Start]    │   [Complete] │ [Call next]  │
│              │              │              │              │
│              │              │              │ Quiet alerts │
│              │              │              │ (max 3)      │
└──────────────┴──────────────┴──────────────┴───────────────┘
```

**Rules**

- Max **1** sticky summary (thin capacity or 3 counts only — not 8 chips)
- One Attention list (right rail or bottom), max 3 items
- Remove room pulse carnival; show busy rooms only on demand
- Cash / revenue → link to Financials (or Today), not here
- Print = real document or remove  
- Emergency = real flow or remove from primary grid

| Priority | Expected impact | Complexity |
|----------|-----------------|------------|
| **P0** | Biggest daily calm for ops | **Medium–High** (mostly UI refactor; keep realtime/state machine) |

---

# 3. Today Dashboard (new Home)

**Current:** There is **no** Today page — home *is* Mission Control.

### Problems

1. Home cannot answer “how is my day?” without becoming MC
2. Executive metrics are scattered (MC bar, Financials, Analytics)
3. Quick actions buried in MC left rail noise

### Why it hurts usability

Owners open the app for orientation. Ops staff open for triage. Forcing both into one screen fails both.

### Proposed redesign

**One question:** How is my clinic today, and what’s the next useful action?

**Route proposal**

- `/dashboard` → **Today** (executive)
- `/dashboard/floor` or keep `/dashboard/mission` → Mission Control  
  (or: Today is default for owner/manager; Floor default for receptionist — later)

**Structure (nothing more)**

```
Good morning, {name}
{Clinic} · {weekday date}

┌─ Quick actions ─────────────────────────────┐
│ [Open floor] [Walk-in] [New booking] [Rx]   │
└─────────────────────────────────────────────┘

┌ Today ─┐ ┌ Queue ─┐ ┌ Done ─┐ ┌ Revenue ┐
│ 12     │ │ 4 wait │ │ 7     │ │ 4,200   │
└────────┘ └────────┘ └───────┘ └─────────┘

┌ Outstanding ─┐ ┌ Inventory alerts ─┐
│ 3 patients   │ │ 2 low stock       │
└──────────────┘ └───────────────────┘

Upcoming (next 5)          Team availability
· 11:00 Sara · Cleaning    · Dr. A Available
· …                        · …

Recent patients (3)
```

**Rules**

- Every card = one number or one short list  
- No charts on Today (link to Analytics/Financials)  
- No duplicate Attention war room  

| Priority | Expected impact | Complexity |
|----------|-----------------|------------|
| **P0** | Product feels intentional | **Medium** (compose existing queries; routing/nav) |

---

# 4. Financial page

**Current:** `FinancialsShell` — 4 loud KPIs (incl. pulsing debt), purple area chart, debtors+WhatsApp, income/expense ledger.

### Problems

1. Data dump, not decisions
2. Pulsing debt + many red/green tiles = anxiety, not clarity
3. Hardcoded Arabic sections in EN locale
4. “Expenses” proxied / unclear vs real COGS
5. Ledger lacks filters; PDF receipt incomplete fields
6. No week view, payment methods, top services, AOV, collections

### Why it hurts usability

Doctor needs: earned / owed / why. They get decorative money cards.

### Proposed redesign

**One question:** How much did we make, and who still owes us?

```
Period: [Today] [Week] [Month]     (one control)

┌ Earned ─────┐ ┌ Outstanding ┐ ┌ Collections ┐ ┌ AOV ──┐
│ big number  │ │ big number  │ │ % or EGP    │ │ EGP   │
└─────────────┘ └─────────────┘ └─────────────┘ └───────┘

Revenue trend (simple area, theme accent only)
Top services (horizontal bars OR ranked list)
Payment methods (if data exists; else hide — no vanity)

Two columns:
  Outstanding patients → [Record payment] [WhatsApp]
  Recent payments

No-show losses (secondary, one line + spark)
```

**Remove / demote**

- Pulsing animation  
- Fake-feeling expense framing unless defined clearly  
- Purple hardcoded chart  
- Vanity metrics without action  

| Priority | Expected impact | Complexity |
|----------|-----------------|------------|
| **P1** | Money clarity → trust | **Medium** (query shaping; i18n; UI) |

---

# 5. Analytics (Business intelligence)

**Current:** `AnalyticsDashboardShell` + `AnalyticsKpiBar` — 5 chart cards; attendance story duplicated; single-value charts waste space; no ranges.

### Problems

1. Charts without a KPI strip of big answers
2. Duplicate attendance (donut + bars)
3. Saved hours / warning patients as tiny charts instead of numbers
4. No growth / retention / no-show trend / busy hours narrative as decisions
5. No drill-down
6. Feels unfinished vs MC density

### Why it hurts usability

Analytics should answer growth. Today it answers “we drew five charts.”

### Proposed redesign

**One question:** Is my clinic getting healthier over time?

```
Range: [7d] [30d] [90d]     Compare: previous period (optional v2)

KPI row (big numbers only):
New patients | Returning % | No-show % | Cancel % | Revenue growth %

Sections (each one question):
1. Growth — patients & revenue over time (one combo chart max)
2. Demand — busy hours + popular services
3. Reliability — no-show / cancel trend
4. Operations — avg wait + doctor utilization (if data exists)
5. Retention — returning vs new

Empty/missing metric → hide card entirely (no fake zeros theater)
```

**Reuse existing signals:** attendance, peak hours, warnings — elevate to numbers first, charts second.

| Priority | Expected impact | Complexity |
|----------|-----------------|------------|
| **P1** | Differentiates “SaaS” from ops tool | **Medium–High** (metrics definition + queries) |

---

# Priority roadmap (recommended)

| Phase | Scope | Why |
|-------|-------|-----|
| **Phase 1** | Today Home + Mission Control simplification | Daily calm; shippable without schema drama |
| **Phase 2** | Prescription premium workflow (+ schema) | Highest clinical emotional peak |
| **Phase 3** | Financials decision UI | Money trust |
| **Phase 4** | Analytics BI | Growth story |

Each phase: reduce ≥30% chrome, enforce 3-color rule, one question per page.

---

# Impact × complexity matrix

```
                High impact
                     │
     MC simplify ●   │   ● Prescription
     Today Home  ●   │
                     │   ● Financials
                     │         ● Analytics
                     │
Low complexity ──────┼──────────────── High complexity
                     │
```

---

# UX rules checklist (for implementation later)

- [ ] Every page subtitle states the one question  
- [ ] ≤3 colors (base text, accent, danger)  
- [ ] Primary action obvious without scan  
- [ ] No duplicate metric surfaces  
- [ ] Tables readable; big numbers for KPIs  
- [ ] Buttons: Print / Emergency / WhatsApp only if fully wired  
- [ ] Locale-complete  
- [ ] Mobile: one primary region at a time  

---

# Explicit non-goals (this redesign)

- Building Marketing / AI modules  
- Auto WhatsApp send  
- Permission-level RLS rewrite  
- Random new sidebar destinations beyond Today vs Floor split  
- Visual theme overhaul beyond token discipline  

---

# Approval gates — decided (2026-07-19)

| Gate | Decision |
|------|----------|
| 1. Home split | **Yes** — `/dashboard` = Today · Mission Control → `/dashboard/floor` |
| 2. Prescription storage | **Formal migration** — `prescriptions` + lines + templates/favorites (Phase 2) |
| 3. Implementation order | **Phase 1 → 2 → 3 → 4** |
| 4. Role-aware home | **Later** — everyone lands on Today in Phase 1 |

---

## Implementation status

- [x] Audit approved  
- [x] Phase 1 — Today Home + Floor simplification  
- [x] Phase 2 — Prescription premium + schema  
- [x] Phase 3 — Financials decision UI  
- [x] Phase 4 — Analytics BI
