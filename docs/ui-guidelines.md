# Nawa (نواة) — دليل الواجهة الحالي

> آخر تحديث: 2026-07-17
> المرجع العملي للوحة العيادة، بوابة الحجز، الصفحة التسويقية، والواجهات الطبية.

## 1. مبادئ التصميم

- **Operational first:** واجهة الاستقبال كثيفة وسريعة، والأولوية للحالة والإجراء التالي.
- **Arabic first:** العربية وRTL هما الحالة الأساسية، مع دعم إنجليزي كامل.
- **Dark staff workspace:** كل واجهات الموظفين داكنة لتقليل الإجهاد وزيادة وضوح الحالات.
- **Patient clarity:** بوابة المريض بسيطة، mobile-first، وبأهداف لمس لا تقل عن 44px.
- **No stock photography:** نستخدم UI replicas، أشكال مجردة، وأيقونات Lucide. الاستثناء الوحيد المقصود هو رفع صورة الطبيب وغلاف العيادة من الإعدادات.
- **Meaning before decoration:** اللون والحركة يشرحان الحالة ولا يزيّنانها فقط.

## 2. ألوان نواة

القيم الفعلية معرفة في `tailwind.config.ts` وCSS variables:

| Token | القيمة الأساسية | الاستخدام |
|---|---:|---|
| `base` | `#0A0A0F` | خلفية التطبيق |
| `surface` | `#14141F` | البطاقات والألواح |
| `elevated` | `#1E1E2E` | عناصر داخلية وdrawers |
| `subtle` | `#2A2A3C` | الحدود والفواصل |
| `primary` | `#F0F0F5` | النص الأساسي |
| `muted` | `#8888A0` | النص الثانوي |
| `accent` | `#6C5CE7` | CTA والتركيز |
| `accent-success` | `#00CEC9` | نجاح/متاح |
| `accent-warning` | `#FDCB6E` | انتظار/تنبيه |
| `accent-danger` | `#FF6B6B` | خطأ/مخالفة/عجز |

ألوان landing تتغير من خلال `LandingThemeProvider`; لا تفترض أن الصفحة التسويقية داكنة دائمًا.

## 3. الحالات

كل حالة يجب أن تجمع النص مع لون أو أيقونة:

| الحالة | الدلالة البصرية |
|---|---|
| `pending` | بنفسجي/محايد — حجز جديد |
| `confirmed` | cyan — مؤكد |
| `checked_in` | أزرق — وصل |
| `in_session` | بنفسجي حي — داخل الجلسة |
| `completed` | أخضر — مكتمل |
| `no_show` | أحمر — لم يحضر |
| `canceled` | muted/أحمر خافت — ملغي |

لا تستخدم اللون وحده؛ أضف label أو icon و`aria-label` عند الحاجة.

## 4. الخطوط والكتابة

- الخط الأساسي: Inter / system sans.
- العربية: IBM Plex Sans Arabic.
- بيانات الهاتف والأرقام التي يجب نسخها: `dir="ltr"` مع محاذاة منطقية.
- العناوين التشغيلية قصيرة وواضحة.
- استخدم locale formatting للأرقام والتواريخ، و`Africa/Cairo` للمواعيد.
- لا تستخدم tracking واسع في النص العربي؛ الاستثناءات البصرية المحدودة في landing فقط.

مقياس عملي:

| السياق | الحجم |
|---|---|
| Micro metadata | 10–12px |
| Labels / dense cards | 12–14px |
| Body / inputs | 14–16px |
| Section title | 16–20px |
| Page title | 24–32px |
| Landing hero | 36–60px responsive |

## 5. التخطيط

### لوحة الاستقبال

- Desktop: 12-column grid بنسبة 3/6/3.
- ارتفاع المحتوى `calc(100vh - 80px)`.
- ممنوع تمرير الصفحة الرئيسية على desktop؛ كل pane يدير overflow الخاص به.
- Mobile: عمود واحد وتمرير طبيعي.
- cards كثيفة: `rounded-lg/xl`, padding 8–12px, borders خفيفة.

### صفحات الـ SaaS

- Sidebar قابل للطي + Topbar ثابت.
- المحتوى يستخدم عرض الصفحة المتاح؛ analytics وEHR يسمحان بمساحات أكبر.
- استخدم slide-over أو full-screen overlay للمهام الغنية بدل modal داخل modal.

### بوابة الحجز

- mobile-first، عمود مركزي، بطاقات خدمة واضحة.
- خطوات الاختيار: خدمة → يوم → وقت → بيانات المريض.
- هاتف العيادة وموقعها يظهران في Clinic Hero.
- Success ticket داكنة، perforated، وتحتوي QR واتجاهات وإلغاء آمن.

### الروشتة

- Overlay يغطي الشاشة.
- عمود إدخال + paper preview.
- الورقة دائمًا light mode حتى داخل dashboard الداكن.
- Print stylesheet يعزل الورقة فقط أثناء الطباعة.

## 6. الأنماط الأساسية

### الأزرار

- Primary: `bg-accent text-white`.
- Secondary: surface/elevated + subtle border.
- Destructive: danger tint + label صريح.
- حالة الضغط `scale-[0.98]`، وحالة التعطيل `opacity-50`.
- icon-only buttons تحتاج tooltip أو `aria-label`.

