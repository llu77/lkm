# Code Execution Tool - دليل أداة تنفيذ الأكواد

## نظرة عامة

أداة **Code Execution** هي إحدى أدوات Claude API المتقدمة التي تمكن النموذج من تنفيذ أكواد Bash ومعالجة الملفات مباشرة داخل بيئة sandbox آمنة. هذه الأداة تفتح إمكانيات هائلة لتحليل البيانات، إنشاء Visualizations، ومعالجة الملفات بشكل ديناميكي.

---

## المتطلبات والإعداد

### التوافق مع النماذج

| النموذج | إصدار الأداة | الحالة |
|---------|-------------|--------|
| `claude-opus-4-1-20250805` | `code_execution_20250825` | ✅ متاح |
| `claude-opus-4-20250514` | `code_execution_20250825` | ✅ متاح |
| `claude-sonnet-4-5-20250929` | `code_execution_20250825` | ✅ متاح |
| `claude-sonnet-4-20250514` | `code_execution_20250825` | ✅ متاح |
| `claude-sonnet-3-7-20250219` | `code_execution_20250825` | ✅ متاح |
| `claude-haiku-4-5-20251001` | `code_execution_20250825` | ✅ متاح |

### Beta Header المطلوب

```javascript
"anthropic-beta": "code-execution-2025-08-25"
```

⚠️ **ملاحظة مهمة**: الإصدار الحالي `code_execution_20250825` يدعم Bash وعمليات الملفات. الإصدار القديم `code_execution_20250522` (Python فقط) متاح أيضاً.

---

## البدء السريع

### مثال بسيط: حسابات رياضية

```bash
curl https://api.anthropic.com/v1/messages \
  --header "x-api-key: $ANTHROPIC_API_KEY" \
  --header "anthropic-version: 2023-06-01" \
  --header "anthropic-beta: code-execution-2025-08-25" \
  --header "content-type: application/json" \
  --data '{
    "model": "claude-sonnet-4-5",
    "max_tokens": 4096,
    "messages": [{
      "role": "user",
      "content": "احسب المتوسط والانحراف المعياري لـ [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
    }],
    "tools": [{
      "type": "code_execution_20250825",
      "name": "code_execution"
    }]
  }'
```

### مثال Python

```python
import anthropic

client = anthropic.Anthropic()

response = client.beta.messages.create(
    model="claude-sonnet-4-5",
    betas=["code-execution-2025-08-25"],
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": "احسب المتوسط والانحراف المعياري لـ [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
    }],
    tools=[{
        "type": "code_execution_20250825",
        "name": "code_execution"
    }]
)

print(response)
```

### مثال TypeScript/JavaScript

```typescript
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

async function main() {
  const response = await anthropic.beta.messages.create({
    model: "claude-sonnet-4-5",
    betas: ["code-execution-2025-08-25"],
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: "احسب المتوسط والانحراف المعياري لـ [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
    }],
    tools: [{
      type: "code_execution_20250825",
      name: "code_execution"
    }]
  });

  console.log(response);
}

main().catch(console.error);
```

---

## آلية العمل

### تدفق العمل

1. **التقييم**: Claude يقيم ما إذا كان تنفيذ الكود سيساعد في الإجابة على السؤال
2. **القدرات المتاحة**:
   * **Bash commands**: تنفيذ أوامر Shell للعمليات النظامية وإدارة الحزم
   * **File operations**: إنشاء، عرض، وتعديل الملفات مباشرة، بما في ذلك كتابة الأكواد
3. **التنفيذ**: استخدام أي مزيج من هذه القدرات في طلب واحد
4. **البيئة**: جميع العمليات تعمل في بيئة sandbox آمنة
5. **النتائج**: Claude يقدم النتائج مع أي رسوم بيانية، حسابات، أو تحليلات

---

## حالات الاستخدام المتقدمة

### 1. تنفيذ أوامر Bash

#### فحص معلومات النظام وتثبيت الحزم

