# ملخص التحديث الكبير — الهوية، العضويات، والصلاحيات

تاريخ تقريبي: يوليو 2026  
النطاق: فصل هوية العيادة عن الحساب الشخصي، نموذج العضوية، كتالوج الصلاحيات، وسويتشر تعدد العيادات.

---

## الهدف المعماري

فصل ثلاثة مفاهيم كانت مختلطة في الواجهة والـ JWT:

| المفهوم                     | المعنى                                                      |
| --------------------------- | ----------------------------------------------------------- |
| **هوية العيادة (Clinic)**   | الاسم العام، البراندينج، مواعيد العمل، رابط الحجز           |
| **الحساب الشخصي (Account)** | المظهر، كلمة المرور، تسجيل الخروج — يخص المستخدم لا العيادة |
| **العضوية (Membership)**    | علاقة User × Clinic مع دور وصلاحيات                         |

الـ JWT (`tenant_id`, `staff_role`) يبقى **كاش** للعيادة النشطة، ومصدر الحقيقة للصلاحيات أصبح `clinic_memberships`.

**تحديث لاحق (إنفاذ الصلاحيات):** راجع [authorization-audit.md](./authorization-audit.md) لمصفوفة الصفحات/الإجراءات، الحراسة في الواجهة، وواجهة Roles & Permissions، والمخاطر المتبقية.

---

## المراحل المنفَّذة

### P0 — فصل واجهة الهوية (IA)

**المسارات**

- `/dashboard/settings/clinic` — هوية العيادة العامة (كان يُفهم خطأ كـ «بروفايل الدكتور»)
- `/dashboard/account` — حسابي: المظهر، كلمة المرور، الخروج
- `/dashboard/settings` — مركز إعدادات: رابط الحجز + بطاقات (عيادة / مواعيد / حساب)
- `/dashboard/settings/profile` و `/dashboard/profile` → إعادة توجيه إلى `/settings/clinic`

**التنقل**

- السايدبار: **حسابي** + الإعدادات
- التوب بار: قائمة أفاتار (حسابي / إعدادات العيادة / خروج) + تبديل الثيم
- مكوّن مشترك: `EntityContextHeader` لتوضيح «هل نحن في سياق عيادة أم حساب؟»

**ملفات أساسية**

- `src/components/account/AccountShell.tsx`
- `src/components/dashboard/UserAvatarMenu.tsx`
- `src/components/settings/EntityContextHeader.tsx`
- `src/app/[locale]/dashboard/settings/clinic/page.tsx`
- `src/app/[locale]/dashboard/account/page.tsx`
- `src/actions/changeOwnPassword.ts`

---

### P1 — نموذج العضوية `clinic_memberships`

**ما أُضيف**

- Migration: `supabase/migrations/028_clinic_memberships.sql`
  - جدول: `tenant_id` × `user_id` (فريد)
  - حقول: `role`, `status` (`active` | `suspended` | `invited`), `staff_profile_id`
  - Backfill من `staff_profiles` المرتبطة بمستخدمين
  - RLS على مستوى المستأجر

**الكود**

- `src/lib/auth/membership.ts` — resolve / upsert / sync JWT / list memberships
- `resolveStaffPermissions` يقرأ العضوية أولاً، ويسقط على JWT إن لم تُطبَّق المايجريشن بعد
- التسجيل والدخول ودعوات الفريق وتغيير الدور والتعليق يحدّثون العضوية + JWT معاً
- `ensureClinicOwnerAccess` عند الدخول: يرقّي الحسابات القديمة بدون `staff_role` إلى owner وينشئ عضوية

**ملاحظة تشغيل**

يجب تطبيق migration `028` على Supabase. بدونها النظام يعمل عبر JWT fallback.

---

### P2 — كتالوج الصلاحيات + `assertPermission`

بدل مجموعات أدوار مبعثرة، صار هناك كتالوج واحد:

| الصلاحية        | الاستخدام                                      |
| --------------- | ---------------------------------------------- |
| `revenue.view`  | عرض الإيرادات                                  |
| `queue.manage`  | إدارة الطابور / Mission Control                |
| `walkin.create` | إضافة حضور مباشر                               |
| `clinic.manage` | إعدادات العيادة (جاهزة للتوسيع)                |
| `team.ops`      | عمليات الفريق (حالة، تعيين، …)                 |
| `team.roles`    | تغيير الأدوار / التعليق / ريست كلمة مرور للغير |

