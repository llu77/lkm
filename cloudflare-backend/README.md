# LKM Cloudflare Backend 🚀

Backend API مبني على **Cloudflare Workers** + **D1 Database** + **Hono**

## 📦 المكونات

- **Cloudflare Workers**: Serverless functions على Edge
- **D1 Database**: قاعدة بيانات SQLite موزعة
- **Hono**: إطار عمل سريع للـ API

## 🚀 البدء السريع

### 1. التثبيت

```bash
cd cloudflare-backend
npm install
```

### 2. إنشاء D1 Database

```bash
# إنشاء database
npx wrangler d1 create lkm-database

# نسخ database_id من النتيجة وإضافته في wrangler.toml

# تطبيق Schema
npx wrangler d1 execute lkm-database --file=../cloudflare/schema.sql
```

### 3. التطوير محلياً

```bash
npm run dev
```

سيعمل على: `http://localhost:8787`

### 4. النشر على Cloudflare

```bash
npm run deploy
```

## 📡 API Endpoints

### Revenues (الإيرادات)

- `GET /api/revenues/list?branchId=1010&month=10&year=2024`
- `GET /api/revenues/stats?branchId=1010`
- `POST /api/revenues/create`
- `PUT /api/revenues/update/:id`
- `DELETE /api/revenues/delete/:id`

### Expenses (المصروفات)

- `GET /api/expenses/list?branchId=1010&month=10&year=2024`
- `POST /api/expenses/create`
- `PUT /api/expenses/update/:id`
- `DELETE /api/expenses/delete/:id`

### Employees (الموظفين)

- `GET /api/employees/list?branchId=1010`
- `GET /api/employees/active?branchId=1010`
- `GET /api/employees/get/:id`
- `POST /api/employees/add`
- `PUT /api/employees/update/:id`
- `DELETE /api/employees/delete/:id`

### Branches (الفروع)

- `GET /api/branches/list`
- `GET /api/branches/get/:branchId`

### Advances (السلف)

- `GET /api/advances/list?employeeId=xxx&year=2024&month=10`
- `POST /api/advances/create`
- `DELETE /api/advances/delete/:id`

### Deductions (الخصومات)

- `GET /api/deductions/list?employeeId=xxx&year=2024&month=10`
- `POST /api/deductions/create`
- `DELETE /api/deductions/delete/:id`

## 🔧 البنية

```
cloudflare-backend/
├── src/
│   ├── index.ts          # Router رئيسي
│   ├── types.ts          # TypeScript types
│   └── api/              # API endpoints
│       ├── revenues.ts
│       ├── expenses.ts
│       ├── employees.ts
│       ├── branches.ts
│       ├── advances.ts
│       └── deductions.ts
├── wrangler.toml         # إعدادات Cloudflare
├── package.json
└── tsconfig.json
```

## 🌍 Environment Variables

في `wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "production"
ALLOWED_ORIGINS = "http://localhost:5173,https://*.pages.dev"
```

## 🧪 الاختبار

```bash
# Health check
curl http://localhost:8787/health

# قائمة الإيرادات
curl "http://localhost:8787/api/revenues/list?branchId=1010"

# إنشاء موظف جديد
curl -X POST http://localhost:8787/api/employees/add \
  -H "Content-Type: application/json" \
  -d '{"branchId":"1010","branchName":"لبن","employeeName":"محمد","baseSalary":5000}'
```

## 📝 Notes

- **لا مصادقة**: تم إزالة كل المصادقة لتبسيط التطبيق
- **CORS**: مُفعّل لـ localhost و Cloudflare Pages
- **Edge Computing**: يعمل من أقرب data center للمستخدم
