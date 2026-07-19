# Nawah Clinic OS — Today Experience Design

> **Status:** Design only — **no implementation until approval**  
> **Date:** July 2026  
> **North star:** *What is the next thing the doctor should do?*  
> **Inspiration:** Apple Health · Linear · Stripe · Raycast · Arc  

**Hard constraints**

- Preserve architecture & database; do not invent feature sprawl  
- Today replaces Dashboard  
- Dashboard + Mission Control become **one** experience  
- Max **5** primary sections on Today  
- Remove ≥**40%** of current Today/Floor UI chrome  
- Reports → Reports · Analytics → Insights · Money must not steal focus from flow  

---

# 1. UX audit (current state)

## What exists after Phase 1–4

| Surface | Route | Reality |
|---------|-------|---------|
| **Today** | `/dashboard` | Executive home: greeting, 4 quick actions, up to 6 KPIs, queue list, upcoming, team, recent patients |
| **Floor** | `/dashboard/floor` | Simplified Mission Control: ops rail + kanban + next/alerts |
| **Sibling noise** | sidebar | Today + Floor are *two* homes competing for “start of day” |

## Audit findings

### A. Today still answers “How is the clinic?” — wrong question

| Problem | Why it hurts |
|---------|--------------|
| KPI strip (appointments, waiting, completed, revenue, outstanding, inventory) | Doctor opens app mid-session → reads numbers, not a next action |
| Three parallel lists (queue · upcoming · recent patients) | Duplicate “who is here / who is next” across Today and Floor |
| Team availability on home | Useful for managers; **not** the doctor’s next clinical step |
| Quick actions as equal peers | “Open floor”, “Book”, “Patients”, “Agenda” dilute the primary: **resume care** |
| Financial / inventory KPI links on Today | Violates “money must not distract from patient flow” |

**Verdict:** Today is a calm dashboard — still a dashboard.

### B. Floor answers “Who’s on the board?” — closer, but split

| Problem | Why it hurts |
|---------|--------------|
| Separate `/dashboard/floor` | Forces navigation to do the real job; Today becomes a lobby |
| Three columns + Next rail | Correct ops model, but **Current patient** is not hero-scale |
| Ops / Floor / Alerts tabs (mobile) | Cognitive tax before seeing who is with the doctor |
| Search + walk-in occupy equal weight to patient stages | Tools > patients hierarchy is inverted |

**Verdict:** Floor has the right data; wrong packaging as a second app.

### C. Navigation teaches the wrong mental model

Current Operations:
```
Today → Floor → Upcoming → Notifications
```

User learns: “Home is overview. Ops are elsewhere.”  
Clinic OS needs: “Home **is** the floor of the day.”

### D. Density math (Today + Floor chrome)

Rough inventory of primary visual units doctor confronts in first 10 seconds across Today→Floor:

| Unit type | Count (approx) |
|-----------|----------------|
| Greeting + subtitle | 2 |
| Quick action buttons | 4 |
| KPI cards | 4–6 |
| List panels | 3–4 |
| Floor summary chips | 3 |
| Kanban zones | 3 |
| Next + alerts blocks | 2 |
| Ops controls | 2–4 |
| **Total** | **~25–30** |

Clinic OS target: **≤12** primary units, with **2** dominating (Current · Next).

---

# 2. Information hierarchy

## The only ranking that matters

```
1. CURRENT PATIENT     →  “Who am I treating right now?”
2. NEXT PATIENT        →  “Who is waiting — and what do I do?”
3. TODAY’S STAGE FLOW  →  Outside / Waiting / With doctor (compact)
4. ONE NEXT ACTION     →  Single primary CTA for Current (or Next if idle)
5. MICRO STATUS        →  Optional: waiting count · time · one alert (max 1 line)
```

Everything else is **off-home** or **collapsed**.

## One question per retained surface

| Slot | One question |
|------|----------------|
| Current patient panel | Who is in session — and what’s my next clinical action? |
| Next patient panel | Who is next — and how do I start? |
| Stage strip | Where is the day on the floor? |
| Focus CTA | What button do I press now? |
| Quiet status | Is anything blocking care *right now*? (≤1 alert) |

## Explicit non-answers on Today

| Question | Belongs |
|----------|---------|
| How much did I earn? | Financials / Reports |
| Is the clinic growing? | Insights |
| Who joined the team today? | Team |
| What stock is low? | Inventory |
| What happened last week? | Insights / Reports |
| Who are my recent patients? | Patients |

---

# 3. New navigation

## Principles

- **Today** = Clinic OS home (unified flow)  
- Rename product language: not “Dashboard”, not “Mission Control”  
- Max depth for daily ops: **1 click** from Today to Patients / Book  
- Analytics → **Insights** · Financials → **Money** or keep Financials under a **Reports** group  

## Proposed IA (sidebar)