### المدخلات

```text
border-subtle + bg-surface/elevated + rounded-lg
focus:border-accent + focus:outline-none
error: border/text accent-danger
```

- label ظاهر أو placeholder لا يختفي مع البيانات المهمة.
- validation بجانب الحقل وليس toast فقط.
- Select داخل dark UI يجب أن يحافظ على contrast للخيارات.

### البطاقات

- Dark UI يعتمد الحدود لا shadows الثقيلة.
- استخدم `surface` للطبقة الأساسية و`elevated` للمحتوى المتداخل.
- الظلال الملوّنة محجوزة للحالات الحية مثل غرفة مشغولة أو CTA في landing.

### الإشعارات

- Drawer يُرسم عبر portal إلى `document.body`.
- overlay يغلق بالنقر وEscape ويمنع body scroll.
- اتجاه الدخول يتبع RTL/LTR.
- الفلاتر: الكل، غير المقروء، العاجل.
- Unified Inbox يستخدم قائمة + detail pane وإجراء مناسب للسياق.

## 7. الحركة

- Framer Motion للـ overlays، tabs، page reveals، والعناصر التي يتغير ترتيبها.
- Tailwind/CSS transitions مقبولة للتفاعلات الصغيرة.
- `@hello-pangea/dnd` للسحب بين مناطق الاستقبال.
- المدد المعتادة 150–350ms.
- لا تحرك بيانات تتغير باستمرار بطريقة تعيق القراءة.
- احترم `prefers-reduced-motion`.
- استخدم directional transforms واعكسها حسب locale؛ لا تفترض اتجاهًا ثابتًا.

## 8. RTL وi18n

- استخدم `ms/me/ps/pe`, `start/end`, `text-start/text-end`.
- تجنب `ml/mr/pl/pr/left/right` إلا عندما يكون الموضع الفيزيائي مقصودًا فعلاً.
- `<html dir>` يأتي من locale.
- links الداخلية تُنشأ من `@/i18n/navigation`.
- كل نص ظاهر للمستخدم يجب أن يكون في `src/messages/ar.json` و`en.json`.
- لا تجعل ترتيب workflow يعتمد على اتجاه النص؛ عرّف الترتيب في data ثم اعرضه بوعي.

## 9. الوصول

- keyboard focus ظاهر.
- Escape يغلق drawers وoverlays.
- interactive rows يجب أن تعمل بالكيبورد أو تحتوي أزرارًا حقيقية.
- touch target لا يقل عن 44px في بوابة المريض.
- لا تعرض معلومات بالحركة أو اللون فقط.
- الصور الطبية تحتاج وصفًا مناسبًا أو alt فارغًا إن كانت زخرفية.
- paper preview ليست بديلًا عن نص يمكن قراءته.

## 10. أنماط خاصة بالمنتج

### Mission Control

- Quick Ops: نموذج Walk-in صغير، ثم قائمة عاجلة قابلة للتمرير.
- Live Floor: ثلاث مناطق ثابتة مع card compact وزمن بقاء.
- Clinic Radar: الغرف، الدفعات، وسعة التشغيل.
- البيانات المالية يجب أن تحترم `canViewRevenue`.

### Patient Profile

- Master header أولًا، ثم tabs.
- WhatsApp action قريب من الهاتف.
- الرصيد يظهر بوضوح، لكن تسجيل الدفعة يحتاج confirmation وserver validation.
- EHR viewer يحافظ على الخصوصية في theater mode.

### Clinic Profile / Public Identity

- هاتف العيادة هو رقم التواصل العام، وليس بالضرورة رقم حساب المستخدم.
- زر Capture Location يطلب إذن المتصفح ويخزن latitude/longitude.
- عند وجود إحداثيات، رابط Maps يستخدمها؛ وإلا يستخدم العنوان النصي.
- لا تعرض raw coordinates للمريض بدل label مفهوم.

## 11. ممنوعات

- صور stock أو صور طبية واقعية في التسويق.
- light theme داخل صفحات الموظفين، باستثناء الورقة/المستند المعد للطباعة.
- modal فوق modal.
- shadows سوداء ثقيلة على كل card.
- ألوان hex عشوائية عندما يوجد token مناسب.
- كتابة عربية داخل component بدل ملفات الترجمة.
- خلط بيانات demo أو mock مع label يوحي بأنها production metrics.
- زر يبدو فعالًا بينما لا يملك server action حقيقيًا بدون توضيح.

## 12. قائمة مراجعة

- [ ] RTL وLTR صحيحان.
- [ ] النص موجود بالعربية والإنجليزية.
- [ ] الهاتف والموقع من بيانات العيادة الحالية.
- [ ] الصلاحيات تخفي البيانات المالية عند اللزوم.
- [ ] loading/error/empty states موجودة.
- [ ] focus وEscape وkeyboard navigation تعمل.
- [ ] الحركة قصيرة وتحترم reduced motion.
- [ ] لا توجد stock photos أو modal متداخل.
- [ ] mobile booking قابل للاستخدام بالإبهام.
- [ ] print output يعزل المستند المطلوب فقط.
