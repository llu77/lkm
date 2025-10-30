# MCP Server Configuration Guide

تم تكوين خوادم Cloudflare MCP وفقاً للتوثيق الرسمي لـ Claude Code.

## 📋 الخوادم المُكونة

### 1. **cloudflare-docs**
- **الوصف:** الوصول إلى وثائق Cloudflare الرسمية
- **الاستخدام:** يتم تفعيله تلقائياً عند الحاجة للمعلومات عن Cloudflare
- **الأدوات المتاحة:** البحث في التوثيق، الأمثلة، أفضل الممارسات

### 2. **cloudflare-workers**
- **الوصف:** إدارة حساب Cloudflare الخاص بك
- **الاستخدام:** للتفاعل مع Workers، KV، R2، D1
- **المتطلبات:** تسجيل دخول OAuth عند أول استخدام

---

## 🚀 كيفية الاستخدام

### الطريقة 1: الاستخدام التلقائي
Claude Code سيستخدم خوادم MCP تلقائياً عند الحاجة. فقط اطلب:

```
"أنشئ Cloudflare Worker جديد"
"اعرض قائمة Workers الموجودة"
"كيف أستخدم Durable Objects؟"
```

### الطريقة 2: التحقق من الخوادم المتاحة
```bash
/mcp
```

سيعرض قائمة بجميع خوادم MCP المُكونة.

---

## ⚙️ التكوين

الخوادم مُكونة في:
```
.claude/settings.json
```

### تعطيل/تفعيل خادم معين:
غير قيمة `disabled` في ملف `settings.json`:

```json
{
  "mcpServers": {
    "cloudflare-docs": {
      "disabled": true  // لتعطيل الخادم
    }
  }
}
```

---

## 🔧 استكشاف الأخطاء

### إذا لم تعمل الخوادم:

1. **أعد تشغيل Claude Code**
   ```bash
   exit  # ثم ابدأ جلسة جديدة
   ```

2. **تحقق من التكوين**
   ```bash
   /mcp
   ```

3. **تحقق من اتصال الإنترنت**
   الخوادم البعيدة تحتاج اتصال إنترنت نشط

4. **راجع السجلات**
   ```bash
   claude --mcp-debug
   ```

---

## 📚 الأدوات المتاحة

### من cloudflare-docs:
- `search_docs` - البحث في وثائق Cloudflare
- `get_guide` - الحصول على دليل محدد
- `list_examples` - عرض الأمثلة

### من cloudflare-workers:
- `list_workers` - عرض جميع Workers
- `create_worker` - إنشاء Worker جديد
- `update_worker` - تحديث Worker موجود
- `delete_worker` - حذف Worker
- `kv_*` - عمليات KV storage
- `r2_*` - عمليات R2 storage
- `d1_*` - عمليات D1 database

---

## 🔐 المصادقة

### لـ cloudflare-workers:
عند أول استخدام، ستحتاج إلى:

1. **OAuth Flow:** سيفتح متصفح لتسجيل الدخول
2. **منح الأذونات:** وافق على الأذونات المطلوبة
3. **العودة لـ Claude Code:** سيتم الربط تلقائياً

---

## 📖 المراجع

- [Claude Code MCP Documentation](https://docs.claude.com/en/docs/claude-code/mcp)
- [Cloudflare MCP Server](https://github.com/cloudflare/mcp-server-cloudflare)
- [Model Context Protocol](https://modelcontextprotocol.io)

---

## ✅ التحقق من النجاح

لتأكيد أن التكوين يعمل:

```bash
/mcp
```

يجب أن ترى:
- ✅ cloudflare-docs: enabled
- ✅ cloudflare-workers: enabled

إذا رأيت ❌ أو "not found"، راجع قسم استكشاف الأخطاء أعلاه.
