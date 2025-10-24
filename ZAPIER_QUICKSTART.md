# ⚡ Zapier Integration - Quick Start

## 🎯 Your Webhook URL

```
https://hooks.zapier.com/hooks/catch/4045e58858fec2e48109352fcd71ead5/
```

---

## ✅ What's Already Working

The system is **pre-configured** with Zapier integration! It automatically sends webhooks for:

| Event | Trigger | Payload |
|-------|---------|---------|
| 💰 `revenue_created` | New revenue entry | Date, amounts, branch info |
| 💸 `expense_created` | New expense entry | Title, amount, category |
| 📦 `product_order_created` | New product order | Employee, products, total |
| 👤 `employee_request_created` | New employee request | Employee, type, status |
| 📧 `email_request` | Email sent | To, subject, HTML content |
| 📄 `pdf_generated` | PDF export | Report type, data summary |

---

## 🚀 Setup in 3 Steps

### Step 1: Set Convex Environment Variable

**Option A: Via Convex Dashboard (Recommended)**
```
1. Go to: https://dashboard.convex.dev
2. Select your project
3. Settings → Environment Variables
4. Add:
   Name:  ZAPIER_WEBHOOK_URL
   Value: https://hooks.zapier.com/hooks/catch/4045e58858fec2e48109352fcd71ead5/
5. Save
```

**Option B: Via CLI**
```bash
npx convex env set ZAPIER_WEBHOOK_URL "https://hooks.zapier.com/hooks/catch/4045e58858fec2e48109352fcd71ead5/"
```

### Step 2: Create Zap in Zapier

```
1. Go to: https://zapier.com
2. Create New Zap
3. Trigger: "Webhooks by Zapier"
4. Event: "Catch Hook"
5. Paste webhook URL (from above)
6. Test trigger (create a revenue/expense in your app)
7. Configure actions (Gmail, Sheets, Slack, etc.)
8. Turn on Zap!
```

### Step 3: Test Integration

```
1. Open: http://localhost:5173/system-support
2. Navigate to "Zapier" tab
3. View available events
4. Test by creating:
   - New revenue at /revenues
   - New expense at /expenses
   - New product order at /product-orders
```

---

## 📊 View Integration Status

**In Your App:**
```
http://localhost:5173/system-support → Zapier tab
```

**In Zapier:**
```
https://zapier.com/app/zaps → Your Zap → Task History
```

---

## 🎬 Example Use Cases

### 1. Auto-Email Revenue Reports
```
Trigger: revenue_created
Action:  Gmail - Send Email
         To: manager@company.com
         Subject: "New Revenue: {{amount}}"
         Body: Branch {{branch}} added {{total}}
```

### 2. Log to Google Sheets
```
Trigger: expense_created
Action:  Google Sheets - Create Row
         Sheet: "Expenses 2025"
         Data: Date, Category, Amount, Branch
```

### 3. Slack Notifications
```
Trigger: employee_request_created
Action:  Slack - Send Message
         Channel: #hr-requests
         Message: "New request from {{employee}}: {{type}}"
```

### 4. Multi-Step Automation
```
Trigger: product_order_created
Actions:
  1. Send email to purchasing
  2. Add to Google Sheets
  3. Create Trello card
  4. Notify in Slack
```

---

## 🔧 Advanced Configuration

### Multiple Webhooks

You can register multiple webhooks for different purposes:

1. **Via System Support UI:**
   - Go to `/system-support` → Zapier tab
   - (Currently shows static config - can be extended to manage multiple webhooks)

2. **Via Database:**
   - Use `api.zapierQueries.createWebhook` mutation
   - Specify event types and URLs

### Event Filtering

Filter events by event type in Zapier:

```
Zapier Filter:
  - Only continue if: event__type equals "revenue_created"
  - Only continue if: data__branch__name equals "الفرع الرئيسي"
```

---

## 📝 Payload Examples

### Revenue Created
```json
{
  "event": "revenue_created",
  "timestamp": "2025-01-24T18:00:00Z",
  "data": {
    "id": "jx7c9q6k5m2n",
    "date": "2025-01-24",
    "cash": 50000,
    "network": 30000,
    "budget": 20000,
    "total": 100000,
    "branch": {
      "id": "kxn7r8f9d2m5",
      "name": "الفرع الرئيسي"
    }
  }
}
```

### Expense Created
```json
{
  "event": "expense_created",
  "timestamp": "2025-01-24T18:00:00Z",
  "data": {
    "id": "jx7c9q6k5m2n",
    "title": "إيجار الفرع",
    "amount": 15000,
    "category": "المصاريف الثابتة",
    "date": "2025-01-24",
    "branch": {
      "id": "kxn7r8f9d2m5",
      "name": "الفرع الرئيسي"
    }
  }
}
```

### Email Request
```json
{
  "event": "email_request",
  "timestamp": "2025-01-24T18:00:00Z",
  "data": {
    "type": "email_request",
    "to": ["manager@company.com"],
    "subject": "تقرير الإيرادات الشهري",
    "html": "<html>...</html>",
    "from": "Symbol AI <noreply@symbolai.com>",
    "source": "Email System"
  }
}
```

---

## 🐛 Troubleshooting

### Webhooks not sending?

**Check 1: Convex Environment**
```bash
npx convex env get ZAPIER_WEBHOOK_URL
# Should return: https://hooks.zapier.com/hooks/catch/4045e58858fec2e48109352fcd71ead5/
```

**Check 2: Create Test Event**
```
1. Go to /revenues
2. Create new revenue
3. Check Zapier task history
```

**Check 3: Browser Console**
```
F12 → Console → Look for errors
```

### Webhook URL returns 404?

- ✅ Make sure Zap is turned ON in Zapier
- ✅ Verify webhook URL is complete (ends with `/`)
- ✅ Check Zapier status: https://status.zapier.com

### Events not triggering?

**Check the code:**
```typescript
// These functions should be called in mutations:
triggerRevenueCreated()     // In convex/revenues.ts
triggerExpenseCreated()      // In convex/expenses.ts
triggerProductOrderCreated() // In convex/productOrders.ts
```

---

## 📚 Full Documentation

For complete setup guides:
- 📧 Email Integration: `ZAPIER_EMAIL_AGENT_SETUP.md`
- ⏰ Scheduled Jobs: `ZAPIER_SCHEDULER_SETUP.md`
- 🔧 Environment Config: `.env.convex.example`

---

## 🎉 You're All Set!

Your Zapier integration is ready to use. Just set the environment variable in Convex and start automating! 🚀

**Next Steps:**
1. ✅ Set `ZAPIER_WEBHOOK_URL` in Convex Dashboard
2. ✅ Create your first Zap
3. ✅ Test with a revenue/expense
4. ✅ Build amazing automations!

---

**Questions?** Check the full docs or test via `/system-support`
