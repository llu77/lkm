# نظام الصلاحيات والفروع - SymbolAI

## 📋 نظرة عامة

تم تنفيذ نظام شامل للصلاحيات القائمة على الأدوار (RBAC) مع عزل البيانات حسب الفروع.

## 👥 الأدوار الأربعة

### 1. الأدمن (Admin)
**الصلاحيات:**
- ✅ مشاهدة جميع الفروع
- ✅ إدارة المستخدمين (إضافة، تعديل، حذف)
- ✅ إدارة الفروع
- ✅ إدارة الإعدادات
- ✅ جميع الصلاحيات (CRUD كامل)

**الاستخدام:**
- المدير العام للنظام
- الوصول الكامل لجميع البيانات والإعدادات

### 2. مشرف الفرع (Supervisor)
**الصلاحيات:**
- ✅ إدخال الإيرادات والمصروفات (لفرعه فقط)
- ✅ إدارة طلبات المنتجات
- ✅ إدارة طلبات الموظفين والموافقة عليها
- ✅ إدارة الموظفين
- ✅ إنشاء كشوف الرواتب
- ✅ إدارة المكافآت
- ✅ مشاهدة التقارير (لفرعه فقط)
- ❌ لا يستطيع مشاهدة بيانات الفروع الأخرى

**العزل:**
- مرتبط بـ `branch_id` واحد
- جميع عملياته محصورة في فرعه

### 3. الشريك (Partner)
**الصلاحيات:**
- ✅ مشاهدة الإحصائيات والتقارير (لفرعه فقط)
- ❌ لا يستطيع الإضافة أو التعديل
- ❌ لا يستطيع مشاهدة بيانات الفروع الأخرى

**الاستخدام:**
- للشركاء الذين يريدون متابعة أداء فرعهم فقط

### 4. الموظف (Employee)
**الصلاحيات:**
- ✅ رفع طلبات الموظفين (إجازة، سلفة، إذن، شكوى، اقتراح)
- ✅ متابعة طلباته
- ✅ مشاهدة مكافآته
- ❌ لا يستطيع مشاهدة البيانات المالية
- ❌ لا يستطيع مشاهدة بيانات موظفين آخرين

## 🗄️ هيكل قاعدة البيانات

### الجداول الجديدة

#### 1. `branches` - جدول الفروع
```sql
- id: معرف الفرع
- name: الاسم بالإنجليزية
- name_ar: الاسم بالعربية
- location: الموقع
- phone: الهاتف
- manager_name: اسم المدير
- is_active: نشط/غير نشط
- total_revenue: إجمالي الإيرادات
- total_expenses: إجمالي المصروفات
- employee_count: عدد الموظفين
```

#### 2. `roles` - جدول الأدوار
```sql
- id: معرف الدور
- name: اسم الدور (admin, supervisor, partner, employee)
- name_ar: الاسم بالعربية
- 16 صلاحية (can_*)
```

#### 3. `users_new` - جدول المستخدمين المحدّث
```sql
- الحقول القديمة + role_id + branch_id
```

#### 4. `audit_logs` - سجل التدقيق
```sql
- تسجيل كل العمليات (create, update, delete, view)
- معلومات المستخدم والفرع
- IP Address و User Agent
```

### Views (طرق عرض محسّنة)

#### `users_with_roles`
عرض المستخدمين مع معلومات الدور والفرع

#### `branch_statistics`
إحصائيات كل فرع (موظفين، إيرادات، مصروفات، طلبات)

## 🔐 نظام الصلاحيات

### ملف `permissions.ts`

**الدوال الرئيسية:**

```typescript
// 1. تحميل صلاحيات المستخدم
loadUserPermissions(db, userId)

// 2. التحقق من الصلاحية مع جلب الأذونات
requireAuthWithPermissions(kv, db, request)

// 3. التحقق من دور الأدمن
requireAdminRole(kv, db, request)

// 4. التحقق من مشرف أو أدمن
requireSupervisorOrAdmin(kv, db, request)

// 5. التحقق من صلاحية محددة
checkPermission(session, 'canAddRevenue')

// 6. فحص الوصول للفرع
canAccessBranch(session, branchId)

// 7. الحصول على الفروع المسموحة
getAllowedBranchIds(session) // null = الكل, [id] = فرع واحد

// 8. التحقق من الوصول للفرع في API
validateBranchAccess(session, requestedBranchId)

// 9. الحصول على WHERE clause للعزل
getBranchFilterSQL(session)
// Admin: '' (بدون فلترة)
// Supervisor: 'AND branch_id = ?' مع [branchId]

// 10. تسجيل التدقيق
logAudit(db, session, action, entityType, entityId, details)
```

