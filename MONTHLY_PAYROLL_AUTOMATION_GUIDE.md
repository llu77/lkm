# 🤖 دليل أتمتة مسير الرواتب الشهري

## ✅ **ما تم إنجازه:**

تم إضافة نظام أتمتة كامل لمسير الرواتب الشهري يعمل تلقائياً في تاريخ **1 من كل شهر @ 4:00 AM**.

---

## 📋 **الملفات المُضافة:**

### **1. convex/payrollAutomation.ts**
**الوظيفة:** وكيل الأتمتة الشهري  
**الحجم:** 413 سطر

**الوظائف:**
- `generateMonthlyPayrollForAllBranches` - إنشاء مسير رواتب لجميع الفروع
- `sendMonthlyPayrollEmails` - إرسال إيميلات بملفات PDF

---

## 🚀 **كيف يعمل النظام:**

### **يوم 1 من كل شهر @ 4:00 AM:**

```
1. ⏰ Zapier Schedule يُرسل webhook

2. 🤖 generateMonthlyPayrollForAllBranches يبدأ العمل:
   ├─ يجلب جميع الموظفين النشطين
   ├─ يُجمّعهم حسب الفرع
   └─ لكل فرع:
      ├─ يجمع السلف والخصومات للشهر
      ├─ يحسب الصافي لكل موظف
      └─ يُنشئ سجل مسير رواتب

3. ⏱️ بعد دقيقة واحدة:
   └─ sendMonthlyPayrollEmails يبدأ:
      ├─ يُنشئ PDF لكل فرع (Symbol AI)
      ├─ يُرسل بريد احترافي مع PDF
      └─ يُحدّث حالة البريد

4. ⏱️ بعد دقيقتين:
   └─ createManualBackup:
      └─ نسخة احتياطية تلقائية

5. 🔔 إرسال webhook لـ Zapier:
   └─ إشعار بإتمام العملية
```

---

## 🎯 **Setup Instructions:**

### **Step 1: تأكد من إعدادات البريد**

اذهب إلى `/system-support` → تاب "إعدادات":

```
✅ المرسل الافتراضي
✅ المستلمون الافتراضيون
✅ محتوى البريد (optional)
```

---

### **Step 2: Setup Zapier Schedule**

#### **إنشاء Zap جديد:**

```
Trigger: Schedule by Zapier
  - Frequency: Every Month
  - Day: 1
  - Time: 4:00 AM
  - Timezone: Asia/Riyadh

Action: Webhooks by Zapier
  - Method: POST
  - URL: [Your Convex HTTP endpoint]
  - Body Type: JSON
  - Data:
    {
      "action": "generate_monthly_payroll",
      "month": "{{zap_meta_timestamp__month}}",
      "year": "{{zap_meta_timestamp__year}}"
    }

Action 2: Email by Zapier (optional)
  - To: Admin email
  - Subject: "✅ تم إنشاء مسير الرواتب - {{zap_meta_timestamp__month}}/{{zap_meta_timestamp__year}}"
  - Body: "تم إنشاء مسير رواتب الشهر الماضي بنجاح"
```

---

### **Step 3: اختبار يدوي**

يمكنك اختبار النظام يدوياً من Convex Dashboard:

```javascript
// في Convex Dashboard → Functions
// اضغط Run على:
internal.payrollAutomation.generateMonthlyPayrollForAllBranches

// Arguments (optional):
{
  "month": 12,  // ديسمبر (optional، default = last month)
  "year": 2024  // (optional، default = current year)
}
```

---

## 📧 **نموذج البريد المُرسل:**

### **Subject:**
```
مسير رواتب [اسم الفرع] - [الشهر] [السنة]
```

### **Content:**
```html
⚡ Symbol AI
نظام الإدارة المالية
مسير رواتب الموظفين

السلام عليكم ورحمة الله وبركاته،

نحيطكم علماً بأنه تم إنشاء مسير رواتب الموظفين للشهر الماضي.

الفرع: [اسم الفرع]
الشهر: [نوفمبر 2025]
عدد الموظفين: [15 موظف]
إجمالي الرواتب: [75,000 ر.س]

يمكنك تحميل ملف PDF الكامل من الرابط أدناه:
[تحميل مسير الرواتب (PDF)]

تم إنشاء هذا المسير تلقائياً بواسطة Symbol AI في [التاريخ].
```

---

## 📊 **الحساب التلقائي:**

لكل موظف:

