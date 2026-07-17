# Nawa (نواة) — حالة المنتج والهندسة

> آخر تحديث: 2026-07-17
> هذا الملف يصف الحالة الحالية فقط. سجل Git هو المرجع للتاريخ التفصيلي.

## الحالة الحالية

النواة التشغيلية للمنتج مكتملة كـ SaaS متعدد العيادات: onboarding، استقبال يومي، حجز عام، CRM، EHR، مالية، مخزون، إعدادات، اشتراكات، وإدارة منصة.

لا توجد مهمة هندسية نشطة مسجلة داخل هذه الوثيقة.

## مكتمل

### المنصة والأساس

- [x] Next.js 14 + TypeScript + Tailwind + App Router.
- [x] Supabase Auth/Database/Storage/Realtime.
- [x] تعدد العيادات بـ `tenant_id` وRLS.
- [x] Arabic-first routing مع `next-intl` ودعم RTL/LTR.
- [x] تسجيل عيادة، تسجيل دخول، session refresh، وdev auth fallback.
- [x] التحقق من تعطيل العيادة وانتهاء الاشتراك.
- [x] Super Admin مع إدارة العيادات والتعليق/التفعيل.

### Reception Mission Control

- [x] صفحة 3 panes بدون page scroll على desktop.
- [x] Walk-in مدمج في Quick Ops.
- [x] مهام انتظار، تحصيل أمس، وتأكيدات الغد.
- [x] Live Floor: Outside / Waiting / Doctor.
- [x] drag-and-drop مع optimistic updates وrollback.
- [x] room radar مشتق من الجلسات.
- [x] live payment ticker وcapacity gauge.
- [x] إخفاء بيانات الإيراد حسب الدور.

### المواعيد والوقت

- [x] workflow كامل: pending → confirmed → checked-in → in-session → completed.
- [x] canceled وno-show.
- [x] ساعات عمل أسبوعية وشفتات متعددة.
- [x] blocked time exceptions.
- [x] slot generation بتوقيت القاهرة مع فحص المدة والتعارض.
- [x] جدولة كشف/إعادة كشف من ملف المريض.
- [x] صفحة Upcoming Agenda وإدارة المواعيد المستقبلية.

### الحجز العام

- [x] بوابة عامة عبر `/{locale}/{slug}`.
- [x] اختيار خدمة/تاريخ/موعد وReact Hook Form + Zod.
- [x] فحص ملكية الخدمة وتعارض الموعد على السيرفر.
- [x] Two-strikes soft ban.
- [x] رقم سكرتارية العيادة يظهر عند منع الحجز.
- [x] success ticket بتوقيع HMAC ومدة صلاحية.
- [x] QR، اتجاهات Google Maps، وتعليمات قبل الزيارة.
- [x] self-cancellation محمي بالتذكرة.
- [x] عرض هاتف العيادة وعنوانها/موقعها في Clinic Hero.

### CRM وملف المريض

- [x] بحث وفلاتر وإنشاء/تعديل وأرشفة المرضى.
- [x] Master Header: الهاتف، الزيارات، آخر زيارة، والرصيد.
- [x] 3 تبويبات: السجل الطبي، المواعيد، المالية.
- [x] WhatsApp action menu للموعد والدين والاستدعاء.
- [x] Revenue recall لمرضى الانقطاع الطويل.
- [x] ملاحظات الطبيب ومتابعات/re-exams.

### EHR والروشتة

- [x] patient media مع Supabase Storage وRLS.
- [x] صور before/after/x-ray/general.
- [x] timeline سريري، compare slider، lightbox، وtheater mode.
- [x] e-Prescription full-screen builder.
- [x] drug catalog وقوالب سريعة.
- [x] live paper preview، print، WhatsApp، وحفظ في سجل المريض.

### المالية والمخزون

- [x] patient ledger و`patient_payments`.
- [x] تسجيل دفعات وتقليل الرصيد المستحق.
- [x] Financials dashboard ومؤشرات الإيراد.
- [x] Analytics dashboard منفصل عن صفحة الاستقبال.
- [x] Inventory CRUD وحد أدنى وتنبيهات low/out-of-stock.

### الإشعارات

- [x] Supabase Realtime للحجوزات الجديدة.
- [x] toast + optional sound + unread badge.
- [x] Notification drawer عبر portal.
- [x] فلاتر All/Unread/Urgent.
- [x] operational inventory hydration.
- [x] Unified Inbox في `/dashboard/notifications`.
- [x] context panes للحجوزات، الديون، الإلغاءات، والمخزون.

