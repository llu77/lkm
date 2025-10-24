# Extended Thinking Tips - نصائح التفكير الموسع

## نظرة عامة

**Extended Thinking** (التفكير الموسع) هي ميزة متقدمة في Claude تسمح للنموذج بالعمل خلال المشاكل المعقدة خطوة بخطوة قبل تقديم الإجابة النهائية. هذا يحسّن بشكل كبير الأداء على المهام الصعبة التي تتطلب تحليل عميق واستدلال منطقي.

---

## قبل البدء

### متى تستخدم Extended Thinking؟

✅ **استخدم Extended Thinking عندما:**
- تحتاج لحل مسائل STEM معقدة
- تريد تحليل منطقي متعدد الخطوات
- تحتاج لاتخاذ قرارات معقدة بمتطلبات متعددة
- تريد اكتشاف أخطاء في الكود المعقد
- تحتاج لتخطيط استراتيجي متعدد المراحل

❌ **لا تستخدم Extended Thinking عندما:**
- المهمة بسيطة ومباشرة
- تحتاج لاستجابة سريعة
- الميزانية محدودة (tokens مكلفة)
- المهمة لا تتطلب تحليل عميق

### الاعتبارات التقنية

- **الحد الأدنى للميزانية**: 1024 tokens للتفكير
- **التوصية**: ابدأ بالحد الأدنى وزد تدريجياً حسب الحاجة
- **للميزانيات > 32K**: استخدم [batch processing](https://docs.anthropic.com/docs/build-with-claude/batch-processing) لتجنب مشاكل الشبكة
- **اللغة**: يعمل Extended Thinking بشكل أفضل بالإنجليزية، لكن المخرجات النهائية يمكن أن تكون بأي لغة
- **للميزانيات < 1024**: استخدم standard mode مع chain-of-thought prompting باستخدام XML tags (مثل `<thinking>`)

---

## الإعداد السريع

### النماذج المدعومة

| النموذج | Extended Thinking |
|--------|-------------------|
| `claude-opus-4-1-20250805` | ✅ مدعوم |
| `claude-opus-4-20250514` | ✅ مدعوم |
| `claude-sonnet-4-5-20250929` | ✅ مدعوم |
| `claude-sonnet-4-20250514` | ✅ مدعوم |
| `claude-sonnet-3-7-20250219` | ✅ مدعوم |

### مثال بسيط

```python
import anthropic

client = anthropic.Anthropic()

response = client.beta.messages.create(
    model="claude-sonnet-4-5",
    thinking={
        "type": "enabled",
        "budget_tokens": 10000  # ميزانية التفكير
    },
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": "حل هذه المسألة الرياضية المعقدة: ..."
    }]
)

print(response)
```

---

## تقنيات Prompting للتفكير الموسع

### 1. استخدم تعليمات عامة أولاً، ثم عالج المشاكل بتعليمات محددة

Claude يؤدي بشكل أفضل مع تعليمات عالية المستوى للتفكير العميق بدلاً من إرشادات خطوة بخطوة. إبداع النموذج في معالجة المشاكل قد يتفوق على قدرة الإنسان على وصف العملية المثلى.

#### ❌ تجنب:
```text
فكر في هذه المسألة الرياضية خطوة بخطوة:
1. أولاً، حدد المتغيرات
2. ثم، أنشئ المعادلة
3. بعد ذلك، حل من أجل x
...
```

#### ✅ الأفضل:
```text
فكر في هذه المسألة الرياضية بدقة وبعمق.
اعتبر منهجيات متعددة واعرض استدلالك الكامل.
جرب طرق مختلفة إذا لم تنجح الطريقة الأولى.
```

**ملاحظة مهمة**: مع ذلك، Claude يمكنه متابعة خطوات تنفيذ معقدة ومنظمة عند الحاجة. النموذج يمكنه التعامل مع قوائم أطول وأكثر تعقيداً من الإصدارات السابقة. نوصي بالبدء بتعليمات عامة، ثم قراءة مخرجات تفكير Claude والتكرار لتوفير تعليمات أكثر تحديداً لتوجيه تفكيره.

---

### 2. Multishot Prompting مع Extended Thinking

[Multishot prompting](https://docs.anthropic.com/docs/build-with-claude/prompt-engineering/multishot-prompting) يعمل بشكل جيد مع extended thinking. عندما تقدم لـ Claude أمثلة عن كيفية التفكير في المشاكل، سيتبع أنماط استدلال مماثلة في كتل التفكير الموسع.

#### مثال:

```text
سأوضح لك كيفية حل مسألة رياضية، ثم أريدك حل مسألة مماثلة.

المسألة 1: ما هو 15% من 80؟

<thinking>
لإيجاد 15% من 80:
1. حوّل 15% إلى عدد عشري: 15% = 0.15
2. اضرب: 0.15 × 80 = 12
</thinking>

الإجابة هي 12.

الآن حل هذه:
المسألة 2: ما هو 35% من 240؟
```

**ملاحظة**: يمكنك تضمين أمثلة few-shot في prompts باستخدام XML tags مثل `<thinking>` أو `<scratchpad>` للإشارة إلى أنماط التفكير الموسع. Claude سيعمم النمط إلى عملية extended thinking الرسمية. لكن، قد تحصل على نتائج أفضل بإعطاء Claude حرية التفكير بالطريقة التي يراها مناسبة.

---

### 3. تعظيم اتباع التعليمات

Claude يظهر تحسناً كبيراً في اتباع التعليمات عند تفعيل extended thinking. النموذج عادةً:

1. يفكر في التعليمات داخل كتلة extended thinking
2. ينفذ هذه التعليمات في الاستجابة

#### لتعظيم اتباع التعليمات:

- ✅ كن واضحاً ومحدداً في ما تريد
- ✅ للتعليمات المعقدة، فكر في تقسيمها إلى خطوات مرقمة يجب على Claude العمل عليها بشكل منهجي
- ✅ اسمح لـ Claude بميزانية كافية لمعالجة التعليمات بالكامل في تفكيره الموسع

---

### 4. استخدام Extended Thinking لتصحيح وتوجيه سلوك Claude

يمكنك استخدام مخرجات تفكير Claude لتصحيح منطقه، لكن هذه الطريقة ليست دقيقة دائماً.

#### نصائح مهمة:

- ⚠️ **لا نوصي** بإعادة تمرير extended thinking لـ Claude في كتلة نص user، لأن هذا لا يحسن الأداء وقد يُدهوره فعلياً
- ⚠️ **Prefilling extended thinking ممنوع صراحة**، وتغيير نص المخرج يدوياً بعد كتلة التفكير يمكن أن يُدهور النتائج بسبب ارتباك النموذج
- ✅ عند إيقاف extended thinking، [prefill](https://docs.anthropic.com/docs/build-with-claude/prompt-engineering/prefill-claudes-response) للاستجابة `assistant` العادي لا يزال مسموحاً

**ملاحظة**: أحياناً Claude قد يكرر extended thinking في نص المخرج. إذا كنت تريد استجابة نظيفة، أخبر Claude بعدم تكرار تفكيره الموسع والإخراج فقط الإجابة.

---

### 5. الاستفادة القصوى من المخرجات الطويلة والتفكير الطويل

لحالات استخدام توليد datasets، جرب prompts مثل "أنشئ جدول مفصل للغاية من..." لتوليد datasets شاملة.

لحالات الاستخدام مثل توليد محتوى مفصل حيث تريد كتل تفكير موسع أطول واستجابات أكثر تفصيلاً:

#### نصائح:

- ✅ **زد كلا من** الحد الأقصى لطول extended thinking **واطلب صراحة** مخرجات أطول
- ✅ **للمخرجات الطويلة جداً (20,000+ كلمة)**: اطلب مخطط تفصيلي بعدد كلمات يصل إلى مستوى الفقرة. ثم اطلب من Claude فهرسة فقراته للمخطط والحفاظ على عدد الكلمات المحدد

⚠️ **تحذير**: لا نوصي بدفع Claude لإخراج tokens أكثر لأجل الـ tokens فقط. بدلاً من ذلك، ابدأ بميزانية تفكير صغيرة وزد حسب الحاجة لإيجاد الإعدادات المثلى لحالة استخدامك.

---

## أمثلة لحالات استخدام متقدمة

### 1. مسائل STEM المعقدة

مسائل STEM المعقدة تتطلب من Claude بناء نماذج ذهنية، تطبيق معرفة متخصصة، والعمل خلال خطوات منطقية متسلسلة - عمليات تستفيد من وقت استدلال أطول.

#### مثال بسيط:
```text
اكتب سكريبت Python لكرة صفراء ترتد داخل مربع،
تأكد من معالجة اكتشاف التصادم بشكل صحيح.
اجعل المربع يدور ببطء.
```

**ملاحظة**: هذه المهمة البسيطة عادةً تنتج فقط حوالي بضع ثوان من وقت التفكير.

#### مثال متقدم:
```text
اكتب سكريبت Python لكرة صفراء ترتد داخل tesseract (مكعب رباعي الأبعاد)،
تأكد من معالجة اكتشاف التصادم بشكل صحيح.
اجعل الـ tesseract يدور ببطء.
تأكد من بقاء الكرة داخل الـ tesseract.
```

**ملاحظة**: تحدي visualization رباعي الأبعاد المعقد هذا يستخدم بشكل أفضل وقت extended thinking طويل بينما يعمل Claude خلال التعقيد الرياضي والبرمجي.

---

### 2. مسائل تحسين القيود

تحديات تحسين القيود تجبر Claude على إرضاء متطلبات متنافسة متعددة في وقت واحد، وهو ما يُنجز بشكل أفضل عند السماح بوقت extended thinking طويل حتى يتمكن النموذج من معالجة كل قيد منهجياً.

#### مثال بسيط:
```text
خطط لإجازة أسبوع في اليابان.
```

#### مثال متقدم:
```text
خطط لرحلة 7 أيام إلى اليابان مع القيود التالية:
- ميزانية $2,500
- يجب تضمين طوكيو وكيوتو
- حاجة لاستيعاب نظام غذائي نباتي
- تفضيل للتجارب الثقافية على التسوق
- يجب تضمين يوم واحد من المشي
- لا يزيد عن ساعتين سفر بين المواقع يومياً
- حاجة لوقت فراغ كل مساء للاتصالات بالوطن
- يجب تجنب الزحام حيثما أمكن
```

**ملاحظة**: مع قيود متعددة للموازنة، Claude سيؤدي بشكل طبيعي بشكل أفضل عندما يُعطى مساحة أكبر للتفكير في كيفية إرضاء جميع المتطلبات بشكل مثالي.

---

### 3. أطر التفكير المهيكلة

أطر التفكير المهيكلة تعطي Claude منهجية صريحة لاتباعها، والتي قد تعمل بشكل أفضل عندما يُعطى Claude مساحة extended thinking طويلة لاتباع كل خطوة.

#### مثال بسيط:
```text
طور استراتيجية شاملة لدخول Microsoft سوق الطب الشخصي بحلول 2027.
```

#### مثال متقدم:
```text
طور استراتيجية شاملة لدخول Microsoft سوق الطب الشخصي بحلول 2027.

ابدأ بـ:
1. لوحة Blue Ocean Strategy
2. طبق Porter's Five Forces لتحديد الضغوط التنافسية

بعد ذلك، قم بتمرين تخطيط سيناريوهات مع أربع مستقبلات متميزة بناءً على متغيرات تنظيمية وتكنولوجية.

لكل سيناريو:
- طور استجابات استراتيجية باستخدام Ansoff Matrix

أخيراً، طبق إطار Three Horizons لـ:
- رسم مسار الانتقال
- تحديد الابتكارات المدمرة المحتملة في كل مرحلة
```

**ملاحظة**: بتحديد أطر تحليلية متعددة يجب تطبيقها بالتسلسل، وقت التفكير يزيد بشكل طبيعي بينما يعمل Claude خلال كل إطار بشكل منهجي.

---

### 4. مراجعة Claude لعمله وتحسين الاتساق ومعالجة الأخطاء

يمكنك استخدام natural language prompting بسيط لتحسين الاتساق وتقليل الأخطاء:

1. اطلب من Claude التحقق من عمله بتجربة بسيطة قبل إعلان المهمة مكتملة
2. اطلب من النموذج تحليل ما إذا كانت خطوته السابقة حققت النتيجة المتوقعة
3. لمهام البرمجة، اطلب من Claude تشغيل حالات اختبار في تفكيره الموسع

#### مثال:

```text
اكتب دالة لحساب مضروب رقم.
قبل أن تنتهي، تحقق من حلك بحالات اختبار لـ:
- n=0
- n=1
- n=5
- n=10
وصحح أي مشاكل تجدها.
```

---

## أمثلة عملية من مشروعنا

بناءً على تحليل المشروع الحالي (`lkm`), إليك كيف يمكن استخدام Extended Thinking:

### مثال 1: تحليل معقد للإيرادات مع استدلال متعدد الخطوات

```typescript
// في ملف convex/ai.ts
export const validateRevenueDataWithExtendedThinking = action({
  args: {
    revenue: v.object({
      date: v.number(),
      cash: v.number(),
      network: v.number(),
      budget: v.number(),
      total: v.number(),
      calculatedTotal: v.number(),
      isMatched: v.boolean()
    }),
    branchId: v.string(),
    branchName: v.string(),
    historicalData: v.array(v.object({
      date: v.number(),
      total: v.number(),
      isMatched: v.boolean()
    }))
  },
  handler: async (ctx, { revenue, branchId, branchName, historicalData }) => {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // استخدام Extended Thinking للتحليل المعقد
    const response = await anthropic.beta.messages.create({
      model: "claude-sonnet-4-5",
      thinking: {
        type: "enabled",
        budget_tokens: 16000  // ميزانية أكبر للتحليل المعقد
      },
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `أنت Data Validator Agent متخصص. قم بتحليل شامل ومعقد لإيراد ${branchName}.

📊 **البيانات الجديدة:**
- التاريخ: ${new Date(revenue.date).toLocaleDateString("ar-EG")}
- الكاش: ${revenue.cash.toLocaleString()} ر.س
- الشبكة: ${revenue.network.toLocaleString()} ر.س
- المجموع المسجل: ${revenue.total.toLocaleString()} ر.س
- المجموع المحسوب: ${revenue.calculatedTotal.toLocaleString()} ر.س
- الفرق: ${(revenue.total - revenue.calculatedTotal).toLocaleString()} ر.س
- الحالة: ${revenue.isMatched ? "✅ مطابق" : "❌ غير مطابق"}

📈 **البيانات التاريخية (آخر ${historicalData.length} يوم):**
${JSON.stringify(historicalData, null, 2)}

**المطلوب - استدلال متعدد المستويات:**

فكر بعمق في هذا التحليل المعقد. خذ وقتك في:

1. **التحليل الإحصائي المتقدم:**
   - احسب المتوسط، الانحراف المعياري، Z-Score
   - حدد القيم الشاذة باستخدام IQR method
   - حلل الاتجاهات والأنماط الزمنية
   - قيّم التوزيع الطبيعي للبيانات

2. **كشف الشذوذ متعدد الطبقات:**
   - الطبقة 1: الشذوذ الإحصائي البسيط
   - الطبقة 2: الشذوذ القائم على الأنماط
   - الطبقة 3: الشذوذ السياقي (مثل يوم الأسبوع، الموسم)
   - الطبقة 4: الشذوذ القائم على السلوك (تغيرات مفاجئة)

3. **تقييم المخاطر الاحتمالي:**
   - احسب احتمالية كل سيناريو خطر
   - قيّم التأثير المحتمل على العمليات
   - حدد نقاط القرار الحرجة
   - اقترح استراتيجيات تخفيف

4. **التوصيات الاستراتيجية:**
   - توصيات قصيرة المدى (فورية)
   - توصيات متوسطة المدى (أسبوعية)
   - توصيات طويلة المدى (شهرية)
   - تحسينات في العمليات والإجراءات

فكر خطوة بخطوة واعرض استدلالك الكامل. جرب منهجيات مختلفة إذا واجهت شكوكاً.

أعطني ردك بتنسيق JSON صارم:
{
  "isValid": true/false,
  "reasoning": "استدلالك المفصل...",
  "riskLevel": "low/medium/high/critical",
  "confidence": 0.XX,
  "issues": ["قائمة المشاكل"],
  "recommendations": ["قائمة التوصيات"],
  "anomalyScore": 0.XX,
  "statisticalAnalysis": {
    "mean": 0.XX,
    "stdDev": 0.XX,
    "zScore": 0.XX,
    "isOutlier": true/false
  }
}`
      }]
    });

    return response;
  }
});
```

### مثال 2: تخطيط الرواتب مع قيود متعددة

```typescript
export const planPayrollWithConstraints = action({
  args: {
    branchId: v.string(),
    month: v.number(),
    year: v.number(),
    constraints: v.object({
      maxBudget: v.number(),
      minSalary: v.number(),
      maxOvertime: v.number(),
      bonusPool: v.number()
    })
  },
  handler: async (ctx, { branchId, month, year, constraints }) => {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // جلب بيانات الموظفين والسلف والخصومات
    const employees = await ctx.runQuery(/* ... */);
    const advances = await ctx.runQuery(/* ... */);
    const deductions = await ctx.runQuery(/* ... */);

    const response = await anthropic.beta.messages.create({
      model: "claude-sonnet-4-5",
      thinking: {
        type: "enabled",
        budget_tokens: 20000  // ميزانية كبيرة للتخطيط المعقد
      },
      max_tokens: 4096,
      messages: [{
        "role": "user",
        "content": `خطط لرواتب شهر ${month}/${year} للفرع ${branchId} مع القيود التالية:

**القيود:**
- الميزانية الإجمالية: ${constraints.maxBudget.toLocaleString()} ر.س
- الحد الأدنى للراتب: ${constraints.minSalary.toLocaleString()} ر.س
- الحد الأقصى للعمل الإضافي: ${constraints.maxOvertime} ساعة
- مجمع البونص: ${constraints.bonusPool.toLocaleString()} ر.س

**بيانات الموظفين:**
${JSON.stringify(employees, null, 2)}

**السلف:**
${JSON.stringify(advances, null, 2)}

**الخصومات:**
${JSON.stringify(deductions, null, 2)}

**المطلوب - تخطيط استراتيجي متعدد المعايير:**

فكر بعمق في كيفية:
1. توزيع الرواتب بشكل عادل ومحفز
2. إدارة السلف والخصومات بكفاءة
3. توزيع البونص بناءً على الأداء
4. الالتزام بجميع القيود المالية
5. تحسين رضا الموظفين والإنتاجية

خذ وقتك في التحليل وقدم خطة شاملة مع تبريرات واضحة لكل قرار.

أعطني ردك بتنسيق JSON مع الخطة الكاملة والتبريرات.`
      }]
    });

    return response;
  }
});
```

### مثال 3: كشف أنماط معقدة في البيانات

```typescript
export const detectComplexPatterns = action({
  args: {
    branchId: v.string(),
    branchName: v.string(),
    analysisDepth: v.string()  // "shallow", "medium", "deep"
  },
  handler: async (ctx, { branchId, branchName, analysisDepth }) => {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // تحديد ميزانية التفكير بناءً على العمق المطلوب
    const thinkingBudget = {
      shallow: 5000,
      medium: 15000,
      deep: 30000
    }[analysisDepth] || 10000;

    // جلب بيانات متعددة الأبعاد
    const revenues = await ctx.runQuery(/* ... */);
    const expenses = await ctx.runQuery(/* ... */);
    const orders = await ctx.runQuery(/* ... */);
    const requests = await ctx.runQuery(/* ... */);

    const response = await anthropic.beta.messages.create({
      model="claude-sonnet-4-5",
      thinking: {
        type: "enabled",
        budget_tokens: thinkingBudget
      },
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `قم بتحليل متعدد الأبعاد لبيانات فرع ${branchName}.

**البيانات:**
- الإيرادات: ${revenues.length} سجل
- المصروفات: ${expenses.length} سجل
- الطلبات: ${orders.length} سجل
- الطلبات: ${requests.length} سجل

[البيانات الكاملة...]

**التحليل المطلوب (${analysisDepth}):**

استخدم كل الوقت الذي تحتاجه للتفكير العميق. قم بـ:

1. **اكتشاف الأنماط الخفية:**
   - أنماط زمنية (يومية، أسبوعية، شهرية، موسمية)
   - أنماط ارتباطية (بين المتغيرات المختلفة)
   - أنماط سببية (علاقات السبب والنتيجة)
   - أنماط شاذة (انحرافات عن النمط العادي)

2. **التنبؤ الاحتمالي:**
   - توقع الأسبوع/الشهر القادم
   - سيناريوهات متعددة (أفضل حال، متوسط، أسوأ حال)
   - مستويات الثقة والتضمينات

3. **التوصيات الاستراتيجية:**
   - نقاط التحسين الحرجة
   - فرص النمو غير المستغلة
   - المخاطر المحتملة والتخفيف

فكر بعمق واستخدم منهجيات تحليلية متعددة للوصول لرؤى عميقة.`
      }]
    });

    return response;
  }
});
```

---

## أفضل الممارسات

### 1. إدارة الميزانية

```python
# ✅ جيد: ابدأ صغيراً وزد تدريجياً
thinking_budgets = {
    "simple": 2000,      # مهام بسيطة
    "moderate": 5000,    # مهام متوسطة
    "complex": 10000,    # مهام معقدة
    "very_complex": 20000  # مهام معقدة جداً
}

# ⚠️ تجنب: ميزانية كبيرة لمهام بسيطة
thinking_budget = 50000  # مكلف جداً لمهمة بسيطة
```

### 2. Prompt Design

```python
# ✅ جيد: prompt عام يسمح بالإبداع
prompt = """
حلل هذه البيانات بعناية. فكر في منهجيات متعددة واعرض استدلالك.
اكتشف الأنماط والشذوذات وقدم توصيات مدروسة.
"""

# ❌ تجنب: prompt شديد التقييد
prompt = """
حلل البيانات بهذه الخطوات بالضبط:
1. اطرح 5 من كل قيمة
2. اقسم على 2
3. ارفع للقوة 2
...
"""
```

### 3. معالجة النتائج

```python
# الوصول لكتلة التفكير الموسع
if hasattr(response, 'thinking'):
    thinking_content = response.thinking
    # يمكنك تسجيل هذا للتدقيق أو debugging
    log_thinking(thinking_content)

# الحصول على الاستجابة النهائية
final_response = response.content[0].text
```

### 4. التعامل مع الأخطاء

```python
try:
    response = client.beta.messages.create(
        model="claude-sonnet-4-5",
        thinking={"type": "enabled", "budget_tokens": 10000},
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}]
    )
except anthropic.APIError as e:
    if "thinking_budget_exceeded" in str(e):
        # زد الميزانية وأعد المحاولة
        pass
    else:
        # معالجة أخطاء أخرى
        pass
```

---

## مقارنة: Extended Thinking vs. Standard Mode

| الميزة | Extended Thinking | Standard Mode |
|-------|-------------------|---------------|
| التفكير المنطقي | متعدد الخطوات وعميق | مباشر وسريع |
| الدقة للمسائل المعقدة | عالية جداً | متوسطة |
| السرعة | أبطأ | أسرع |
| التكلفة | أعلى (tokens إضافية) | أقل |
| حالات الاستخدام | STEM، التخطيط، التحليل المعقد | المهام البسيطة، الاستجابات السريعة |
| الشفافية | عالية (يمكن رؤية التفكير) | منخفضة |

---

## الموارد الإضافية

- [Extended Thinking Models](https://docs.anthropic.com/docs/about-claude/models/extended-thinking-models)
- [Extended Thinking Implementation Guide](https://docs.anthropic.com/docs/build-with-claude/extended-thinking)
- [Extended Thinking Cookbook](https://github.com/anthropics/anthropic-cookbook/tree/main/extended_thinking)
- [Chain of Thought Prompting](https://docs.anthropic.com/docs/build-with-claude/prompt-engineering/chain-of-thought)
- [Multishot Prompting](https://docs.anthropic.com/docs/build-with-claude/prompt-engineering/multishot-prompting)

---

## الدعم والتواصل

للحصول على مساعدة أو الإبلاغ عن مشاكل:
- GitHub Issues: [github.com/anthropics/anthropic-sdk-python](https://github.com/anthropics/anthropic-sdk-python)
- الوثائق الرسمية: [docs.anthropic.com](https://docs.anthropic.com)
- Community: [Claude Community Forum](https://community.anthropic.com)

---

**آخر تحديث**: 2025-10-24
**النماذج المدعومة**: Claude Opus 4.x, Sonnet 4.x, Sonnet 3.7
