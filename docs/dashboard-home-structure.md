# الصفحة الرئيسية للداشبورد — Reception Mission Control

> المسار: `/{locale}/dashboard`
> التجميع على السيرفر: `src/app/[locale]/dashboard/page.tsx`
> الواجهة: `src/components/dashboard/DashboardShell.tsx`
> آخر تحديث: 2026-07-17

## الهدف

الصفحة ليست Dashboard تحليلات تقليدية؛ هي شاشة تشغيل لحظية لموظف الاستقبال. تجمع أهم إجراءات اليوم في viewport واحد على desktop، بينما توجد التحليلات الثقيلة في `/dashboard/analytics`.

## التخطيط

```text
12-column grid · desktop 3 / 6 / 3 · h-[calc(100vh-80px)]

┌─────────────────┬────────────────────────────┬─────────────────┐
│ Quick Ops       │ Live Floor                 │ Clinic Radar    │
│ Walk-in         │ Outside | Waiting | Doctor │ Rooms           │
│ Urgent tasks    │ Drag & drop cards          │ Cash ticker     │
│                 │ Daily checklist if empty   │ Capacity gauge  │
└─────────────────┴────────────────────────────┴─────────────────┘
```

الحاوية `dir="rtl"`، لذلك Quick Ops تظهر يمينًا في العربية. على الشاشات الصغيرة تتحول الألواح إلى عمود واحد.

## 1. Quick Ops

### هوية الوردية

- اسم العيادة.
- عنوان Reception Mission Control.
- تاريخ القاهرة المختصر.

### Walk-in مدمج

- اسم المريض.
- رقم WhatsApp مع validation.
- الخدمة.
- زر إضافة مباشر للطابور.

`addWalkIn()` ينشئ الموعد بحالة `checked_in` مباشرة، فتظهر البطاقة في منطقة Waiting، ثم تُضاف محليًا بترتيب الوقت. الخطأ يظهر داخل النموذج، والنجاح يظهر toast.

### المهام العاجلة

- مرضى تجاوزوا حد الانتظار.
- تحصيل متأخرات الأمس، فقط إذا كان الدور يستطيع رؤية الإيراد.
- عدد حجوزات الغد التي ما زالت `pending`.
- Empty state عندما لا توجد إجراءات مطلوبة.

## 2. Live Floor

الساحة تعرض المواعيد التشغيلية فقط، وليس كل سجل اليوم.

| المنطقة | الحالات المرتبطة |
|---|---|
| Outside | `pending`, `confirmed` |
| Waiting | `checked_in` |
| Doctor | `in_session` |

- `completed`, `no_show`, و`canceled` لا تبقى في الساحة.
- كل بطاقة تعرض المريض، الوقت/الخدمة، وزمن البقاء في المنطقة.
- النقل يتم بـ `@hello-pangea/dnd`.
- التحويل إلى منطقة جديدة يرسل الحالة المناسبة عبر `updateAppointmentStatus()`.
- الواجهة تحدث تفاؤليًا؛ عند فشل الحفظ ترجع البطاقة لمكانها وتظهر رسالة خطأ.
- دخول مريض لمنطقة الطبيب يشغّل glow قصير للفت الانتباه.

إذا كانت الساحة فارغة، يظهر `DailyChecklist` بدل أعمدة فارغة، ويعرض إجراءات الغد والتحصيل المتبقي.

## 3. Clinic Radar

### الغرف

- حالتان مشتقتان من أول موعدين `in_session` فقط.
- الغرفة الأولى تُسمّى باسم الطبيب، والثانية «غرفة الإجراءات».
- الغرفة المشغولة تظهر بنقطة حمراء نابضة مع تفاصيل الجلسة.
- الغرفة المتاحة تظهر باللون الأخضر.
- لا يوجد جدول مستقل للغرف؛ هذه قراءة تشغيلية مشتقة وليست إدارة غرف حقيقية.

### Live Cash

- ticker لدفعات اليوم.
- المبالغ مخفية بالكامل عندما `canViewRevenue === false`.
- القائمة تأتي من `patient_payments`.

### السعة

- نسبة الإشغال اليومية `capacityPct`.
- Gauge دائري/بصري مع العدد.
- النسبة محسوبة من حجم التشغيل والقدرة المتاحة، وليست جهاز قياس لحظيًا.

## البيانات

`fetchTodayAppointments(locale)` يعيد:

```text
appointments
clinicName
tenantId
services
initialMiniStats
tomorrowPendingCount
todayPayments
yesterdayUnpaid
rooms
capacityPct
canViewRevenue
```

المواعيد تُحوّل عبر `mapAppointmentRow()`، وتشمل الرصيد المستحق حتى يمكن إظهار مهام التحصيل والسياق المالي.

## مزامنة الحالة

1. الصفحة Server Component تجلب snapshot أولي.
2. `DashboardShell` يدير snapshot المحلي للسحب وWalk-in.
3. `RealtimeProvider` يستمع لإضافات المواعيد الجديدة ويغذي الإشعارات فقط؛ لا يحدّث أعمدة الساحة الحية تلقائيًا.
4. تغييرات الحالة تحفظ في Server Action tenant-scoped.

## الحالات المهمة

- عدم وجود خدمات يعطّل Walk-in.
- عدم صلاحية عرض الإيراد تخفي المبالغ والمهام المالية.
- خطأ تغيير الحالة يعيد الحركة ويظهر toast.
- الصفحة لا تعرض Recharts؛ هذه مسؤولية analytics.
- الوقت والتاريخ دائمًا وفق `Africa/Cairo`.

## التنقل المرتبط

- زر الجرس يفتح Notification Drawer.
- `/dashboard/notifications` يفتح الـ Unified Inbox.
- المريض صاحب دين يفتح `/dashboard/patients/{id}`.
- المخزون والتنبيهات التفصيلية تُدار من صفحاتها المخصصة.
