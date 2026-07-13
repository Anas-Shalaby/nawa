# شكل الصفحة الرئيسية (Landing Page)

المسار: `/{locale}` → `src/app/[locale]/page.tsx` → `LandingPage`

هذه هي الصفحة التسويقية العامة لـ **نواة** (ليست لوحة التحكم). تدعم RTL، وتدعم الوضع الفاتح/الداكن عبر `LandingThemeProvider`.

---

## مخطط الصفحة من الأعلى للأسفل

```
┌──────────────────────────────────────────────┐
│  LandingNav (sticky)                         │
│  شعار نواة | روابط أقسام | لغة | ثيم | CTA   │
├──────────────────────────────────────────────┤
│  HeroSection                                 │
│  عنوان كبير في المنتصف                       │
│  + معاينة تفاعلية للوحة التحكم (Mock UI)     │
├──────────────────────────────────────────────┤
│  BentoFeaturesSection  (#features)           │
│  شبكة Bento للمميزات مع Mini UIs             │
├──────────────────────────────────────────────┤
│  ValuePropositionSection  (#value)           │
│  3 أعمدة: لماذا نواة                         │
├──────────────────────────────────────────────┤
│  PricingSection  (#pricing)                  │
│  خطتان: مجاني / مدفوع                        │
├──────────────────────────────────────────────┤
│  LandingFooter                               │
│  شعار + جملة قصيرة                           │
└──────────────────────────────────────────────┘
```

---

## 1) الشريط العلوي — `LandingNav`

- **Sticky** أعلى الصفحة مع خلفية شفافة + blur.
- اليمين (في RTL): شعار نواة + اسم البراند.
- الوسط/اليسار: روابط تنقل داخل الصفحة:
  - المميزات → `#features`
  - لماذا نواة → `#value`
  - الأسعار → `#pricing`
- أدوات: تبديل اللغة، تبديل الثيم (فاتح/داكن)، زر **ابدأ الآن** → التسجيل.

الملف: `src/components/landing/LandingNav.tsx`

---

## 2) الهيرو — `HeroSection`

أول viewport بصريًا:

1. **عنوان رئيسي** في المنتصف (من الترجمة `landing.hero.headline`):
   > عيادتك.. تعمل بدقة ساعة سويسرية.
2. أسفله مباشرة: **`HeroDashboardPreview`**  
   إطار نافذة يشبه لوحة التحكم (طوابير / مالية) — UI مصغّر تفاعلي وليس صورة ثابتة.

لا يوجد CTA نصي كبير تحت العنوان في النسخة الحالية؛ التركيز على العنوان + المعاينة الحية.

الملفات:
- `src/components/landing/HeroSection.tsx`
- `src/components/landing/HeroDashboardPreview.tsx`

---

## 3) المميزات (Bento) — `BentoFeaturesSection`

قسم `#features` بتخطيط **Bento Grid**:

- بطاقات `rounded-2xl` بخلفية `bg-surface` وحدود `border-subtle`.
- كل بطاقة فيها عنوان + وصف + **Mini UI** يوضح الميزة:
  - ROI / نمو الإيرادات (شارت أعمدة)
  - Before/After الطبي
  - طابور Master-Detail
  - ومميزات أخرى حسب المحتوى في الترجمة `landing.bento`

الحركة: ظهور تدريجي عند السكرول (`framer-motion` + `whileInView`).

الملف: `src/components/landing/BentoFeaturesSection.tsx`

---

## 4) القيمة المقترحة — `ValuePropositionSection`

قسم `#value`:

- عنوان + وصف قصير في البداية.
- شبكة من **3 بطاقات** (على الديسكتوب):
  1. حلقة الرعاية / المتابعة
  2. الأقساط والمالية
  3. الأجندة والمواعيد

كل بطاقة: أيقونة + عنوان + فقرة قصيرة.

الملف: `src/components/landing/ValuePropositionSection.tsx`

---

## 5) الأسعار — `PricingSection`

قسم `#pricing`:

- خطتان جنب بعض:
  - **مجاني 6 أشهر** (مميزة بصريًا بحدود/ظل accent)
  - **مدفوع 6 أشهر**
- كل بطاقة: سعر، قائمة مزايا، زر CTA للتسجيل.

الملف: `src/components/landing/PricingSection.tsx`

---

## 6) الفوتر — `LandingFooter`

- صف بسيط: شعار نواة + جملة tagline.
- بدون روابط كثيفة.

الملف: `src/components/landing/LandingFooter.tsx`

---

## هيكل الملفات

```
src/components/landing/
├── LandingPage.tsx              ← يجمع كل الأقسام
├── LandingThemeProvider.tsx     ← ثيم فاتح/داكن
├── LandingThemeToggle.tsx
├── LandingNav.tsx
├── HeroSection.tsx
├── HeroDashboardPreview.tsx     ← معاينة اللوحة داخل الهيرو
├── BentoFeaturesSection.tsx
├── ValuePropositionSection.tsx
├── PricingSection.tsx
└── LandingFooter.tsx
```

الترجمات: `src/messages/ar.json` و `en.json` تحت مفتاح `landing`.

---

## ملاحظات تصميم سريعة

| العنصر | القرار |
|--------|--------|
| الاتجاه | RTL (`dir` من الـ locale) |
| العرض | محتوى مركزي تقريبًا `max-w-6xl` |
| الألوان | نظام نواة: `bg-base` / `bg-surface` / `text-accent` (#6C5CE7) |
| الحركة | `framer-motion` في الهيرو والأقسام |
| الهدف | تسويق المنتج → دفع المستخدم للتسجيل |

---

## تمييز مهم

| الصفحة | المسار | الغرض |
|--------|--------|--------|
| الصفحة الرئيسية (هذه) | `/{locale}` | Landing تسويقي |
| لوحة التحكم | `/{locale}/dashboard` | تشغيل العيادة اليومي |
| بوابة حجز المريض | `/{locale}/{slug}` | حجز موعد عام |