```
TODAY (home)                    ← /dashboard   [merged Today+Floor]
────────────────────────────────
Work
  Patients
  Schedule                      ← upcoming / agenda (one label)
  Inbox                         ← notifications
────────────────────────────────
Clinic
  Services
  Inventory
  Team
────────────────────────────────
Insights                        ← analytics (rename only)
Money                           ← financials
────────────────────────────────
Account · Settings
```

**Removed from top Operations**

| Nav item | Change | Why |
|----------|--------|-----|
| Floor | **Delete** as separate item | Merged into Today |
| Today’s queue (legacy) | Already replaced | — |
| Marketing / AI | Demote under Insights or hide until used | Not “next patient” |
| Duplicate Schedule vs Upcoming | One label | Reduce synonym load |

**Redirects (implementation later)**

- `/dashboard/floor` → `/dashboard` (permanent)  
- Landing after login stays `/dashboard`  

**Optional role skew (later, not Phase OS-1)**

- Reception focus default: same Today, but Current panel empty → hero = Next / Waiting  
- Doctor: Current always filled when in_session exists  

---

# 4. Wireframes

## A. Today — desktop (Clinic OS)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Good morning, Dr. Amr                          Sat 19 Jul · Clinic Name │
│  What’s next for care today?                                             │
├──────────────────────────────────────────────┬───────────────────────────┤
│                                              │                           │
│  CURRENT                                     │  NEXT                     │
│  ─────────────────────────────────────────── │  ───────────────────────  │
│  [Avatar]  Sara Hassan                       │  Omar Khaled              │
│  Cleaning · 14m in session                   │  Waiting 12m · Check-up   │
│                                              │                           │
│  Primary:  [ Complete visit ]                │  Primary: [ Start ]       │
│  Secondary: Open chart · Rx · Note           │  Secondary: Profile       │
│                                              │                           │
│  (large typography, ~40% of viewport)        │  (~25% of viewport)       │
│                                              │                           │
├──────────────────────────────────────────────┴───────────────────────────┤
│  FLOOR  Outside 2 · Waiting 3 · Doctor 1          [ + Walk-in ] [ Search]│
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                               │
│  │ Outside  │  │ Waiting  │  │ Doctor   │   ← compact cards              │
│  │ · ·      │  │ · · ·    │  │ ·        │      name + wait + 1 action   │
│  └──────────┘  └──────────┘  └──────────┘                               │
├──────────────────────────────────────────────────────────────────────────┤
│  Status  3 waiting · Avg wait 11m            Alert: 1 long wait → handle │
└──────────────────────────────────────────────────────────────────────────┘
```

**Max 5 primary sections**

1. Header (identity + one-line intent)  
2. Current patient  
3. Next patient  
4. Floor stages  
5. Quiet status (± one alert)  

## B. Today — empty / between patients

```
┌────────────────────────────────────────────────────────────┐
│  Good afternoon                                            │
│                                                            │
│     No one in session                                      │
│     Next up: Omar Khaled — waiting 12m                     │
│                                                            │
│            [ Start session ]                               │
│                                                            │
│  Floor preview (collapsed height) …                        │
└────────────────────────────────────────────────────────────┘
```

## C. Today — mobile

```
┌─────────────────────┐
│ CURRENT (full)      │
│ [ Complete ]        │
├─────────────────────┤
│ NEXT                │
│ [ Start ]           │
├─────────────────────┤
│ Floor (swipe lanes) │
├─────────────────────┤
│ Status (1 line)     │
└─────────────────────┘
```

No KPI grid. No revenue. No team strip.

## D. Removed from this viewport (intentionally)

- Greeting subtitle that asks “how is the clinic”  
- 6 KPI cards  
- Quick-action row as hero  
- Upcoming list (use Schedule)  
- Recent patients  
- Team availability  
- Inventory / outstanding balances  
- Radar / cash / insights leftovers  
- Fake checklists  

---

# 5. User flow

## Happy path — doctor between patients

```
Open Nawah (/dashboard)
        ↓
Sees CURRENT empty + NEXT = Omar (waiting 12m)
        ↓
Taps [ Start session ]
        ↓
Omar → CURRENT · status in_session
        ↓
During care: Open chart / Write Rx (secondary)
        ↓
Taps [ Complete visit ]
        ↓
System proposes next waiting patient as NEXT
        ↓
Repeat
```

## Reception path

```
Open Today
        ↓
CURRENT may show doctor session (read) or empty
        ↓
Focus NEXT + Waiting lane
        ↓
Check in from Outside → Waiting
        ↓
Walk-in from compact tool in Floor header only
```

## Interrupt — long wait

```
Status line shows 1 alert
        ↓
Tap alert → focuses Waiting patient with longest wait
        ↓
