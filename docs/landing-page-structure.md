# الصفحة التسويقية — Landing Page

> المسار: `/{locale}`
> التجميع: `src/components/landing/LandingPage.tsx`
> آخر تحديث: 2026-07-17

الـ Landing مستقلة بصريًا عن Dashboard، تدعم light/dark عبر `LandingThemeProvider`، ومحتواها عربي RTL حاليًا داخل `<main dir="rtl">`.

## ترتيب الصفحة الحالي

```text
LandingNav
└── HeroSection
    ProblemAgitationSection
    ROICalculatorSection
    BentoFeaturesSection             #features
    TrustSection
    ValuePropositionSection          #value
    PricingSection                   #pricing
LandingFooter
```

## 1. LandingNav

- شريط sticky بخلفية شفافة وblur.
- شعار نواة وروابط داخل الصفحة.
- روابط المميزات، القيمة، والأسعار.
- Language switcher وtheme toggle.
- CTA للتسجيل.

الملف: `src/components/landing/LandingNav.tsx`.

## 2. HeroSection

- badge قصير.
- headline gradient.
- subheadline يشرح قيمة المنتج.
- CTA أساسي إلى `/register?plan=free_6mo`.
- CTA ثانوي إلى `#features`.
- `HeroDashboardPreview` يعرض نسخة UI تفاعلية/تمثيلية من النظام، وليست screenshot.

الملفات:

- `HeroSection.tsx`
- `HeroDashboardPreview.tsx`

## 3. ProblemAgitationSection

يحوّل مشاكل التشغيل اليومية في العيادة إلى قصة واضحة قبل عرض الحل: ضغط الاستقبال، المواعيد الضائعة، التحصيل، وتشتت المتابعة.

الملف: `ProblemAgitationSection.tsx`.

## 4. ROICalculatorSection

حاسبة تفاعلية لتوضيح أثر النظام ماليًا بدل الاكتفاء بادعاء تسويقي. النتائج تقديرية وتسويقية، وليست مرتبطة ببيانات عيادة مسجلة.

الملف: `ROICalculatorSection.tsx`.

## 5. BentoFeaturesSection

قسم `#features` يعرض إمكانيات المنتج في Bento Grid مع mini UI replicas، مثل:

- الاستقبال والطابور.
- CRM وWhatsApp.
- السجل الطبي المرئي.
- المالية والعائد.
- أدوات التشغيل والمتابعة.

البطاقات تستخدم Framer Motion عند دخول viewport.

الملف: `BentoFeaturesSection.tsx`.

## 6. TrustSection

قسم إثبات وثقة بين عرض المميزات والقيمة، مصمم لتعزيز وضوح الفائدة وتقليل تردد التسجيل.

الملف: `TrustSection.tsx`.

## 7. ValuePropositionSection

قسم `#value` يشرح القيمة التشغيلية طويلة المدى، ومنها:

- حلقة الرعاية والاستدعاءات.
- الأرصدة والمالية.
- الأجندة والمتابعة.

الملف: `ValuePropositionSection.tsx`.

## 8. PricingSection

قسم `#pricing` يعرض الخطط الحالية ويحول الاختيار إلى registration query parameter. أي تغيير في الخطط يجب أن يظل متسقًا مع:

- `src/lib/queries/subscriptionPlans.ts`
- registration flow
- `tenant_subscriptions`
- ترجمات `landing.pricing`

لا توثّق سعرًا ثابتًا هنا؛ المصدر التنفيذي هو بيانات/منطق الخطط الحالي.

## 9. LandingFooter

Footer بسيط للهوية وtagline بدون تشتيت أو navigation كثيف.

## نظام الثيم

- `LandingThemeProvider` يحفظ ويطبق الثيم.
- `LandingThemeToggle` يبدّل light/dark.
- الألوان تستخدم design tokens وlanding-specific CSS variables.
- خلفية glow ثابتة تُرسم خلف الصفحة.

Dashboard لا يرث ثيم Landing؛ واجهات الموظفين تظل داكنة.

## الحركة والوصول

- دخول hero تدريجي.
- sections تستخدم `whileInView`.
- CTA targets كبيرة على الهاتف.
- الرسوم ليست المصدر الوحيد للمعلومة.
- يجب احترام reduced motion عند إضافة حركة جديدة.

## الملفات

```text
src/components/landing/
├── LandingPage.tsx
├── LandingThemeProvider.tsx
├── LandingThemeToggle.tsx
├── LandingNav.tsx
├── HeroSection.tsx
├── HeroDashboardPreview.tsx
├── ProblemAgitationSection.tsx
├── ROICalculatorSection.tsx
├── BentoFeaturesSection.tsx
├── TrustSection.tsx
├── ValuePropositionSection.tsx
├── PricingSection.tsx
└── LandingFooter.tsx
```

الترجمات: `src/messages/ar.json` و`src/messages/en.json` تحت namespace `landing`.

## تمييز المسارات

| الصفحة | المسار | الغرض |
|---|---|---|
| Landing | `/{locale}` | التسويق والتسجيل |
| Login/Register | `/{locale}/login`, `/register` | مصادقة العيادات |
| Dashboard | `/{locale}/dashboard` | تشغيل العيادة |
| Public Booking | `/{locale}/{slug}` | حجز المريض |
| Success Ticket | `/{locale}/{slug}/success?t=...` | تذكرة الحجز والإلغاء والاتجاهات |

## قواعد التحديث

- عند إضافة/حذف section حدّث هذا الملف وترتيب `LandingPage.tsx`.
- لا تعرض feature غير متاحة كأنها مكتملة؛ صفحات Staff/Marketing/AI ما زالت Coming Soon.
- الـ mini UIs عروض تسويقية ولا يجب أن تُفهم كبيانات live.
- CTA الأساسي يجب أن يمرر plan صالحًا يدعمه registration flow.
