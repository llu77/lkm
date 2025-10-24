# Embeddings Guide - دليل التضمينات (Embeddings)

## نظرة عامة

**Text Embeddings** (التضمينات النصية) هي تمثيلات رقمية للنصوص تمكن من قياس التشابه الدلالي (Semantic Similarity). هذا الدليل يقدم Embeddings، تطبيقاتها، وكيفية استخدام نماذج Embedding للمهام مثل البحث، التوصيات، وكشف الشذوذات.

---

## ما هي Embeddings؟

Embeddings هي vectors (مصفوفات) من الأرقام تمثل معنى النص في فضاء متعدد الأبعاد. النصوص المتشابهة في المعنى تكون قريبة من بعضها في هذا الفضاء.

### مثال بسيط:

```python
# نصوص مشابهة
"القطة جالسة على الحصيرة" → [0.2, 0.8, 0.1, ...]
"القط يجلس على السجادة" → [0.19, 0.81, 0.11, ...]

# نصوص مختلفة
"السيارة سريعة جداً" → [0.7, 0.1, 0.9, ...]
```

المسافة بين الـ vectors تعكس التشابه الدلالي.

---

## قبل تطبيق Embeddings

عند اختيار مزود embeddings، هناك عدة عوامل للنظر فيها:

### 1. حجم Dataset والتخصص المجالي

- **حجم البيانات التدريبية**: مجموعات بيانات أكبر تنتج embeddings أفضل
- **التخصص المجالي**: بيانات متخصصة في المجال تحسن جودة الـ embeddings
- **مثال**: نموذج مدرب على نصوص طبية سيعطي نتائج أفضل للمحتوى الطبي

### 2. أداء الاستدلال (Inference Performance)

- **سرعة البحث**: مهمة للتطبيقات الفورية
- **Latency**: الوقت بين الطلب والاستجابة
- **أهمية خاصة**: للنشر على نطاق واسع في الإنتاج

### 3. التخصيص (Customization)

- **التدريب على بيانات خاصة**: لتحسين الأداء على مفردات فريدة
- **التخصص لمجالات محددة**: مالية، صحية، قانونية، إلخ
- **Fine-tuning**: تحسين النموذج لحالة استخدام محددة

---

## كيفية الحصول على Embeddings مع Anthropic

### ملاحظة مهمة

**Anthropic لا تقدم نموذج embedding خاص بها.** مزود embeddings موصى به يوفر خيارات وقدرات متنوعة هو **Voyage AI**.

### لماذا Voyage AI؟

- ✅ نماذج embedding متقدمة
- ✅ نماذج مخصصة لمجالات صناعية محددة (مالية، صحية)
- ✅ نماذج مخصصة لعملاء فرديين
- ✅ أداء ممتاز في معظم المهام

**ملاحظة**: نشجعك على تقييم مزودي embeddings المختلفين للعثور على الأنسب لحالة استخدامك.

---

## النماذج المتاحة (Voyage AI)

### نماذج Text Embedding

| النموذج | Context Length | Embedding Dimension | الوصف |
|---------|---------------|--------------------|---------|
| `voyage-3-large` | 32,000 | 1024 (default), 256, 512, 2048 | أفضل جودة استرجاع عامة ومتعددة اللغات |
| `voyage-3.5` | 32,000 | 1024 (default), 256, 512, 2048 | محسّن للاسترجاع العام ومتعدد اللغات |
| `voyage-3.5-lite` | 32,000 | 1024 (default), 256, 512, 2048 | محسّن للسرعة والتكلفة |
| `voyage-code-3` | 32,000 | 1024 (default), 256, 512, 2048 | محسّن لاسترجاع **الأكواد** |
| `voyage-finance-2` | 32,000 | 1024 | محسّن لاسترجاع **المالية** و RAG |
| `voyage-law-2` | 16,000 | 1024 | محسّن لاسترجاع **القانوني** والسياقات الطويلة |

### نماذج Multimodal Embedding

| النموذج | Context Length | Embedding Dimension | الوصف |
|---------|---------------|--------------------|---------|
| `voyage-multimodal-3` | 32,000 | 1024 | نموذج غني multimodal يمكنه vectorize نص وصور متداخلة |