### إعدادات وهوية العيادة

- [x] إدارة الخدمات والأسعار والمدد والتعليمات.
- [x] ملف الطبيب: الاسم، التخصص، النبذة، الصورة، والغلاف.
- [x] هاتف العيادة العام.
- [x] عنوان العيادة النصي.
- [x] Capture Location عبر Geolocation API.
- [x] تخزين latitude/longitude.
- [x] Google Maps link بالإحداثيات مع fallback للعنوان.
- [x] preview لصفحة الحجز العامة.

### Landing وAuth

- [x] split-screen login/register.
- [x] Landing قابلة لتبديل light/dark.
- [x] Hero dashboard preview.
- [x] Problem/ROI/Bento/Trust/Value/Pricing sections.
- [x] bilingual translations.

## قاعدة البيانات

الموجود حاليًا:

```text
001 initial schema + RLS
002–004 development/auth fixes
005 canceled + realtime
006 advanced services
007 in_session
008 CRM/backfill
009 EHR media/storage
010 financial ledger
011 doctor notes
012 re-examination
013 clinic active state
014 working hours
015 blocked slots
016 EHR HEIF MIME
017 subscriptions
018 doctor profile
019 inventory
020 working-hour shifts
021 clinic contact details and geolocation
```

آخر migration مطلوبة للميزات الموثقة:
`supabase/021_clinic_contact_details.sql`.

## غير مكتمل / حدود حالية

### تكاملات

- [ ] WhatsApp Business API فعلي؛ الحالي يستخدم روابط `wa.me`.
- [ ] reminder cron ورسائل آلية موثوقة من provider خارجي.
- [ ] delivery status webhooks.
- [ ] رابط تأكيد ذكي `/confirm/[token]`.
- [ ] مزامنة Realtime لساحة Mission Control نفسها، وليس الإشعارات فقط.

### نمذجة البيانات

- [ ] جدول prescriptions مستقل؛ V1 يحفظ النص المنسق في `patients.notes`.
- [ ] persistence لحالة قراءة الإشعارات؛ الحالة الحالية داخل session/context.
- [ ] نموذج rooms مستقل؛ الرادار مشتق من `in_session`.
- [ ] billing حقيقي للـ SaaS؛ Super Admin MRR ما زال mock.

### صفحات معلنة وليست مكتملة

- [ ] Staff management.
- [ ] Marketing automation.
- [ ] AI Assistant.

### جاهزية الإنتاج

- [ ] تأكيد تطبيق كل migrations حتى `021` على بيئة الإنتاج.
- [ ] حماية Dashboard بـ login redirect صريح في middleware.
- [ ] hardening لحجز متزامن مزدوج على نفس الـ slot.
- [ ] تضييق سياسات `clinic-branding` storage لتكون tenant-path-scoped.
- [ ] استكمال أصول PWA/icons والتحقق من installability.
- [ ] إضافة test suite آلي؛ لا يوجد script للاختبارات حاليًا.
- [ ] smoke test شامل: register → configure clinic → public booking → queue → payment → EHR.
- [ ] مراجعة rate limiting وحماية public booking من abuse.
- [ ] التأكد من secrets وredirect URLs وStorage policies في production.

## قرارات ثابتة

- Multi-tenancy: shared schema + `tenant_id` + RLS.
- توقيت الأعمال: `Africa/Cairo`.
- الهاتف العام للعيادة هو مصدر التواصل للمريض.
- Geolocation اختيارية وبإذن المستخدم؛ العنوان النصي fallback.
- Dashboard تشغيلية داكنة؛ Landing لها light/dark؛ الورقة المطبوعة فاتحة.
- WhatsApp الحالي zero-cost deep links حتى اعتماد provider.

## تعريف الجاهزية للإصدار

- [ ] Build وlint يمران.
- [ ] migrations مطبقة على target database.
- [ ] tenant isolation مختبر على حسابين مختلفين.
- [ ] soft-ban يعرض هاتف العيادة الصحيح.
- [ ] capture location ثم زر Maps يعملان.
- [ ] الدور غير المالي لا يرى الإيراد.
- [ ] إلغاء الموعد يحرر الـ slot.
- [ ] notification drawer وInbox يعملان في RTL وLTR.
- [ ] prescription print لا يطبع باقي Dashboard.
- [ ] Staff/Marketing/AI موضحة كـ Coming Soon.