**ملفات**

- `src/lib/auth/permissions.ts` — الكتالوج + matrix الأدوار
- `src/lib/auth/staffPermissions.ts` — `assertPermission` + أعلام UI القديمة مشتقة من نفس المصفوفة

**الأدوار الافتراضية (مختصر)**

- `owner` / `admin` → الكل
- `doctor` / `manager` → إيرادات + طابور + walk-in + team ops
- `receptionist` → طابور + walk-in + team ops
- `nurse` / `assistant` / `lab` → بدون صلاحيات افتراضية (قابلة للتوسيع)

تم ربط Team Ops و Mission Control بـ `assertPermission`.

---

### سويتشر تعدد العيادات (على العضويات)

**ما أُضيف**

- Migration: `supabase/migrations/029_multi_clinic_membership_access.sql`
  - قراءة عضويات المستخدم عبر العيادات (`user_id = auth.uid()`)
  - قراءة أسماء العيادات التي للمستخدم عضوية فيها
- Action: `src/actions/switchClinic.ts`
  - يتحقق من العضوية النشطة
  - يحدّث JWT (`tenant_id`, `staff_role`, `staff_profile_id`, `membership_id`)
  - `refreshSession` ثم إعادة تحميل الداشبورد
- UI: `src/components/dashboard/ClinicSwitcher.tsx` في التوب بار
  - يظهر كقائمة منسدلة **فقط** إذا كان للمستخدم عيادتان فأكثر
  - عيادة واحدة = عرض الاسم كالسابق

**كيف يعمل**

العيادة النشطة = `app_metadata.tenant_id` في الجلسة. التبديل = إعادة كتابة الـ claim من صف العضوية. بعدها RLS والصلاحيات يتبعان العيادة المختارة.

---

## Migrations المطلوبة على Supabase

بالترتيب إن لم تُطبَّق بعد:

1. `026_team_ops_hub.sql` / `027_team_invites.sql` (فريق)
2. **`028_clinic_memberships.sql`** (عضويات)
3. **`029_multi_clinic_membership_access.sql`** (قراءة عبر العيادات للسويتشر)

---

## ما لم يُنفَّذ بعد (خطوات لاحقة مقترحة)

- ربط كل actions إعدادات العيادة صراحةً بـ `clinic.manage`
- شاشة إدارة عضويات متعددة العيادات من الإعدادات (دعوة لعيادة ثانية، إلخ)
- حجز متعدد مقدّمي الخدمة / فروع
- overrides صلاحيات على مستوى العضوية (JSONB) فوق الـ role defaults

---

## خريطة ملفات سريعة

```
src/lib/auth/
  membership.ts          # عضوية + list + sync JWT
  permissions.ts         # كتالوج الصلاحيات
  staffPermissions.ts    # resolve + assert
  ensureClinicOwner.ts   # bootstrap مالك عند الدخول

src/actions/
  switchClinic.ts
  changeOwnPassword.ts
  registerClinic.ts      # owner + membership عند التسجيل
  loginClinic.ts         # ensureClinicOwnerAccess
  manageTeam.ts          # sync عضوية مع الدور/التعليق
  missionControl.ts      # assertPermission

supabase/migrations/
  028_clinic_memberships.sql
  029_multi_clinic_membership_access.sql
  030_clinic_roles.sql

src/components/dashboard/
  ClinicSwitcher.tsx
  UserAvatarMenu.tsx
```

---

## اختبار سريع مقترح

1. تطبيق migrations `028` و `029`
2. تسجيل خروج/دخول لحساب مالك قديم → يجب أن يحصل على `staff_role: owner` وعضوية
3. إعدادات: العيادة تحت Settings/Clinic، والحساب تحت Account
4. Team Ops: تغيير دور/تعليق يعمل للمالك/الأدمن فقط
5. إدراج عضوية ثانية لنفس المستخدم على tenant آخر → يظهر السويتشر في التوب بار