Primary action available on that card (Start / Reassure path)
```

No toast carnival. No second Attention center.

---

# 6. Justification for every removed component

| Component (current) | Remove / move | Justification |
|---------------------|---------------|---------------|
| Today KPI: Appointments | Remove from Today | Count is implied by Floor; not an action |
| Today KPI: Waiting | Demote to 1-line Status | Needed as context, not a card |
| Today KPI: Completed | Remove | Vanity for mid-day clinical focus |
| Today KPI: Revenue today | → Money | Money must not compete with care |
| Today KPI: Outstanding | → Money | Same |
| Today KPI: Inventory alerts | → Inventory / Inbox | Ops inventory ≠ next patient |
| Quick action: Open Floor | Remove | Floor *is* Today |
| Quick action: Book / Agenda / Patients | Demote to header icons or nav | Tools, not hero |
| Upcoming appointments panel | → Schedule | Duplicates Schedule; not “who is in clinic now” |
| Recent patients panel | → Patients | Historical list, not flow |
| Team availability panel | → Team | Manager curiosity mid-care |
| Floor separate nav item | Remove | Duplicate home |
| Floor 8-metric bar (legacy) | Already cut; keep cut | OK |
| Floor Radar (rooms/cash/insights) | Stay gone | Noise |
| Floor Attention max-3 + Next as side equal | Collapse Alerts into Status; elevate Next beside Current | Hierarchy fix |
| Duplicate Print / fake Emergency | Stay gone | Broken trust |
| Analytics on Today | Never | Insights only |
| Marketing / AI on first glance | Demote | Not clinic OS |

**Density goal:** Today + Floor chrome units **25–30 → ≤12** (~50–60% reduction on the home path).

---

# 7. Cognitive load improvements

| Lever | Change | Effect |
|-------|--------|--------|
| **One home** | Merge Today + Floor | Eliminate “where do I work?” decision |
| **Hero objects** | Current + Next only at large type | Matches working memory (Miller: hold 2) |
| **One primary button** | Complete *or* Start — never both competing as equals on Current | Faster motor decision |
| **≤3 colors** | Base · accent · danger | Already UX rule; enforce on home |
| **Whitespace** | Large Current panel, fewer borders | Premium calm (Apple Health / Linear) |
| **No vanity totals** | Counts only when actionable | Stops “number reading” loop |
| **Alerts ≤1 line** | Or hidden | Prevents Attention Theater |
| **Tools peripheral** | Walk-in / search as header chips | Raycast energy without Raycast chrome |
| **Language** | “What’s next for care?” not “How is my clinic?” | Sets intent |
| **Reports exile** | Insights / Money nav labels | Mental model: Today = care OS |

### Cognitive scorecard (target)

| Moment | Before | After |
|--------|--------|-------|
| Time to identify next action | 5–15s (scan KPIs + nav to Floor) | **<3s** |
| Competing CTAs above fold | 6–10 | **1–2** |
| Distinct data questions on home | 8–12 | **5** |
| Routes to “start work” | 2 (Today, Floor) | **1** |

---

# Proposed product naming (UI copy)

| Old | New |
|-----|-----|
| Dashboard | **Today** |
| Mission Control / Floor | *(absorbed — not named separately)* |
| Analytics | **Insights** |
| Billing & ROI / Financials | **Money** (or Financials under Reports — TBD) |

---

# Implementation sketch (after approval only)

**Phase OS-1 (build)**

1. Merge Floor into `/dashboard` as Clinic OS Today layout  
2. Redirect `/dashboard/floor` → `/dashboard`  
3. Remove KPI / team / recent / upcoming from Today  
4. Build Current + Next hero modules (reuse appointments realtime + status machine)  
5. Keep compact 3-zone Floor under heroes  
6. Nav: drop Floor; rename Analytics → Insights (i18n)  

**Phase OS-2 (polish)**

- Role-aware empty states (reception vs doctor)  
- Command palette (Raycast) for search/walk-in — optional  
- Deep-link Current → chart / Rx  

**Non-goals**

- Rewriting Financials / Insights again  
- New clinical features beyond surface hierarchy  
- Schema changes  

---

# Approval gates — decided (2026-07-19)

| Gate | Decision |
|------|----------|
| 1. Merge Today + Floor | **Yes** → single `/dashboard` Clinic OS |
| 2. Hierarchy | **Approved:** Current → Next → Floor → Status |
| 3. Nav | **Drop Floor** · Analytics → **Insights** |
| 4. Money on Today | **Banned** (no revenue / outstanding / inventory) |
| 5. Implementation | **OS-1 approved & shipped** |

## OS-1 implementation notes

- `ClinicOsShell` is the home experience (Current + Next + Floor + quiet Status)
- `/dashboard/floor` permanently redirects to `/dashboard`
- Sidebar: Today only under Work; Insights label for Analytics route
- No money KPIs on home

---

## Decision

**OS-1 implemented.** Further polish (role-aware empty states, Cmd-K) = OS-2 after feedback.