## 📧 معالجة أخطاء البريد الإلكتروني

### ملف `email-error-handler.ts`

**المميزات:**

1. **تصنيف الأخطاء (Error Classification)**
   - أخطاء الشبكة (قابلة لإعادة المحاولة)
   - أخطاء API
   - أخطاء التحقق (غير قابلة لإعادة المحاولة)
   - أخطاء النظام

2. **إعادة المحاولة مع Exponential Backoff**
   ```typescript
   retryWithBackoff(operation, config)
   // محاولات: 2s, 5s, 10s
   ```

3. **نظام الإشعارات البديلة**
   - تسجيل الأخطاء في قاعدة البيانات
   - إنشاء تنبيهات للأخطاء الحرجة
   - إشعار الأدمن للأخطاء العالية/الحرجة

4. **فحص صحة النظام**
   ```typescript
   checkEmailSystemHealth(env)
   // يفحص: API Key, الفشل الأخير, حدود الإرسال
   ```

## 🔌 APIs الجديدة

### إدارة الفروع

| Endpoint | الدور المطلوب | الوظيفة |
|----------|--------------|---------|
| `GET /api/branches/list` | Any (مع عزل) | قائمة الفروع |
| `POST /api/branches/create` | Admin | إنشاء فرع |
| `POST /api/branches/update` | Admin | تحديث فرع |
| `GET /api/branches/stats` | Any (مع عزل) | إحصائيات فرع |

### إدارة المستخدمين

| Endpoint | الدور المطلوب | الوظيفة |
|----------|--------------|---------|
| `GET /api/users/list` | Admin/Supervisor | قائمة المستخدمين |
| `POST /api/users/create` | Admin | إنشاء مستخدم |
| `POST /api/users/update` | Admin | تحديث مستخدم |

### الأدوار

| Endpoint | الدور المطلوب | الوظيفة |
|----------|--------------|---------|
| `GET /api/roles/list` | Any | قائمة الأدوار |

### فحص البريد الإلكتروني

| Endpoint | الدور المطلوب | الوظيفة |
|----------|--------------|---------|
| `GET /api/email/health` | Admin | فحص صحة نظام البريد |

## 📝 مثال على استخدام الصلاحيات في API

```typescript
// مثال: API لإضافة إيراد مع عزل الفرع

import { requireAuthWithPermissions, requirePermission, validateBranchAccess, logAudit } from '@/lib/permissions';

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. التحقق من الصلاحيات
  const authResult = await requireAuthWithPermissions(
    locals.runtime.env.SESSIONS,
    locals.runtime.env.DB,
    request
  );

  if (authResult instanceof Response) {
    return authResult;
  }

  // 2. التحقق من صلاحية محددة
  const permissionError = requirePermission(authResult, 'canAddRevenue');
  if (permissionError) {
    return permissionError;
  }

  const { branchId, amount, description } = await request.json();

  // 3. التحقق من الوصول للفرع
  const branchAccessError = validateBranchAccess(authResult, branchId);
  if (branchAccessError) {
    return branchAccessError;
  }

  // 4. تنفيذ العملية
  const revenueId = generateId();
  await locals.runtime.env.DB.prepare(`
    INSERT INTO revenues (id, branch_id, amount, description)
    VALUES (?, ?, ?, ?)
  `).bind(revenueId, branchId, amount, description).run();

  // 5. تسجيل التدقيق
  await logAudit(
    locals.runtime.env.DB,
    authResult,
    'create',
    'revenue',
    revenueId,
    { branchId, amount },
    getClientIP(request)
  );

  return new Response(JSON.stringify({ success: true, id: revenueId }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

## 🚀 خطوات التفعيل

### 1. تطبيق Migration
```bash
cd symbolai-worker

