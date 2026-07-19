# Patient Workspace — Design Brief

> **Status:** Implemented (v1) — one-scroll Patient Workspace  
> **Route:** `/dashboard/patients/[id]`  
> **Rename:** Patient Profile → **Patient Workspace**  
> **North star:** Complete an entire consultation with almost no navigation.

---

## 1. UX audit (current)

### Structure today
- Sticky-ish header + toolbar + **3 tabs** (Medical · Appointments · Financials)
- Notes are **read-only**; writing requires Agenda elsewhere
- Rx = fullscreen modal · Payment = other tab · Media buried under Medical
- Visits duplicated across Medical / Appointments / Financials

### Problems & time loss

| Problem | Why doctors lose time |
|---------|----------------------|
| Tabs hide the next step | “Where is payment?” / “Where is Rx?” decisions mid-consult |
| Notes not writable here | Leave page → Agenda → find appt → type → save (~5–8 clicks) |
| Rx as another screen | Context switch; closes mental model of the chart |
| Balance not actionable in header | Extra tab for money after care decision already made |
| Visit history thrice | Cognitive re-parse of same chronology |
| Family + strike + book competing in chrome | Tool chrome louder than clinical summary |
| No allergies / chronic diseases surface | Risk scanning depends on memory or CRM blob |

**Click cost today:** consult → note → Rx → follow-up → pay ≈ **19–30**  
**Target:** **5–8** on one surface.

---

## 2. Information hierarchy

```
1. Sticky Patient Header     Who is this? What can I do now?
2. Clinical Summary          What must I not miss?
3. Consultation Notes        What happened today?
4. Prescription              What do they take home?
5. Media                     What did we capture/image?
6. Timeline                  What is their story?
7. Follow-up                 When do we see them again?
8. Billing                   Does anything remain to collect?
```

Secondary (collapsed / end): Family tree, strike, archive ops.

---

## 3. Wireframe (one scroll)

```
┌─ STICKY ──────────────────────────────────────────────────────┐
│ Name · Age · Phone · Today’s appt (service · status)          │
│ [Rx] [Follow-up] [Pay] [WhatsApp]              [Back]         │
├───────────────────────────────────────────────────────────────┤
│ CLINICAL SUMMARY                                              │
│ Allergies — · Chronic — · Meds [list] · Balance · Last visit  │
│ Alerts: strike / long unpaid (if any)                         │
├───────────────────────────────────────────────────────────────┤
│ CONSULTATION NOTES                              [Save]        │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │  large editor…                                          │   │
│ └─────────────────────────────────────────────────────────┘   │
├───────────────────────────────────────────────────────────────┤
│ PRESCRIPTION                                                  │
│ [ inline builder OR expand-in-place ]                         │
├───────────────────────────────────────────────────────────────┤
│ MEDIA (compact visual EHR)                                    │
├───────────────────────────────────────────────────────────────┤
│ TIMELINE  · visit · payment · rx · media · note               │
├───────────────────────────────────────────────────────────────┤
│ FOLLOW-UP   [ Book next visit ]                               │
│ BILLING     Remaining · [ Record payment ]                    │
└───────────────────────────────────────────────────────────────┘
```

No tabs for primary clinical path.

---

## 4. Data gaps (honest)

| Field | Status |
|-------|--------|
| Chronic medications | ✅ `patient_chronic_medications` |
| Outstanding / last visit | ✅ |
| Allergies / chronic diseases | ❌ no columns — show empty state “Not recorded” |
| Age | ❌ DOB often missing — show when present on appointment/patient |
| Inline session notes | ✅ write to today’s `appointments.doctor_notes` when appt exists |

---

## 5. Removed / demoted

| Thing | Action |
|-------|--------|
| Medical / Appointments / Financials tabs | Removed from primary path |
| Duplicate visit lists | Single Timeline |
| Second Rx button redundancy | Header + Prescription section only |
| Read-only notes theatre | Replaced by editor |
| Family in the hero | Move below Timeline |

---

## Implementation

- `PatientDetailShell` → one-scroll workspace (tabs removed)
- `saveConsultationNotes` → writes today’s `appointments.doctor_notes` (fallback: `patients.notes`)
- `PrescriptionBuilder` `layout="inline"` → expands in-page
- i18n: `ehr.workspace.*` (ar/en)
- Design: this document

### Follow-ups (not blocking)

- Structured allergies / chronic diseases columns when product approves schema
- Age from DOB when available
- Collapse Rx by default after first save (personal preference tuning)