### كيفية اختيار النموذج؟

راجع [الأسئلة الشائعة](#الأسئلة-الشائعة) في نهاية هذا الدليل.

---

## البدء مع Voyage AI

### 1. الإعداد

```bash
# الحصول على مفتاح API من Voyage AI
export VOYAGE_API_KEY="<your secret key>"
```

### 2. تثبيت المكتبة

#### Python

```bash
pip install -U voyageai
```

#### استخدام Python

```python
import voyageai

vo = voyageai.Client()
# سيستخدم تلقائياً متغير البيئة VOYAGE_API_KEY
# أو يمكنك: vo = voyageai.Client(api_key="<your secret key>")

texts = ["نص عربي 1", "نص عربي 2"]

result = vo.embed(texts, model="voyage-3.5", input_type="document")
print(result.embeddings[0])
print(result.embeddings[1])
```

**النتيجة**: قائمة من vectors، كل منها يحتوي على 1024 رقم floating-point:

```python
[-0.013131560757756233, 0.019828535616397858, ...]   # embedding لـ "نص عربي 1"
[-0.0069352793507277966, 0.020878976210951805, ...]  # embedding لـ "نص عربي 2"
```

### 3. استخدام HTTP API

```bash
curl https://api.voyageai.com/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VOYAGE_API_KEY" \
  -d '{
    "input": ["نص عربي 1", "نص عربي 2"],
    "model": "voyage-3.5"
  }'
```

**الاستجابة**:

```json
{
  "object": "list",
  "data": [
    {
      "embedding": [-0.013131560757756233, 0.019828535616397858, ...],
      "index": 0
    },
    {
      "embedding": [-0.0069352793507277966, 0.020878976210951805, ...],
      "index": 1
    }
  ],
  "model": "voyage-3.5",
  "usage": {
    "total_tokens": 10
  }
}
```

### 4. AWS Marketplace

Voyage embeddings متاحة على [AWS Marketplace](https://aws.amazon.com/marketplace/seller-profile?id=seller-snt4gb6fd7ljg).

---

## مثال Quickstart

### السيناريو: بحث دلالي في 6 مستندات

```python
documents = [
    "حمية البحر المتوسط تركز على السمك، زيت الزيتون، والخضروات، ويُعتقد أنها تقلل الأمراض المزمنة.",
    "التمثيل الضوئي في النباتات يحول طاقة الضوء إلى جلوكوز وينتج أكسجين أساسي.",
    "ابتكارات القرن العشرين، من الراديو إلى الهواتف الذكية، تركزت على التقدم الإلكتروني.",
    "الأنهار توفر المياه، الري، والموئل للأنواع المائية، حيوية للنظم البيئية.",
    "مكالمة مؤتمر Apple لمناقشة نتائج الربع المالي الرابع وتحديثات الأعمال مجدولة ليوم الخميس 2 نوفمبر 2023 الساعة 2:00 مساءً PT / 5:00 مساءً ET.",
    "أعمال شكسبير، مثل 'هاملت' و'حلم ليلة منتصف الصيف'، تستمر في الأدب."
]
```

### الخطوة 1: تحويل المستندات إلى Embeddings

```python
import voyageai

vo = voyageai.Client()

# Embed المستندات
doc_embds = vo.embed(
    documents,
    model="voyage-3.5",
    input_type="document"
).embeddings
```

### الخطوة 2: البحث الدلالي

```python
import numpy as np

# الاستعلام
query = "متى مجدولة مكالمة مؤتمر Apple؟"

# Embed الاستعلام
query_embd = vo.embed(
    [query],
    model="voyage-3.5",
    input_type="query"
).embeddings[0]

# حساب التشابه
# Voyage embeddings منظمة للطول 1، لذا dot-product
# و cosine similarity هما نفس الشيء
similarities = np.dot(doc_embds, query_embd)

# إيجاد المستند الأكثر صلة
retrieved_id = np.argmax(similarities)
print(documents[retrieved_id])
```

**النتيجة**: المستند الخامس، وهو فعلاً الأكثر صلة بالاستعلام!

```
مكالمة مؤتمر Apple لمناقشة نتائج الربع المالي الرابع وتحديثات الأعمال مجدولة ليوم الخميس 2 نوفمبر 2023 الساعة 2:00 مساءً PT / 5:00 مساءً ET.
```

### ملاحظة مهمة: `input_type` Parameter

- **للمستندات**: `input_type="document"`
- **للاستعلامات**: `input_type="query"`

هذا يحسن جودة الاسترجاع بشكل كبير!

---

## حالات استخدام متقدمة

### 1. RAG (Retrieval-Augmented Generation) مع Claude

RAG هو تقنية تجمع بين البحث الدلالي وقوة Claude للإجابة على الأسئلة بناءً على قاعدة معرفية.

#### السيناريو: نظام دعم فني ذكي

```python
import voyageai
import anthropic
import numpy as np

# 1. إعداد العملاء
voyage_client = voyageai.Client()
anthropic_client = anthropic.Anthropic()

# 2. قاعدة المعرفة (مستندات الدعم الفني)
knowledge_base = [
    "لإعادة تعيين كلمة المرور، اذهب إلى الإعدادات > الأمان > إعادة تعيين كلمة المرور.",
    "لتفعيل المصادقة الثنائية، اذهب إلى الإعدادات > الأمان > تفعيل 2FA.",
    "لتصدير بياناتك، اذهب إلى الإعدادات > البيانات > تصدير البيانات الشخصية.",
    "لحذف حسابك، اتصل بالدعم الفني على support@company.com.",
    "النظام يدعم اللغات: العربية، الإنجليزية، الفرنسية، الإسبانية.",
    # ... المزيد من المستندات
]

# 3. Embed قاعدة المعرفة (يتم مرة واحدة فقط)
kb_embeddings = voyage_client.embed(
    knowledge_base,
    model="voyage-3.5",
    input_type="document"
).embeddings

# 4. دالة البحث الدلالي
def search_knowledge_base(query: str, top_k: int = 3):
    # Embed الاستعلام
    query_embd = voyage_client.embed(
        [query],
        model="voyage-3.5",
        input_type="query"
    ).embeddings[0]

    # حساب التشابه
    similarities = np.dot(kb_embeddings, query_embd)

    # إيجاد أفضل k نتائج
    top_indices = np.argsort(similarities)[-top_k:][::-1]

    return [knowledge_base[i] for i in top_indices]

# 5. دالة RAG الرئيسية
def rag_support_assistant(user_question: str):
    # البحث عن المستندات ذات الصلة
    relevant_docs = search_knowledge_base(user_question, top_k=3)

    # إنشاء prompt لـ Claude
    context = "\n".join([f"- {doc}" for doc in relevant_docs])

    prompt = f"""أنت مساعد دعم فني ذكي. استخدم المعلومات التالية من قاعدة المعرفة للإجابة على سؤال المستخدم.

**المعلومات ذات الصلة:**
{context}

**سؤال المستخدم:**
{user_question}

**تعليمات:**
- أجب بناءً على المعلومات المقدمة فقط
- إذا لم تكن المعلومات كافية، قل ذلك صراحة
- كن واضحاً ومحدداً في إجابتك
- استخدم اللغة العربية"""

    # استدعاء Claude
    response = anthropic_client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": prompt
        }]
    )

    return response.content[0].text

# 6. الاستخدام
user_q = "كيف أفعّل المصادقة الثنائية؟"
answer = rag_support_assistant(user_q)
print(answer)
```

**الفوائد**:
- ✅ إجابات دقيقة بناءً على قاعدة معرفية محددة
- ✅ تقليل الهلوسة (Hallucination)
- ✅ قابلية التحديث بسهولة
- ✅ أداء ممتاز للأسئلة المتخصصة

---

### 2. نظام توصيات ذكي

```python
# مثال: توصيات المقالات المشابهة

def recommend_similar_articles(article_id: str, articles_db: dict, top_k: int = 5):
    """
    يوصي بمقالات مشابهة بناءً على المحتوى

    Args:
        article_id: معرف المقالة الحالية
        articles_db: قاعدة بيانات المقالات مع embeddings
        top_k: عدد التوصيات
    """
    # الحصول على embedding المقالة الحالية
    current_embd = articles_db[article_id]['embedding']

    # حساب التشابه مع جميع المقالات الأخرى
    similarities = {}
    for aid, article in articles_db.items():
        if aid == article_id:
            continue

        sim = np.dot(current_embd, article['embedding'])
        similarities[aid] = sim

    # ترتيب حسب التشابه
    sorted_articles = sorted(
        similarities.items(),
        key=lambda x: x[1],
        reverse=True
    )

    # إرجاع أفضل k مقالات
    return [
        {
            'id': aid,
            'title': articles_db[aid]['title'],
            'similarity': sim
        }
        for aid, sim in sorted_articles[:top_k]
    ]

# الاستخدام
recommendations = recommend_similar_articles(
    article_id="article_123",
    articles_db=articles_database,
    top_k=5
)

for rec in recommendations:
    print(f"📄 {rec['title']} (تشابه: {rec['similarity']:.2f})")
```

---

### 3. كشف الشذوذات في البيانات النصية

```python
def detect_anomalies(texts: list[str], threshold: float = 0.7):
    """
    يكتشف النصوص الشاذة (غير المشابهة للمجموعة)

    Args:
        texts: قائمة النصوص
        threshold: عتبة التشابه (أقل = أكثر صرامة)
    """
    # Embed جميع النصوص
    embeddings = voyage_client.embed(
        texts,
        model="voyage-3.5",
        input_type="document"
    ).embeddings

    # حساب متوسط embedding
    mean_embd = np.mean(embeddings, axis=0)

    # حساب التشابه مع المتوسط لكل نص
    anomalies = []
    for i, embd in enumerate(embeddings):
        similarity = np.dot(embd, mean_embd)

        if similarity < threshold:
            anomalies.append({
                'index': i,
                'text': texts[i],
                'similarity': similarity,
                'anomaly_score': 1 - similarity
            })

    return sorted(anomalies, key=lambda x: x['anomaly_score'], reverse=True)

# مثال: اكتشاف تعليقات spam
comments = [
    "منتج رائع، أنصح به!",
    "جودة ممتازة والتوصيل سريع",
    "راضي جداً عن الشراء",
    "!!!اربح مليون دولار الآن!!! اضغط هنا",  # شاذ
    "سعر مناسب والمنتج كما وُصف",
    "CLICK HERE FOR FREE MONEY $$$",  # شاذ
]

anomalies = detect_anomalies(comments, threshold=0.6)

print("🚨 تعليقات مشبوهة:")
for anomaly in anomalies:
    print(f"- {anomaly['text']}")
    print(f"  درجة الشذوذ: {anomaly['anomaly_score']:.2f}\n")
```

---

### 4. تصنيف النصوص

```python
def classify_text(text: str, categories: dict[str, str]):
    """
    يصنف النص إلى أقرب فئة

    Args:
        text: النص المراد تصنيفه
        categories: قاموس {category_name: category_description}
    """
    # Embed النص
    text_embd = voyage_client.embed(
        [text],
        model="voyage-3.5",
        input_type="query"
    ).embeddings[0]

    # Embed أوصاف الفئات
    category_descriptions = list(categories.values())
    category_embds = voyage_client.embed(
        category_descriptions,
        model="voyage-3.5",
        input_type="document"
    ).embeddings

    # حساب التشابه
    similarities = np.dot(category_embds, text_embd)

    # إيجاد أقرب فئة
    best_idx = np.argmax(similarities)
    category_name = list(categories.keys())[best_idx]
    confidence = similarities[best_idx]

    return {
        'category': category_name,
        'confidence': float(confidence),
        'all_scores': {
            name: float(sim)
            for name, sim in zip(categories.keys(), similarities)
        }
    }

# مثال: تصنيف طلبات العملاء
categories = {
    'technical_support': 'مشكلة تقنية، خطأ في النظام، لا يعمل',
    'billing': 'فاتورة، دفع، رصيد، استرداد أموال',
    'product_inquiry': 'سؤال عن منتج، مواصفات، توفر',
    'complaint': 'شكوى، استياء، مشكلة في الخدمة',
    'feedback': 'اقتراح، رأي، تحسين'
}

request = "لم تصلني الفاتورة لهذا الشهر، هل يمكنكم إرسالها؟"
result = classify_text(request, categories)

print(f"📋 التصنيف: {result['category']}")
print(f"🎯 الثقة: {result['confidence']:.2%}")
```

---

## أمثلة عملية من مشروعنا (lkm)

بناءً على تحليل المشروع، إليك كيف يمكن استخدام Embeddings:

### مثال 1: بحث ذكي في بيانات الموظفين

```typescript
// في ملف convex/employees.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import voyageai from "voyageai";

export const searchEmployeesSemantic = action({
  args: {
    query: v.string(),
    branchId: v.optional(v.string())
  },
  handler: async (ctx, { query, branchId }) => {
    const voyageKey = process.env.VOYAGE_API_KEY;
    if (!voyageKey) {
      throw new Error("VOYAGE_API_KEY not configured");
    }

    const vo = new voyageai.Client({ apiKey: voyageKey });

    // جلب جميع الموظفين
    const allEmployees = await ctx.runQuery(/* ... */);

    // فلترة حسب الفرع إذا مطلوب
    const employees = branchId
      ? allEmployees.filter(e => e.branchId === branchId)
      : allEmployees;

    // إنشاء أوصاف نصية للموظفين
    const employeeTexts = employees.map(e =>
      `${e.employeeName} - ${e.branchName} - راتب أساسي: ${e.baseSalary} - بدل إشراف: ${e.supervisorAllowance}`
    );

    // Embed جميع الموظفين
    const employeeEmbds = await vo.embed(
      employeeTexts,
      { model: "voyage-3.5", inputType: "document" }
    );

    // Embed الاستعلام
    const queryEmbd = await vo.embed(
      [query],
      { model: "voyage-3.5", inputType: "query" }
    );

    // حساب التشابه
    const similarities = employeeEmbds.embeddings.map(embd =>
      embd.reduce((sum, val, i) => sum + val * queryEmbd.embeddings[0][i], 0)
    );

    // ترتيب النتائج
    const results = employees
      .map((emp, idx) => ({
        ...emp,
        relevance: similarities[idx]
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);  // أفضل 10 نتائج

    return results;
  }
});
```

**الاستخدام**:
```typescript
// في Frontend
const results = await searchEmployeesSemantic({
  query: "موظف في فرع لبن براتب أكثر من 5000",
  branchId: "1010"
});
```

---

### مثال 2: تصنيف طلبات الموظفين تلقائياً

```typescript
// في ملف convex/employeeRequests.ts
export const classifyRequestAutomatically = action({
  args: {
    requestDescription: v.string()
  },
  handler: async (ctx, { requestDescription }) => {
    const vo = new voyageai.Client({ apiKey: process.env.VOYAGE_API_KEY });

    // أنواع الطلبات مع أوصافها
    const requestTypes = {
      "سلفة": "طلب سلفة مالية، قرض، مبلغ مقدم من الراتب",
      "إجازة": "طلب إجازة، عطلة، راحة، غياب",
      "صرف متأخرات": "طلب صرف مستحقات متأخرة، متأخرات، مبالغ سابقة",
      "استئذان": "طلب إذن، خروج مبكر، تأخير، غياب لساعات",
      "اعتراض على مخالفة": "اعتراض، شكوى على مخالفة، استئناف على جزاء",
      "استقالة": "استقالة، ترك العمل، إنهاء العقد"
    };

    // Embed الوصف
    const descEmbd = await vo.embed(
      [requestDescription],
      { model: "voyage-3.5", inputType: "query" }
    );

    // Embed أوصاف الأنواع
    const typeDescriptions = Object.values(requestTypes);
    const typeEmbds = await vo.embed(
      typeDescriptions,
      { model: "voyage-3.5", inputType: "document" }
    );

    // حساب التشابه
    const similarities = typeEmbds.embeddings.map(embd =>
      embd.reduce((sum, val, i) => sum + val * descEmbd.embeddings[0][i], 0)
    );

    // إيجاد أقرب نوع
    const bestIdx = similarities.indexOf(Math.max(...similarities));
    const bestType = Object.keys(requestTypes)[bestIdx];
    const confidence = similarities[bestIdx];

    return {
      requestType: bestType,
      confidence,
      allScores: Object.keys(requestTypes).reduce((acc, type, idx) => {
        acc[type] = similarities[idx];
        return acc;
      }, {} as Record<string, number>)
    };
  }
});
```

---

### مثال 3: توصيات ذكية للتقارير المشابهة

```typescript
// في ملف convex/payroll.ts
export const findSimilarPayrollReports = action({
  args: {
    currentReportId: v.id("payrollRecords"),
    topK: v.optional(v.number())
  },
  handler: async (ctx, { currentReportId, topK = 5 }) => {
    const vo = new voyageai.Client({ apiKey: process.env.VOYAGE_API_KEY });

    // جلب التقرير الحالي
    const currentReport = await ctx.runQuery(/* ... */, { id: currentReportId });

    // جلب جميع التقارير الأخرى
    const allReports = await ctx.runQuery(/* ... */);
    const otherReports = allReports.filter(r => r._id !== currentReportId);

    // إنشاء أوصاف نصية للتقارير
    const createReportDescription = (report: any) => {
      const totalEmployees = report.employees.length;
      const avgSalary = report.totalNetSalary / totalEmployees;

      return `تقرير رواتب ${report.branchName} - ${report.month}/${report.year} - ${totalEmployees} موظف - متوسط الراتب: ${avgSalary.toFixed(0)}`;
    };

    const currentDesc = createReportDescription(currentReport);
    const otherDescs = otherReports.map(createReportDescription);

    // Embed جميع الأوصاف
    const [currentEmbd, otherEmbds] = await Promise.all([
      vo.embed([currentDesc], { model: "voyage-3.5", inputType: "query" }),
      vo.embed(otherDescs, { model: "voyage-3.5", inputType: "document" })
    ]);

    // حساب التشابه
    const similarities = otherEmbds.embeddings.map(embd =>
      embd.reduce((sum, val, i) => sum + val * currentEmbd.embeddings[0][i], 0)
    );

    // ترتيب النتائج
    const results = otherReports
      .map((report, idx) => ({
        ...report,
        similarity: similarities[idx]
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return results;
  }
});
```

---

### مثال 4: نظام AI Assistant ذكي مع RAG

```typescript
// في ملف convex/ai.ts
export const askAIAssistantWithRAG = action({
  args: {
    question: v.string(),
    branchId: v.string(),
    context: v.optional(v.string())  // "revenues", "expenses", "payroll", etc.
  },
  handler: async (ctx, { question, branchId, context }) => {
    const vo = new voyageai.Client({ apiKey: process.env.VOYAGE_API_KEY });
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // 1. جلب البيانات ذات الصلة
    let documents: string[] = [];

    if (context === "revenues" || !context) {
      const revenues = await ctx.runQuery(/* ... */, { branchId });
      documents.push(
        ...revenues.map(r =>
          `إيراد بتاريخ ${new Date(r.date).toLocaleDateString("ar-EG")}: ${r.total} ر.س`
        )
      );
    }

    if (context === "expenses" || !context) {
      const expenses = await ctx.runQuery(/* ... */, { branchId });
      documents.push(
        ...expenses.map(e =>
          `مصروف "${e.title}" بتاريخ ${new Date(e.date).toLocaleDateString("ar-EG")}: ${e.amount} ر.س`
        )
      );
    }

    if (context === "payroll" || !context) {
      const payroll = await ctx.runQuery(/* ... */, { branchId });
      documents.push(
        ...payroll.map(p =>
          `رواتب ${p.month}/${p.year}: ${p.totalNetSalary} ر.س لـ ${p.employees.length} موظف`
        )
      );
    }

    // 2. Embed السؤال والمستندات
    const [questionEmbd, docEmbds] = await Promise.all([
      vo.embed([question], { model: "voyage-3.5", inputType: "query" }),
      vo.embed(documents, { model: "voyage-3.5", inputType: "document" })
    ]);

    // 3. إيجاد أكثر المستندات صلة
    const similarities = docEmbds.embeddings.map(embd =>
      embd.reduce((sum, val, i) => sum + val * questionEmbd.embeddings[0][i], 0)
    );

    const topIndices = similarities
      .map((sim, idx) => ({ sim, idx }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 10)
      .map(item => item.idx);

    const relevantDocs = topIndices.map(idx => documents[idx]);

    // 4. بناء prompt لـ Claude مع السياق
    const contextText = relevantDocs.join("\n");

    const prompt = `أنت مساعد ذكي لنظام الإدارة المالية. استخدم المعلومات التالية للإجابة على السؤال.

**المعلومات ذات الصلة:**
${contextText}

**سؤال المستخدم:**
${question}

**تعليمات:**
- أجب بناءً على المعلومات المقدمة
- كن دقيقاً وواضحاً
- إذا كانت المعلومات غير كافية، اذكر ذلك
- استخدم اللغة العربية`;

    // 5. استدعاء Claude
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: prompt
      }]
    });

    return {
      answer: response.content[0].text,
      relevantDocuments: relevantDocs.slice(0, 5),  // أفضل 5 مستندات
      confidence: Math.max(...similarities.slice(0, 5))
    };
  }
});
```

**الاستخدام في Frontend**:
```typescript
const result = await askAIAssistantWithRAG({
  question: "كم كان إجمالي الإيرادات في الشهر الماضي؟",
  branchId: "1010",
  context: "revenues"
});

console.log(result.answer);
```

---

## الأسئلة الشائعة (FAQ)

### 1. لماذا Voyage embeddings متفوقة في الجودة؟

نماذج Embedding تعتمد على شبكات عصبية قوية لالتقاط وضغط السياق الدلالي. فريق Voyage من الباحثين ذوي الخبرة يحسّن كل مكون من عملية embedding:

- ✅ معمارية النموذج
- ✅ جمع البيانات
- ✅ دوال الخسارة (Loss functions)
- ✅ اختيار المحسّن (Optimizer)

### 2. ما هي النماذج المتاحة وأيها يجب استخدامه؟

**للتضمين العام**:
- `voyage-3-large`: أفضل جودة
- `voyage-3.5-lite`: أقل latency وتكلفة
- `voyage-3.5`: أداء متوازن بجودة استرجاع فائقة بسعر تنافسي

**للاسترجاع**، استخدم معامل `input_type` لتحديد ما إذا كان النص استعلام أو مستند.

**نماذج متخصصة في مجالات**:
- المهام القانونية: `voyage-law-2`
- الأكواد ووثائق البرمجة: `voyage-code-3`
- المهام المالية: `voyage-finance-2`

### 3. أي دالة تشابه يجب استخدامها؟

يمكنك استخدام Voyage embeddings مع:
- **Dot-product similarity**
- **Cosine similarity**
- **Euclidean distance**

**ملاحظة مهمة**: Voyage AI embeddings منظمة للطول 1، مما يعني:
- Cosine similarity معادل لـ dot-product similarity، والأخير يمكن حسابه بشكل أسرع
- Cosine similarity و Euclidean distance سينتجان ترتيبات متطابقة

### 4. متى وكيف يجب استخدام معامل `input_type`؟

**لجميع مهام الاسترجاع وحالات استخدام RAG**، نوصي باستخدام معامل `input_type` لتحديد ما إذا كان النص المدخل استعلام أو مستند:

✅ **استخدم دائماً**:
- `input_type="query"` للاستعلامات
- `input_type="document"` للمستندات

❌ **لا تفعل**:
- حذف `input_type`
- تعيين `input_type=None`

**السبب**: تحديد نوع النص يُنشئ تمثيلات vector أفضل للاسترجاع، مما يؤدي لجودة استرجاع أفضل.

**Prompts المقترنة بـ `input_type`**:
- للاستعلام: `"Represent the query for retrieving supporting documents: "`
- للمستند: `"Represent the document for retrieval: "`

### 5. ما هي خيارات الـ Quantization المتاحة؟

Quantization في embeddings يحول قيم عالية الدقة إلى صيغ أقل دقة، مما يقلل التخزين والذاكرة والتكاليف.

**الخيارات المدعومة** (باستخدام معامل `output_dtype`):

| النوع | الوصف | توفير المساحة |
|-------|--------|---------------|
| `float` | 32-bit (افتراضي) | - |
| `int8` / `uint8` | 8-bit integers | 4x |
| `binary` / `ubinary` | 1-bit binary | 32x |

**مثال**:
```python
result = vo.embed(
    texts,
    model="voyage-code-3",
    output_dtype="int8"  # توفير 4x في المساحة
)
```

### 6. كيف أقطع Matryoshka embeddings؟

Matryoshka learning يُنشئ embeddings بتمثيلات من الخشن إلى الدقيق داخل vector واحد. يمكنك قطع هذه الـ vectors بالاحتفاظ بالجزء الأول من الأبعاد.

**مثال**:
```python
import voyageai
import numpy as np

def embd_normalize(v: np.ndarray) -> np.ndarray:
    """تطبيع صفوف مصفوفة 2D numpy لـ unit vectors"""
    row_norms = np.linalg.norm(v, axis=1, keepdims=True)
    if np.any(row_norms == 0):
        raise ValueError("لا يمكن تطبيع صفوف بقاعدة صفر")
    return v / row_norms

vo = voyageai.Client()

# توليد vectors بحجم 1024 (افتراضي)
embd = vo.embed(['نص 1', 'نص 2'], model='voyage-code-3').embeddings

# تحديد بُعد أقصر
short_dim = 256

# تغيير الحجم وتطبيع vectors للبُعد الأقصر
resized_embd = embd_normalize(np.array(embd)[:, :short_dim]).tolist()
```

---

## التسعير

زُر [صفحة التسعير](https://docs.voyageai.com/docs/pricing?ref=anthropic) في Voyage للحصول على أحدث تفاصيل الأسعار.

**نصيحة**: الأسعار تعتمد على:
- عدد الـ tokens المُعالجة
- النموذج المستخدم
- الحجم (هناك خصومات للاستخدام الكبير)

---

## أفضل الممارسات

### 1. Cache Embeddings

```python
# ✅ جيد: cache embeddings للمستندات الثابتة
embeddings_cache = {}

def get_embedding(text: str, cache=True):
    if cache and text in embeddings_cache:
        return embeddings_cache[text]

    embd = vo.embed([text], model="voyage-3.5").embeddings[0]

    if cache:
        embeddings_cache[text] = embd

    return embd
```

### 2. Batch Processing

```python
# ✅ جيد: embed دفعة واحدة
texts = ["نص 1", "نص 2", ..., "نص 100"]
embeddings = vo.embed(texts, model="voyage-3.5").embeddings

# ❌ تجنب: embed نص بنص
for text in texts:
    embd = vo.embed([text], model="voyage-3.5").embeddings[0]  # بطيء!
```

### 3. اختيار النموذج المناسب

```python
# للأكواد
code_embds = vo.embed(code_snippets, model="voyage-code-3")

# للنصوص المالية
finance_embds = vo.embed(financial_texts, model="voyage-finance-2")

# للنصوص العامة
general_embds = vo.embed(general_texts, model="voyage-3.5")
```

### 4. معالجة الأخطاء

```python
import time

def embed_with_retry(texts, max_retries=3):
    for attempt in range(max_retries):
        try:
            return vo.embed(texts, model="voyage-3.5")
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # exponential backoff
```

---

## الموارد الإضافية

- [Voyage AI Documentation](https://docs.voyageai.com/)
- [Voyage AI Blog](https://blog.voyageai.com/)
- [RAG Cookbook (Anthropic + Pinecone)](https://github.com/anthropics/anthropic-cookbook/blob/main/third_party/Pinecone/rag_using_pinecone.ipynb)
- [Vector Similarity Explained](https://www.pinecone.io/learn/vector-similarity/)
- [MTEB Leaderboard](https://huggingface.co/mteb)

---

## الدعم والتواصل

للحصول على مساعدة أو الإبلاغ عن مشاكل:
- Voyage AI Support: [docs.voyageai.com](https://docs.voyageai.com)
- Anthropic Documentation: [docs.anthropic.com](https://docs.anthropic.com)
- GitHub Issues: [github.com/anthropics/anthropic-sdk-python](https://github.com/anthropics/anthropic-sdk-python)

---

**آخر تحديث**: 2025-10-24
**الموصى به**: Voyage AI (voyage-3.5, voyage-3-large, voyage-3.5-lite)
