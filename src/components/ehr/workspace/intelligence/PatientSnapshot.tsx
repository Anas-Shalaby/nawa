"use client";

import { User, Phone, ShieldAlert, Heart, Calendar, Clock, DollarSign, Activity } from "lucide-react";
import { HealthIndicator } from "./HealthIndicator";

interface PatientSnapshotProps {
  patient: {
    id: string;
    name: string;
    phoneNumber: string;
    gender: string;
    age: string;
  };
  bloodGroup: string;
  primaryDoctor: string | null;
  balanceDue: number;
  upcomingAppointment: string | null;
  lastVisitDate: string | null;
  allergies: string[];
  chronicDiseases: string[];
  currentMedications: string[];
  lastDiagnosis: string | null;
  totalVisits: number;
  recentVisitsCount: number;
  noShowCount: number;
  locale: string;
}

export function PatientSnapshot({
  patient,
  bloodGroup,
  primaryDoctor,
  balanceDue,
  upcomingAppointment,
  lastVisitDate,
  allergies = [],
  chronicDiseases = [],
  currentMedications = [],
  lastDiagnosis,
  totalVisits,
  recentVisitsCount,
  noShowCount,
  locale,
}: PatientSnapshotProps) {
  const isAr = locale === "ar";

  return (
    <div className="bg-surface border border-subtle/80 rounded-2xl p-5 shadow-sm space-y-4 text-start">
      
      {/* Top row: Name, Badges, and Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle pb-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-primary">{patient.name}</h1>
            <HealthIndicator
              completedVisitsCount={totalVisits - noShowCount}
              recentVisitsCount={recentVisitsCount}
              noShowCount={noShowCount}
              balanceDue={balanceDue}
              locale={locale}
            />
          </div>
       
        </div>

        <div className="flex items-center gap-2 text-xs text-muted">
          <Phone className="h-3.5 w-3.5" />
          <a href={`tel:${patient.phoneNumber}`} className="hover:text-accent font-mono transition" dir="ltr">
            {patient.phoneNumber}
          </a>
        </div>
      </div>

      {/* Grid Dashboard: Info blocks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        
        {/* Block 1: Last Visit & Diagnosis */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
            {isAr ? "الزيارة الأخيرة والتشخيص" : "Last Visit & Diagnosis"}
          </span>
          <p className="font-semibold text-primary">{lastVisitDate || (isAr ? "لا يوجد" : "None")}</p>
          {lastDiagnosis && (
            <p className="text-muted/90 truncate font-medium max-w-[180px] mt-0.5" title={lastDiagnosis}>
              {lastDiagnosis}
            </p>
          )}
        </div>

        {/* Block 2: Next Follow-up & Scheduled */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
            {isAr ? "الموعد القادم" : "Next Appointment"}
          </span>
          <p className="font-semibold text-primary flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-accent" />
            <span>{upcomingAppointment || (isAr ? "غير مجدول" : "Not scheduled")}</span>
          </p>
          {primaryDoctor && (
            <p className="text-muted/90 truncate mt-0.5">
              {isAr ? "الطبيب: " : "Doc: "} {primaryDoctor}
            </p>
          )}
        </div>

        {/* Block 3: Outstanding Account Balance */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
            {isAr ? "الحساب المعلق" : "Account Dues"}
          </span>
          <p className={`font-bold flex items-center gap-0.5 ${balanceDue > 0 ? "text-accent-danger" : "text-accent-success"}`}>
            <DollarSign className="h-3.5 w-3.5" />
            <span>{balanceDue} {isAr ? "ج.م" : "EGP"}</span>
          </p>
          <p className="text-muted/90 mt-0.5">
            {isAr ? "الحالات المكتملة: " : "Completed: "} {totalVisits - noShowCount}
          </p>
        </div>

        {/* Block 4: Visits Summary & No shows */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
            {isAr ? "معدل الحضور" : "Attendance Rate"}
          </span>
          <p className="font-semibold text-primary">
            {isAr ? "إجمالي الحجوزات: " : "Total Bookings: "} {totalVisits}
          </p>
          {noShowCount > 0 && (
            <p className="text-accent-danger font-semibold mt-0.5">
              {isAr ? "مرات الغياب: " : "No-Shows: "} {noShowCount}
            </p>
          )}
        </div>

      </div>

      {/* Critical Lists Block: Allergies, Chronic Diseases & Medications */}
      {(allergies.length > 0 || chronicDiseases.length > 0 || currentMedications.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-subtle/70 pt-3">
          
          {/* Allergies Alerts */}
          {allergies.length > 0 && (
            <div className="flex gap-2 items-start bg-accent-danger/5 border border-accent-danger/10 p-2.5 rounded-xl text-xs">
              <ShieldAlert className="h-4.5 w-4.5 text-accent-danger flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-accent-danger font-bold uppercase tracking-wider text-[10px] block mb-1">
                  {isAr ? "الحساسية" : "Known Allergies"}
                </strong>
                <div className="flex flex-wrap gap-1">
                  {allergies.map((a, i) => (
                    <span key={i} className="rounded bg-accent-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent-danger">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chronic diseases */}
          {chronicDiseases.length > 0 && (
            <div className="flex gap-2 items-start bg-accent/5 border border-accent/15 p-2.5 rounded-xl text-xs">
              <Activity className="h-4.5 w-4.5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-accent font-bold uppercase tracking-wider text-[10px] block mb-1">
                  {isAr ? "الأمراض المزمنة" : "Chronic Conditions"}
                </strong>
                <div className="flex flex-wrap gap-1">
                  {chronicDiseases.map((d, i) => (
                    <span key={i} className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Medications list */}
          {currentMedications.length > 0 && (
            <div className="flex gap-2 items-start bg-accent-success/5 border border-accent-success/15 p-2.5 rounded-xl text-xs">
              <Heart className="h-4.5 w-4.5 text-accent-success flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-accent-success font-bold uppercase tracking-wider text-[10px] block mb-1">
                  {isAr ? "الأدوية المستمرة" : "Active Medications"}
                </strong>
                <div className="flex flex-wrap gap-1">
                  {currentMedications.map((m, i) => (
                    <span key={i} className="rounded bg-accent-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent-success">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
