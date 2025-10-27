# دليل إعداد Supabase 🚀

تم استبدال Convex بـ Supabase لتبسيط النشر على Cloudflare Pages وتسهيل المصادقة.

## الخطوات السريعة:

### 1️⃣ إنشاء مشروع Supabase

1. اذهب إلى https://supabase.com/
2. سجل حساب جديد (مجاني)
3. اضغط "New Project"
4. اختر اسم المشروع وكلمة سر قاعدة البيانات

### 2️⃣ الحصول على المفاتيح

من لوحة التحكم:
- اذهب إلى **Settings** > **API**
- انسخ:
  - `Project URL` → `VITE_SUPABASE_URL`
  - `anon public` key → `VITE_SUPABASE_ANON_KEY`

### 3️⃣ إعداد ملف .env

أنشئ ملف `.env` في جذر المشروع:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_URL=https://your-app.pages.dev
```

### 4️⃣ إنشاء الجداول

في Supabase Dashboard → **SQL Editor**، نفذ:

```sql
-- جدول المستخدمين
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  name TEXT,
  role TEXT DEFAULT 'employee',
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول الإيرادات
CREATE TABLE revenues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date BIGINT NOT NULL,
  cash NUMERIC,
  network NUMERIC,
  total NUMERIC,
  branch_id TEXT,
  branch_name TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول المصروفات
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  date BIGINT NOT NULL,
  branch_id TEXT,
  branch_name TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- جدول الموظفين
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  national_id TEXT,
  base_salary NUMERIC NOT NULL,
  supervisor_allowance NUMERIC DEFAULT 0,
  incentives NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5️⃣ استخدام Supabase في الكود

```typescript
import { supabase } from '@/lib/supabase';

// قراءة البيانات
const { data, error } = await supabase
  .from('revenues')
  .select('*')
  .order('date', { ascending: false });

// إضافة بيانات
const { data, error } = await supabase
  .from('revenues')
  .insert({
    date: Date.now(),
    cash: 1000,
    network: 500,
    total: 1500
  });

// تحديث بيانات
const { data, error } = await supabase
  .from('revenues')
  .update({ cash: 2000 })
  .eq('id', 'revenue-id');

// حذف بيانات
const { data, error } = await supabase
  .from('revenues')
  .delete()
  .eq('id', 'revenue-id');
```

### 6️⃣ النشر على Cloudflare Pages

1. اذهب إلى Cloudflare Dashboard
2. Pages → اختر مشروعك
3. Settings → Environment Variables
4. أضف:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## المزايا:

✅ مجاني حتى 500MB تخزين
✅ مصادقة جاهزة (Email, Google, GitHub...)
✅ Real-time subscriptions
✅ PostgreSQL قوي
✅ سهل النشر على Cloudflare
✅ لا تعقيدات في الكود

## روابط مفيدة:

- [توثيق Supabase](https://supabase.com/docs)
- [أمثلة React](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)
- [Authentication](https://supabase.com/docs/guides/auth)