# Local
wrangler d1 execute DB --local --file=./migrations/002_create_branches_and_roles.sql

# Production
wrangler d1 execute DB --remote --file=./migrations/002_create_branches_and_roles.sql
```

### 2. ترحيل المستخدمين الحاليين (إذا وجدوا)
```sql
-- نقل البيانات من users إلى users_new
INSERT INTO users_new (id, username, password, email, full_name, phone, role_id, branch_id, is_active, created_at)
SELECT
  id,
  username,
  password,
  email,
  full_name,
  phone,
  'role_admin' as role_id,  -- أو حسب المنطق
  NULL as branch_id,
  is_active,
  created_at
FROM users;

-- حذف الجدول القديم
DROP TABLE users;

-- إعادة تسمية
ALTER TABLE users_new RENAME TO users;
```

### 3. إنشاء الفروع
استخدم `/api/branches/create` لإضافة فروعك

### 4. تعيين الأدوار والفروع للمستخدمين
استخدم `/api/users/update` لتعيين role_id و branch_id

## 📊 سيناريوهات الاستخدام

### سيناريو 1: مشرف فرع يدخل إيراد
1. تسجيل الدخول → يحصل على session مع `branchId = 'branch_cairo'`
2. فتح صفحة الإيرادات
3. إدخال إيراد → API يتحقق من `canAddRevenue = true`
4. API يتحقق من `branchId` المطلوب = `branch_cairo` ✅
5. يتم الحفظ بنجاح

### سيناريو 2: مشرف يحاول الوصول لفرع آخر
1. تسجيل الدخول → `branchId = 'branch_cairo'`
2. محاولة الوصول لبيانات `branch_alex`
3. `validateBranchAccess()` → يرجع 403 Forbidden ❌

### سيناريو 3: شريك يشاهد الإحصائيات
1. تسجيل الدخول → `branchId = 'branch_cairo'`, `canViewReports = true`
2. فتح Dashboard → يرى إحصائيات فرعه فقط
3. لا يرى أزرار الإضافة/التعديل (frontend يخفيها حسب الصلاحيات)

### سيناريو 4: موظف يرفع طلب
1. تسجيل الدخول → `canSubmitRequests = true`
2. فتح صفحة الطلبات
3. رفع طلب إجازة
4. يرى طلباته فقط (عزل بـ `userId`)

## 🔒 أمان النظام

### مستويات الحماية

1. **Frontend**: إخفاء/إظهار العناصر حسب الصلاحيات
2. **Backend**: التحقق من الصلاحيات في كل API
3. **Database**: Views محسّنة للعزل
4. **Audit**: تسجيل كل العمليات الحساسة

### الحماية من الثغرات

- ✅ عزل كامل للفروع (لا يمكن تجاوزه)
- ✅ تحقق من الصلاحيات في الـ Backend
- ✅ تسجيل جميع العمليات
- ✅ Session management آمن
- ✅ منع SQL Injection (prepared statements)

## 📁 الملفات المنشأة

### Database
- `migrations/002_create_branches_and_roles.sql`

### Libraries
- `src/lib/permissions.ts` (500+ أسطر)
- `src/lib/email-error-handler.ts` (700+ أسطر)

### APIs
- `src/pages/api/branches/list.ts`
- `src/pages/api/branches/create.ts`
- `src/pages/api/branches/update.ts`
- `src/pages/api/branches/stats.ts`
- `src/pages/api/users/list.ts`
- `src/pages/api/users/create.ts`
- `src/pages/api/users/update.ts`
- `src/pages/api/roles/list.ts`
- `src/pages/api/email/health.ts`

## ✅ الخلاصة

تم إنشاء نظام شامل للصلاحيات مع:
- ✅ 4 أدوار مختلفة
- ✅ عزل كامل للبيانات حسب الفروع
- ✅ 16 صلاحية قابلة للتكوين
- ✅ معالجة شاملة لأخطاء البريد الإلكتروني
- ✅ سجل تدقيق كامل
- ✅ 9 APIs جديدة

**الخطوة التالية:**
1. تطبيق Migrations
2. تحديث APIs الموجودة لاستخدام نظام الصلاحيات الجديد
3. إنشاء واجهات المستخدم (branches.astro, users.astro)