```python
response = client.beta.messages.create(
    model="claude-sonnet-4-5",
    betas=["code-execution-2025-08-25"],
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": "افحص إصدار Python واعرض الحزم المثبتة"
    }],
    tools=[{
        "type": "code_execution_20250825",
        "name": "code_execution"
    }]
)
```

### 2. إنشاء وتعديل الملفات

Claude يمكنه إنشاء، عرض، وتعديل الملفات مباشرة في sandbox باستخدام قدرات معالجة الملفات:

```python
response = client.beta.messages.create(
    model="claude-sonnet-4-5",
    betas=["code-execution-2025-08-25"],
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": "أنشئ ملف config.yaml بإعدادات قاعدة البيانات، ثم حدّث المنفذ من 5432 إلى 3306"
    }],
    tools=[{
        "type": "code_execution_20250825",
        "name": "code_execution"
    }]
)
```

### 3. رفع وتحليل الملفات الخاصة

#### رفع ملف عبر Files API

```python
import anthropic

client = anthropic.Anthropic()

# 1. رفع الملف
file_object = client.beta.files.upload(
    file=open("data.csv", "rb"),
)

# 2. استخدام file_id مع code execution
response = client.beta.messages.create(
    model="claude-sonnet-4-5",
    betas=["code-execution-2025-08-25", "files-api-2025-04-14"],
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "حلل بيانات CSV هذه وأنشئ رسم بياني"},
            {"type": "container_upload", "file_id": file_object.id}
        ]
    }],
    tools=[{
        "type": "code_execution_20250825",
        "name": "code_execution"
    }]
)
```

⚠️ **مهم**: استخدام Files API مع Code Execution يتطلب header ثاني:
```
"anthropic-beta": "code-execution-2025-08-25,files-api-2025-04-14"
```

#### أنواع الملفات المدعومة

البيئة Python يمكنها معالجة أنواع مختلفة من الملفات:
- CSV
- Excel (.xlsx, .xls)
- JSON
- XML
- Images (JPEG, PNG, GIF, WebP)
- Text files (.txt, .md, .py, etc)

### 4. استرجاع الملفات المُنشأة

عندما يُنشئ Claude ملفات أثناء التنفيذ، يمكنك استرجاعها باستخدام Files API:

```python
from anthropic import Anthropic

client = Anthropic()

# طلب تنفيذ يُنشئ ملفات
response = client.beta.messages.create(
    model="claude-sonnet-4-5",
    betas=["code-execution-2025-08-25", "files-api-2025-04-14"],
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": "أنشئ رسم بياني بـ matplotlib واحفظه كـ output.png"
    }],
    tools=[{
        "type": "code_execution_20250825",
        "name": "code_execution"
    }]
)

# استخراج معرفات الملفات من الاستجابة
def extract_file_ids(response):
    file_ids = []
    for item in response.content:
        if item.type == 'bash_code_execution_tool_result':
            content_item = item.content
            if content_item.type == 'bash_code_execution_result':
                for file in content_item.content:
                    if hasattr(file, 'file_id'):
                        file_ids.append(file.file_id)
    return file_ids

# تنزيل الملفات المُنشأة
for file_id in extract_file_ids(response):
    file_metadata = client.beta.files.retrieve_metadata(file_id)
    file_content = client.beta.files.download(file_id)
    file_content.write_to_file(file_metadata.filename)
    print(f"تم التنزيل: {file_metadata.filename}")
```

### 5. دمج العمليات المتعددة

سيناريو معقد يستخدم جميع القدرات:

```python
# رفع ملف
file_object = client.beta.files.upload(
    file=open("data.csv", "rb"),
)

# استخدامه مع code execution
response = client.beta.messages.create(
    model="claude-sonnet-4-5",
    betas=["code-execution-2025-08-25", "files-api-2025-04-14"],
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": "حلل بيانات CSV هذه: أنشئ تقرير ملخص، احفظ visualizations، وأنشئ README بالنتائج"
            },
            {
                "type": "container_upload",
                "file_id": file_object.id
            }
        ]
    }],
    tools=[{
        "type": "code_execution_20250825",
        "name": "code_execution"
    }]
)

# Claude قد:
# 1. يستخدم bash لفحص حجم الملف ومعاينة البيانات
# 2. يستخدم text_editor لكتابة كود Python لتحليل CSV وإنشاء visualizations
# 3. يستخدم bash لتشغيل كود Python
# 4. يستخدم text_editor لإنشاء README.md بالنتائج
# 5. يستخدم bash لتنظيم الملفات في مجلد تقارير
```

---

## تعريف الأداة

تعريف الأداة بسيط ولا يتطلب معاملات إضافية:

```json
{
  "type": "code_execution_20250825",
  "name": "code_execution"
}
```

عند توفير هذه الأداة، Claude يحصل تلقائياً على أداتين فرعيتين:
- `bash_code_execution`: تشغيل أوامر Shell
- `text_editor_code_execution`: عرض، إنشاء، وتعديل الملفات

---

## تنسيقات الاستجابة

### استجابة أمر Bash

```json
{
  "type": "server_tool_use",
  "id": "srvtoolu_01B3C4D5E6F7G8H9I0J1K2L3",
  "name": "bash_code_execution",
  "input": {
    "command": "ls -la | head -5"
  }
},
{
  "type": "bash_code_execution_tool_result",
  "tool_use_id": "srvtoolu_01B3C4D5E6F7G8H9I0J1K2L3",
  "content": {
    "type": "bash_code_execution_result",
    "stdout": "total 24\ndrwxr-xr-x 2 user user 4096 Jan 1 12:00 .\n...",
    "stderr": "",
    "return_code": 0
  }
}
```

### استجابة عرض ملف

```json
{
  "type": "text_editor_code_execution_tool_result",
  "tool_use_id": "srvtoolu_01C4D5E6F7G8H9I0J1K2L3M4",
  "content": {
    "type": "text_editor_code_execution_result",
    "file_type": "text",
    "content": "{\n  \"setting\": \"value\",\n  \"debug\": true\n}",
    "numLines": 4,
    "startLine": 1,
    "totalLines": 4
  }
}
```

### استجابة إنشاء ملف

```json
{
  "type": "text_editor_code_execution_tool_result",
  "tool_use_id": "srvtoolu_01D5E6F7G8H9I0J1K2L3M4N5",
  "content": {
    "type": "text_editor_code_execution_result",
    "is_file_update": false
  }
}
```

### حقول النتائج

جميع نتائج التنفيذ تتضمن:
- `stdout`: مخرجات التنفيذ الناجح
- `stderr`: رسائل الخطأ في حال الفشل
- `return_code`: 0 للنجاح، غير صفر للفشل

حقول إضافية لعمليات الملفات:
- **View**: `file_type`, `content`, `numLines`, `startLine`, `totalLines`
- **Create**: `is_file_update` (هل الملف موجود مسبقاً)
- **Edit**: `oldStart`, `oldLines`, `newStart`, `newLines`, `lines` (تنسيق diff)

---

## معالجة الأخطاء

### أكواد الأخطاء حسب نوع الأداة

| الأداة | كود الخطأ | الوصف |
|-------|-----------|-------|
| All tools | `unavailable` | الأداة غير متاحة مؤقتاً |
| All tools | `execution_time_exceeded` | تجاوز الوقت الأقصى للتنفيذ |
| All tools | `container_expired` | انتهى صلاحية الـ container |
| All tools | `invalid_tool_input` | معاملات غير صالحة مقدمة للأداة |
| All tools | `too_many_requests` | تجاوز حد الطلبات |
| text_editor | `file_not_found` | الملف غير موجود |
| text_editor | `string_not_found` | الـ `old_str` غير موجود في الملف |

### مثال استجابة خطأ

