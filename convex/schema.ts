import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  notifications: defineTable({
    branchId: v.string(),
    branchName: v.string(),
    type: v.string(), // "warning", "info", "success", "error", "critical"
    severity: v.string(), // "low", "medium", "high", "critical"
    title: v.string(),
    message: v.string(),
    reasoning: v.optional(v.string()), // Claude's reasoning chain
    aiGenerated: v.boolean(),
    actionRequired: v.optional(v.boolean()),
    relatedEntity: v.optional(v.object({
      type: v.string(), // "revenue", "expense", "order", "request"
      id: v.string(),
    })),
    isRead: v.boolean(),
    isDismissed: v.boolean(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_branch", ["branchId"])
    .index("by_branch_and_read", ["branchId", "isRead"])
    .index("by_severity", ["severity"]),

  backups: defineTable({
    date: v.number(),
    backupDate: v.string(),
    type: v.string(), // "daily-automatic", "manual"
    reason: v.optional(v.string()),
    dataSnapshot: v.object({
      revenues: v.number(),
      expenses: v.number(),
      productOrders: v.number(),
      employeeRequests: v.number(),
      bonusRecords: v.number(),
    }),
    revenuesData: v.array(v.object({
      _id: v.string(),
      _creationTime: v.number(),
      date: v.number(),
      cash: v.optional(v.number()),
      network: v.optional(v.number()),
      budget: v.optional(v.number()),
      total: v.optional(v.number()),
      calculatedTotal: v.optional(v.number()),
      isMatched: v.optional(v.boolean()),
      branchId: v.optional(v.string()),
      branchName: v.optional(v.string()),
      userId: v.string(),
    })),
    expensesData: v.array(v.object({
      _id: v.string(),
      _creationTime: v.number(),
      title: v.string(),
      amount: v.number(),
      category: v.string(),
      date: v.number(),
      branchId: v.optional(v.string()),
      branchName: v.optional(v.string()),
      userId: v.string(),
    })),
    productOrdersData: v.array(v.object({
      _id: v.string(),
      _creationTime: v.number(),
      branchId: v.string(),
      branchName: v.string(),
      employeeName: v.string(),
      grandTotal: v.number(),
      isDraft: v.boolean(),
      status: v.string(),
      requestedBy: v.string(),
    })),
    employeeRequestsData: v.array(v.object({
      _id: v.string(),
      _creationTime: v.number(),
      branchId: v.string(),
      branchName: v.string(),
      employeeName: v.string(),
      requestType: v.string(),
      status: v.string(),
      userId: v.string(),
    })),
    bonusRecordsData: v.array(v.object({
      _id: v.string(),
      _creationTime: v.number(),
      branchId: v.string(),
      branchName: v.string(),
      month: v.number(),
      year: v.number(),
      totalBonusPaid: v.number(),
      approvedBy: v.string(),
    })),
    status: v.string(), // "completed", "failed"
  }).index("by_date", ["date"])
    .index("by_type", ["type"]),

  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    username: v.string(),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
    role: v.optional(v.string()), // "admin", "employee", "manager"
    // Temporary fields for migration
    followerCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_username", ["username"]),

  revenues: defineTable({
    date: v.number(),
    cash: v.optional(v.number()),
    network: v.optional(v.number()),
    budget: v.optional(v.number()),
    total: v.optional(v.number()), // كاش + شبكة فقط
    calculatedTotal: v.optional(v.number()), // المجموع المحسوب
    isMatched: v.optional(v.boolean()), // حالة المطابقة
    mismatchReason: v.optional(v.string()), // سبب عدم المطابقة
    userId: v.id("users"),
    branchId: v.optional(v.string()), // معرف الفرع
    branchName: v.optional(v.string()), // اسم الفرع
    employees: v.optional(v.array(v.object({
      name: v.string(),
      revenue: v.number(),
    }))), // موظفي الإيراد
    isApprovedForBonus: v.optional(v.boolean()), // معتمد في البونص
    // Old fields for migration
    title: v.optional(v.string()),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
  })
    .index("by_date", ["date"])
    .index("by_branch", ["branchId"]),

  expenses: defineTable({
    title: v.string(),
    amount: v.number(),
    category: v.string(),
    description: v.optional(v.string()),
    date: v.number(),
    userId: v.id("users"),
    branchId: v.optional(v.string()), // معرف الفرع
    branchName: v.optional(v.string()), // اسم الفرع
  })
    .index("by_date", ["date"])
    .index("by_branch", ["branchId"]),

  productOrders: defineTable({
    orderName: v.optional(v.string()), // اسم الطلب (للمسودات المحفوظة)
    products: v.array(v.object({
      productName: v.string(),
      quantity: v.number(),
      price: v.number(),
      total: v.number(), // الكمية × السعر
    })),
    grandTotal: v.number(), // مجموع كل المنتجات
    status: v.string(), // "draft", "pending", "approved", "rejected", "completed"
    isDraft: v.boolean(), // هل هو مسودة محفوظة؟
    requestedBy: v.id("users"),
    employeeName: v.string(), // اسم الموظف
    notes: v.optional(v.string()),
    branchId: v.string(), // معرف الفرع
    branchName: v.string(), // اسم الفرع
  })
    .index("by_status", ["status"])
    .index("by_branch", ["branchId"])
    .index("by_draft", ["isDraft"])
    .index("by_employee", ["employeeName"]),

  employeeOrders: defineTable({
    requestType: v.string(),
    description: v.string(),
    status: v.string(), // "pending", "approved", "rejected", "completed"
    priority: v.string(), // "low", "medium", "high"
    requestedBy: v.id("users"),
    branchId: v.optional(v.string()), // معرف الفرع
    branchName: v.optional(v.string()), // اسم الفرع
  })
    .index("by_status", ["status"])
    .index("by_branch", ["branchId"]),

  bonusRecords: defineTable({
    branchId: v.string(),
    branchName: v.string(),
    weekNumber: v.number(), // رقم الأسبوع (1-5)
    weekLabel: v.string(), // "الأسبوع الأول" أو "أيام متبقية"
    startDate: v.number(),
    endDate: v.number(),
    month: v.number(),
    year: v.number(),
    employeeBonuses: v.array(v.object({
      employeeName: v.string(),
      totalRevenue: v.number(),
      bonusAmount: v.number(),
      isEligible: v.boolean(),
    })),
    totalBonusPaid: v.number(),
    approvedBy: v.id("users"),
    approvedAt: v.number(),
    revenueSnapshot: v.array(v.object({
      date: v.number(),
      employeeName: v.string(),
      revenue: v.number(),
    })),
  })
    .index("by_branch_and_date", ["branchId", "year", "month", "weekNumber"])
    .index("by_branch", ["branchId"]),

  employeeRequests: defineTable({
    branchId: v.string(),
    branchName: v.string(),
    employeeName: v.string(),
    requestType: v.string(), // "سلفة", "إجازة", "صرف متأخرات", "استئذان", "اعتراض على مخالفة", "استقالة"
    status: v.string(), // "تحت الإجراء", "مقبول", "مرفوض"
    requestDate: v.number(),
    
    // تفاصيل السلفة
    advanceAmount: v.optional(v.number()),
    
    // تفاصيل الإجازة
    vacationDate: v.optional(v.number()),
    
    // تفاصيل صرف المتأخرات
    duesAmount: v.optional(v.number()),
    
    // تفاصيل الاستئذان
    permissionDate: v.optional(v.number()),
    permissionStartTime: v.optional(v.string()),
    permissionEndTime: v.optional(v.string()),
    permissionHours: v.optional(v.number()),
    
    // تفاصيل الاعتراض على المخالفة
    violationDate: v.optional(v.number()),
    objectionReason: v.optional(v.string()),
    objectionDetails: v.optional(v.string()),
    
    // تفاصيل الاستقالة
    nationalId: v.optional(v.string()),
    resignationText: v.optional(v.string()),
    
    // رد الإدارة
    adminResponse: v.optional(v.string()),
    responseDate: v.optional(v.number()),
    
    userId: v.id("users"),
  })
    .index("by_branch", ["branchId"])
    .index("by_status", ["status"])
    .index("by_employee", ["employeeName"])
    .index("by_user", ["userId"]),

  emailLogs: defineTable({
    to: v.array(v.string()),
    subject: v.string(),
    status: v.string(), // "sent", "failed", "pending"
    emailId: v.optional(v.string()), // Resend email ID
    error: v.optional(v.string()),
    sentAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_sent_at", ["sentAt"]),

  zapierWebhooks: defineTable({
    name: v.string(),
    webhookUrl: v.string(),
    eventType: v.string(), // "revenue_created", "expense_created", "order_created", etc.
    isActive: v.boolean(),
    description: v.optional(v.string()),
    lastTriggered: v.optional(v.number()),
    triggerCount: v.number(),
  }).index("by_event", ["eventType", "isActive"]),

  zapierLogs: defineTable({
    webhookId: v.id("zapierWebhooks"),
    eventType: v.string(),
    payload: v.string(), // JSON stringified
    status: v.string(), // "sent", "failed"
    responseCode: v.optional(v.number()),
    error: v.optional(v.string()),
  })
    .index("by_webhook", ["webhookId"])
    .index("by_status", ["status"]),

  emailSettings: defineTable({
    settingKey: v.string(), // "sender_name", "sender_email", "default_recipients", "daily_schedule", "monthly_schedule"
    settingValue: v.union(
      v.string(),
      v.object({
        enabled: v.boolean(),
        time: v.optional(v.string()),
        day: v.optional(v.number()),
        templateId: v.optional(v.string()),
        customContent: v.optional(v.string()),
        recipients: v.optional(v.array(v.string())),
      }),
      v.array(v.string()),
    ),
    updatedAt: v.number(),
  }).index("by_key", ["settingKey"]),

  branches: defineTable({
    branchId: v.string(), // "1010" للبن، "2020" لطويق
    branchName: v.string(), // "لبن"، "طويق"
    supervisorEmail: v.string(), // إيميل المشرف للتقارير اليومية والشهرية
    isActive: v.boolean(), // هل الفرع نشط
    createdAt: v.number(),
  })
    .index("by_branch_id", ["branchId"])
    .index("by_active", ["isActive"]),

  employees: defineTable({
    branchId: v.string(),
    branchName: v.string(),
    employeeName: v.string(),
    nationalId: v.optional(v.string()), // رقم الهوية
    idExpiryDate: v.optional(v.number()), // تاريخ انتهاء الهوية
    baseSalary: v.number(), // الراتب الأساسي
    supervisorAllowance: v.number(), // بدل الإشراف (400 للمشرفين)
    incentives: v.number(), // حوافز أخرى (حسب الأداء)
    isActive: v.boolean(), // هل الموظف نشط
    createdBy: v.id("users"),
  })
    .index("by_branch", ["branchId"])
    .index("by_name", ["employeeName"])
    .index("by_branch_and_active", ["branchId", "isActive"]),

  advances: defineTable({
    branchId: v.string(),
    branchName: v.string(),
    employeeId: v.id("employees"),
    employeeName: v.string(),
    amount: v.number(),
    month: v.number(), // 1-12
    year: v.number(),
    description: v.optional(v.string()),
    recordedBy: v.id("users"),
  })
    .index("by_employee", ["employeeId"])
    .index("by_month_year", ["year", "month"])
    .index("by_employee_month", ["employeeId", "year", "month"]),

  deductions: defineTable({
    branchId: v.string(),
    branchName: v.string(),
    employeeId: v.id("employees"),
    employeeName: v.string(),
    amount: v.number(),
    month: v.number(), // 1-12
    year: v.number(),
    reason: v.string(), // سبب الخصم
    description: v.optional(v.string()),
    recordedBy: v.id("users"),
  })
    .index("by_employee", ["employeeId"])
    .index("by_month_year", ["year", "month"])
    .index("by_employee_month", ["employeeId", "year", "month"]),

  payrollRecords: defineTable({
    branchId: v.string(),
    branchName: v.string(),
    supervisorName: v.optional(v.string()), // اسم المشرف
    month: v.number(),
    year: v.number(),
    employees: v.array(v.object({
      employeeId: v.id("employees"),
      employeeName: v.string(),
      nationalId: v.optional(v.string()),
      baseSalary: v.number(),
      supervisorAllowance: v.number(), // بدل الإشراف
      incentives: v.number(), // حوافز أخرى
      totalAdvances: v.number(),
      totalDeductions: v.number(),
      netSalary: v.number(), // الصافي
    })),
    totalNetSalary: v.number(), // إجمالي الرواتب
    generatedAt: v.number(),
    generatedBy: v.id("users"),
    pdfUrl: v.optional(v.string()), // رابط PDF
    emailSent: v.boolean(), // هل تم إرسال البريد
    emailSentAt: v.optional(v.number()),
  })
    .index("by_branch_month", ["branchId", "year", "month"])
    .index("by_month_year", ["year", "month"]),
});