```typescript
الصافي = الراتب الأساسي 
         + بدل الإشراف 
         + الحوافز
         - السلف (للشهر المحدد)
         - الخصومات (للشهر المحدد)
```

**مثال:**
```
موظف: عبدالحي جلال (فرع لبن، مشرف)

الراتب الأساسي:   2,000 ر.س
بدل الإشراف:       400 ر.س
الحوافز:             0 ر.س
السلف:            -300 ر.س (سلفة نوفمبر)
الخصومات:           -0 ر.س
─────────────────────────
الصافي:          2,100 ر.س
```

---

## 🎯 **الميزات:**

### **✅ 1. أتمتة كاملة**
- لا يحتاج تدخل يدوي
- يعمل تلقائياً كل شهر
- يُنشئ مسير رواتب لجميع الفروع

### **✅ 2. PDF احترافي**
- تصميم احترافي مع Symbol AI logo
- جدول كامل بجميع الموظفين
- RTL support كامل
- Cairo font

### **✅ 3. بريد إلكتروني احترافي**
- تصميم responsive
- رابط تحميل مباشر للPDF
- معلومات شاملة

### **✅ 4. نسخ احتياطية تلقائية**
- بعد كل مسير رواتب
- حفظ 90 يوم

### **✅ 5. Zapier webhook**
- إشعار تلقائي
- يمكن ربطه بـ:
  - Google Drive
  - Slack
  - Email
  - أي خدمة أخرى

---

## ⚙️ **الإعدادات المتقدمة:**

### **تخصيص وقت التشغيل:**
```
في Zapier Schedule:
- يمكنك تغيير اليوم (1-28)
- يمكنك تغيير الوقت (4:00 AM → أي وقت)
- يمكنك تغيير timezone
```

### **تخصيص المستلمين:**
```
في /system-support → إعدادات:
- إضافة/حذف مستلمين
- يمكن إضافة متعددين
```

### **تخصيص محتوى البريد:**
```javascript
// في convex/payrollAutomation.ts
// السطر 241-330
// يمكنك تعديل HTML template
```

---

## 📋 **مثال Zapier Webhook Payload:**

عند إتمام العملية، يُرسل webhook إلى Zapier:

```json
{
  "eventType": "monthly_payroll_generated",
  "payload": {
    "month": 11,
    "year": 2024,
    "monthName": "نوفمبر",
    "totalPayrolls": 3,
    "successCount": 3,
    "failCount": 0,
    "timestamp": "2024-12-01T04:05:30.123Z"
  }
}
```

---

## 🧪 **Testing:**

### **Test 1: يدوي من Dashboard**
```
1. Convex Dashboard
2. Functions → internal.payrollAutomation.generateMonthlyPayrollForAllBranches
3. Run
4. تحقق من النتائج
```

### **Test 2: من Zapier**
```
1. Zapier Dashboard
2. اضغط "Test Trigger"
3. تحقق من Logs
```

### **Test 3: انتظار تاريخ 1**
```
1. انتظر حتى 1 @ 4:00 AM
2. تحقق من Email
3. تحقق من /payroll
```

---

## ❗ **ملاحظات مهمة:**

### **1. الموظفون النشطون فقط**
- فقط الموظفون `isActive: true`
- الموظفون المحذوفون لا يُدرجون

### **2. السلف والخصومات**
- يتم جمع السلف **للشهر المحدد فقط**
- يتم جمع الخصومات **للشهر المحدد فقط**
- مثال: مسير نوفمبر يشمل فقط سلف نوفمبر

### **3. إعادة التشغيل**
- إذا فشل البريد، لن يُعاد إرساله تلقائياً
- يمكنك إعادة التشغيل يدوياً

### **4. الفروع الفارغة**
- الفروع بدون موظفين نشطين **تُتجاهل**

---

## 🎉 **الخلاصة:**

```
✅ نظام أتمتة كامل
✅ يعمل تلقائياً كل شهر
✅ PDF احترافي مع Symbol AI
✅ بريد إلكتروني احترافي
✅ نسخ احتياطية تلقائية
✅ Zapier webhooks
✅ جاهز للإنتاج 100%
```

---

## 📞 **الدعم:**

إذا واجهت أي مشاكل:
1. تحقق من Convex logs
2. تحقق من Zapier task history
3. تحقق من /backups لآخر نسخة احتياطية

---

**🎊 النظام الآن مكتمل ويعمل بشكل تلقائي!** 🚀
