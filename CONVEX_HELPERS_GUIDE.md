# 🛠️ دليل استخدام convex-helpers في المشروع

## 📦 ما هو convex-helpers?

`convex-helpers` هي مكتبة رسمية توفر utilities مفيدة لتكملة `convex` package.

المرجع: [GitHub](https://github.com/get-convex/convex-helpers)

---

## ✅ المثبت حالياً في المشروع

```json
"convex-helpers": "^0.1.104"
```

---

## 🎯 الأدوات المفيدة لمشروعنا

### 1. Custom Functions (Authentication)

**الفائدة**: تطبيق authentication تلقائياً في كل function

**الملف المُنشأ**: `convex/customFunctions.ts`

**الاستخدام**:
```typescript
import { authenticatedQuery } from "./customFunctions";

export const getMyData = authenticatedQuery({
  args: {},
  handler: async (ctx, args) => {
    // ctx.user متوفر تلقائياً!
    return { userId: ctx.user._id };
  },
});
```

**المزايا**:
- ✅ لا حاجة لكتابة `ctx.auth.getUserIdentity()` في كل مرة
- ✅ `ctx.user` متوفر تلقائياً
- ✅ Errors موحّدة
- ✅ Type safety كاملة

---

### 2. useQueryWithStatus (Better UX)

**الفائدة**: معلومات أفضل عن حالة القري

**الملف المُنشأ**: `src/hooks/use-query-with-status.ts`

**الاستخدام**:
```typescript
import { useQuery } from "@/hooks/use-query-with-status";

function MyComponent() {
  const { data, isSuccess, isPending, error } = useQuery(
    api.users.list, 
    {}
  );
  
  if (isPending) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (isSuccess) return <UserList users={data} />;
}
```

**بدلاً من**:
```typescript
const data = useQuery(api.users.list, {});
if (data === undefined) return <Spinner />; // Could be error!
return <UserList users={data} />;
```

---

### 3. Triggers (Data Consistency)

**الفائدة**: تحديث البيانات المرتبطة تلقائياً

**مثال**: عند إضافة revenue، تحديث aggregate/leaderboard

```typescript
import { Triggers } from "convex-helpers/server/triggers";
import { DataModel } from "./_generated/dataModel";

const triggers = new Triggers<DataModel>();

// تسجيل trigger لجدول revenues
triggers.register("revenues", {
  onCreate: async (ctx, revenue) => {
    // تحديث إحصائيات الفرع
    await ctx.db.patch(revenue.branchId, {
      totalRevenue: /* حساب جديد */
    });
  },
  onUpdate: async (ctx, oldRevenue, newRevenue) => {
    // تحديث عند تعديل revenue
  },
  onDelete: async (ctx, revenue) => {
    // تنظيف عند حذف revenue
  },
});

// استخدام في mutations
export const mutation = customMutation(
  mutationRaw,
  customCtx(triggers.wrapDB)
);
```

---

### 4. Rate Limiting

**الفائدة**: منع abuse و spam

**مثال**:
```typescript
import { RateLimiter } from "convex-helpers/server/rateLimit";

const rateLimit = new RateLimiter({
  createEmployee: { kind: "token bucket", rate: 10, period: MINUTE },
  sendEmail: { kind: "fixed window", rate: 100, period: HOUR },
});

export const createEmployee = mutation({
  handler: async (ctx, args) => {
    // Check rate limit first
    await rateLimit.limit(ctx, "createEmployee", { 
      key: ctx.user._id, 
      throws: true 
    });
    
    // Proceed with creation
    return await ctx.db.insert("employees", args);
  },
});
```

---

### 5. Migrations

**الفائدة**: تعديل البيانات بأمان

**مثال**:
```typescript
import { Migrations } from "convex-helpers/server/migrations";

const migrations = new Migrations(internalMutation);

export const updateOldRecords = migrations.define({
  table: "revenues",
  migrateOne: async (ctx, revenue) => {
    // تحديث كل revenue قديم
    if (!revenue.isMatched) {
      await ctx.db.patch(revenue._id, {
        isMatched: true,
        calculatedTotal: revenue.cash + revenue.network,
      });
    }
  },
});
```

---

### 6. Pagination

**الفائدة**: pagination آمن ومُحسّن

**من المصادر**:
```typescript
import { usePaginatedQuery } from "convex-helpers/react";

function MyComponent() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.items.list,
    {},
    { initialNumItems: 20 }
  );
  
  if (status === "LoadingFirstPage") return <Spinner />;
  
  return (
    <>
      {results.map(item => <Item key={item._id} {...item} />)}
      {status === "CanLoadMore" && (
        <button onClick={() => loadMore(20)}>Load More</button>
      )}
    </>
  );
}
```

---

## 🎯 التطبيق في مشروعك

### ما تم بالفعل:
- ✅ `convex-helpers` مثبّت (v0.1.104)
- ✅ `customFunctions.ts` مُنشأ
- ✅ `use-query-with-status.ts` مُنشأ

### ما يمكن تطبيقه لاحقاً:
- ⏳ Triggers لـ revenue/expense updates
- ⏳ Rate limiting لـ mutations
- ⏳ Migrations للـ data updates
- ⏳ Better pagination في lists

---

## 📚 الموارد الإضافية

### من convex-helpers:
- `server/customFunctions` - Custom auth wrappers ✅
- `server/triggers` - Data consistency
- `server/rateLimit` - Abuse prevention
- `server/migrations` - Safe data updates
- `react/cache` - Query caching
- `react/sessions` - Session management

### المراجع:
- [convex-helpers GitHub](https://github.com/get-convex/convex-helpers)
- [Convex Components](https://www.convex.dev/components)
- [Type Safety Guide](https://stack.convex.dev/fully-typed-full-stack-convex-and-next-js)

---

## 🎓 الدروس المستفادة

### من المصادر:
1. **Authentication في 3 layers** (client, backend, database)
2. **Race conditions** خطر حقيقي - استخدم `"skip"`
3. **Custom functions** توفر boilerplate
4. **Type safety** من schema → validators → types
5. **convex-helpers** توفر utilities جاهزة

### تطبيق في مشروعك:
- ✅ استخدمنا Anonymous Auth
- ✅ حمينا من race conditions في `useAuth`
- ✅ أضفنا `authHelpers.ts`
- ⏳ يمكن استخدام `customFunctions` للتحسين

---

**هل تريد تطبيق Triggers أو Rate Limiting في المشروع؟** 🤔