```json
{
  "type": "bash_code_execution_tool_result",
  "tool_use_id": "srvtoolu_01VfmxgZ46TiHbmXgy928hQR",
  "content": {
    "type": "bash_code_execution_tool_result_error",
    "error_code": "unavailable"
  }
}
```

### `pause_turn` Stop Reason

قد تتضمن الاستجابة `pause_turn` stop reason، مما يشير إلى أن API أوقفت turn طويل. يمكنك تقديم الاستجابة كما هي في طلب لاحق للسماح لـ Claude بمتابعة turn الخاص به.

---

## بيئة Containers

### البيئة الزمنية للتنفيذ

- **إصدار Python**: 3.11.12
- **نظام التشغيل**: Linux-based container
- **المعمارية**: x86_64 (AMD64)

### حدود الموارد

- **الذاكرة**: 5GiB RAM
- **مساحة القرص**: 5GiB workspace storage
- **المعالج**: 1 CPU

### الشبكة والأمان

- **الوصول للإنترنت**: معطل تماماً للأمان
- **الاتصالات الخارجية**: غير مسموح بطلبات شبكة خارجية
- **عزل Sandbox**: عزل كامل عن النظام المضيف وcontainers أخرى
- **الوصول للملفات**: محدود على مجلد workspace فقط
- **نطاق Workspace**: مثل [Files API](https://docs.anthropic.com/docs/build-with-claude/files)، containers محدودة بـ workspace الخاص بمفتاح API
- **الانتهاء**: Containers تنتهي صلاحيتها بعد 30 يوم من الإنشاء

### المكتبات المثبتة مسبقاً

بيئة Python تتضمن هذه المكتبات الشائعة:

**علوم البيانات**: pandas, numpy, scipy, scikit-learn, statsmodels
**Visualization**: matplotlib, seaborn
**معالجة الملفات**: pyarrow, openpyxl, xlsxwriter, xlrd, pillow, python-pptx, python-docx, pypdf, pdfplumber, pypdfium2, pdf2image, pdfkit, tabula-py, reportlab[pycairo], Img2pdf
**Math & Computing**: sympy, mpmath
**Utilities**: tqdm, python-dateutil, pytz, joblib, unzip, unrar, 7zip, bc, rg (ripgrep), fd, sqlite

---

## إعادة استخدام Containers

يمكنك إعادة استخدام container موجود عبر طلبات API متعددة بتوفير container ID من استجابة سابقة. هذا يسمح لك بالحفاظ على الملفات المُنشأة بين الطلبات.

### مثال

```python
import os
from anthropic import Anthropic

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# الطلب الأول: إنشاء ملف برقم عشوائي
response1 = client.beta.messages.create(
    model="claude-sonnet-4-5",
    betas=["code-execution-2025-08-25"],
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": "اكتب ملف برقم عشوائي واحفظه في '/tmp/number.txt'"
    }],
    tools=[{
        "type": "code_execution_20250825",
        "name": "code_execution"
    }]
)

# استخراج container ID من الاستجابة الأولى
container_id = response1.container.id

# الطلب الثاني: إعادة استخدام container لقراءة الملف
response2 = client.beta.messages.create(
    container=container_id,  # إعادة استخدام نفس الـ container
    model="claude-sonnet-4-5",
    betas=["code-execution-2025-08-25"],
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": "اقرأ الرقم من '/tmp/number.txt' واحسب مربعه"
    }],
    tools=[{
        "type": "code_execution_20250825",
        "name": "code_execution"
    }]
)
```

---

## Streaming

مع تفعيل streaming، ستتلقى أحداث تنفيذ الكود كما تحدث:

```javascript
event: content_block_start
data: {"type": "content_block_start", "index": 1, "content_block": {"type": "server_tool_use", "id": "srvtoolu_xyz789", "name": "code_execution"}}

// Code execution streamed
event: content_block_delta
data: {"type": "content_block_delta", "index": 1, "delta": {"type": "input_json_delta", "partial_json": "{\"code\":\"import pandas as pd\\ndf = pd.read_csv('data.csv')\\nprint(df.head())\"}"}}

// Pause while code executes

// Execution results streamed
event: content_block_start
data: {"type": "content_block_start", "index": 2, "content_block": {"type": "code_execution_tool_result", "tool_use_id": "srvtoolu_xyz789", "content": {"stdout": "   A  B  C\n0  1  2  3\n1  4  5  6", "stderr": ""}}}
```

---

## طلبات Batch

يمكنك تضمين code execution tool في [Messages Batches API](https://docs.anthropic.com/docs/build-with-claude/batch-processing). استدعاءات الأداة عبر Messages Batches API تُسعّر بنفس سعر استدعاءات Messages API العادية.

---

## الاستخدام والتسعير

استخدام code execution tool يُتتبع بشكل منفصل عن استخدام tokens. وقت التنفيذ هو الحد الأدنى 5 دقائق.

إذا تم تضمين ملفات في الطلب، يتم فوترة وقت التنفيذ حتى لو لم تُستخدم الأداة بسبب تحميل الملفات مسبقاً على container.

**التسعير**: $0.05 لكل ساعة session.

---

## الترقية إلى أحدث إصدار

بالترقية إلى `code-execution-2025-08-25`، تحصل على الوصول إلى معالجة الملفات وقدرات Bash، بما في ذلك الأكواد بلغات متعددة. لا يوجد فرق في السعر.

### ما الذي تغيّر

| المكون | القديم | الحالي |
|--------|--------|--------|
| Beta header | `code-execution-2025-05-22` | `code-execution-2025-08-25` |
| Tool type | `code_execution_20250522` | `code_execution_20250825` |
| القدرات | Python فقط | أوامر Bash، عمليات الملفات |
| أنواع الاستجابة | `code_execution_result` | `bash_code_execution_result`, `text_editor_code_execution_result` |

### التوافق العكسي

- جميع أكواد Python الموجودة تستمر بالعمل تماماً كما كانت
- لا توجد تغييرات مطلوبة لسير عمل Python فقط

### خطوات الترقية

للترقية، تحتاج إلى إجراء التغييرات التالية في طلبات API:

1. **تحديث beta header**:
```diff
- "anthropic-beta": "code-execution-2025-05-22"
+ "anthropic-beta": "code-execution-2025-08-25"
```

2. **تحديث tool type**:
```diff
- "type": "code_execution_20250522"
+ "type": "code_execution_20250825"
```

3. **مراجعة معالجة الاستجابات** (إذا كنت تحلل الاستجابات برمجياً):
   * لن يتم إرسال الكتل السابقة لاستجابات تنفيذ Python
   * بدلاً من ذلك، سيتم إرسال أنواع استجابة جديدة لـ Bash وعمليات الملفات

---

## استخدام Code Execution مع Agent Skills

أداة code execution تمكن Claude من استخدام [Agent Skills](https://docs.anthropic.com/docs/agents-and-tools/agent-skills/overview). Skills هي قدرات وحدات تتكون من تعليمات، سكريبتات، وموارد تمدد وظائف Claude.

تعلم المزيد في [وثائق Agent Skills](https://docs.anthropic.com/docs/agents-and-tools/agent-skills/overview) و [دليل Agent Skills API](https://docs.anthropic.com/docs/agents-and-tools/agent-skills/api).

---

## أمثلة عملية من مشروعنا

بناءً على تحليل المشروع الحالي (`lkm`), إليك كيف يمكن استخدام Code Execution Tool:

### مثال 1: تحليل بيانات الإيرادات

```python
# في ملف convex/ai.ts، يمكن إضافة:
export const analyzeRevenueWithCodeExecution = action({
  args: {
    branchId: v.string(),
    startDate: v.number(),
    endDate: v.number()
  },
  handler: async (ctx, { branchId, startDate, endDate }) => {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // جلب بيانات الإيرادات
    const revenues = await ctx.runQuery(/* ... */);

    // استخدام Code Execution لتحليل البيانات
    const response = await anthropic.beta.messages.create({
      model: "claude-sonnet-4-5",
      betas: ["code-execution-2025-08-25"],
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `حلل بيانات الإيرادات التالية وأنشئ رسم بياني:
        ${JSON.stringify(revenues, null, 2)}

        1. احسب الإحصائيات (المتوسط، الانحراف المعياري، الاتجاهات)
        2. اكتشف الشذوذات
        3. أنشئ رسم بياني line chart
        4. احفظ الرسم كـ PNG`
      }],
      tools: [{
        type: "code_execution_20250825",
        name: "code_execution"
      }]
    });

    return response;
  }
});
```

### مثال 2: توليد تقارير PDF

```python
export const generatePayrollReport = action({
  args: {
    branchId: v.string(),
    month: v.number(),
    year: v.number()
  },
  handler: async (ctx, { branchId, month, year }) => {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // جلب بيانات الرواتب
    const payrollData = await ctx.runQuery(/* ... */);

    // استخدام Code Execution لتوليد PDF
    const response = await anthropic.beta.messages.create({
      model: "claude-sonnet-4-5",
      betas: ["code-execution-2025-08-25"],
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `أنشئ تقرير PDF احترافي للرواتب:
        ${JSON.stringify(payrollData, null, 2)}

        استخدم مكتبة reportlab لإنشاء:
        1. جدول بتفاصيل رواتب كل موظف
        2. رسم بياني bar chart للرواتب
        3. ملخص إحصائي
        4. احفظ الملف كـ payroll_report.pdf`
      }],
      tools: [{
        type: "code_execution_20250825",
        name: "code_execution"
      }]
    });

    // استخراج واسترجاع ملف PDF
    // ...

    return response;
  }
});
```

---

## أفضل الممارسات

### 1. الأمان

- ✅ **استخدم Sandbox** للبيانات الحساسة
- ✅ **تحقق من المدخلات** قبل إرسالها لـ Claude
- ⚠️ **لا تثق عمياً** في الأكواد المُنشأة
- ⚠️ **راجع النتائج** قبل استخدامها في بيئات الإنتاج

### 2. الأداء

- ✅ **استخدم Container Reuse** للطلبات المتتالية
- ✅ **حدد أهداف واضحة** لتقليل وقت التنفيذ
- ✅ **استخدم Batch Requests** للعمليات المتعددة
- ⚠️ **راقب الاستخدام** لتجنب التكاليف الزائدة

### 3. معالجة الأخطاء

```python
try:
    response = client.beta.messages.create(/* ... */)
    # معالجة الاستجابة
except anthropic.APIError as e:
    if e.error_code == "execution_time_exceeded":
        # التعامل مع timeout
        pass
    elif e.error_code == "container_expired":
        # إعادة إنشاء container
        pass
    else:
        # معالجة أخطاء أخرى
        pass
```

---

## الموارد الإضافية

- [وثائق Claude الرسمية](https://docs.anthropic.com/en/docs/build-with-claude/code-execution)
- [Agent Skills Documentation](https://docs.anthropic.com/docs/agents-and-tools/agent-skills/overview)
- [Files API Documentation](https://docs.anthropic.com/docs/build-with-claude/files)
- [Batch Processing API](https://docs.anthropic.com/docs/build-with-claude/batch-processing)

---

## الدعم والتواصل

للحصول على مساعدة أو الإبلاغ عن مشاكل:
- GitHub Issues: [github.com/anthropics/anthropic-sdk-python](https://github.com/anthropics/anthropic-sdk-python)
- الوثائق الرسمية: [docs.anthropic.com](https://docs.anthropic.com)
- Community: [Claude Community Forum](https://community.anthropic.com)

---

**آخر تحديث**: 2025-10-24
**الإصدار**: code_execution_20250825
