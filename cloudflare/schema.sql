-- LKM Database Schema for Cloudflare D1
-- تحويل من Convex Schema إلى SQL
-- تاريخ: 2025-10-27

-- ===========================================
-- جدول المستخدمين
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  token_identifier TEXT,
  name TEXT,
  email TEXT,
  username TEXT,
  bio TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'employee', -- 'admin', 'employee', 'manager'
  is_anonymous BOOLEAN DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_users_token ON users(token_identifier);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ===========================================
-- جدول الفروع
-- ===========================================
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  branch_id TEXT NOT NULL UNIQUE, -- "1010" للبن، "2020" لطويق
  branch_name TEXT NOT NULL,      -- "لبن"، "طويق"
  supervisor_email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_branches_branch_id ON branches(branch_id);
CREATE INDEX IF NOT EXISTS idx_branches_active ON branches(is_active);

-- ===========================================
-- جدول الموظفين
-- ===========================================
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  branch_id TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  national_id TEXT,
  id_expiry_date INTEGER,
  base_salary REAL NOT NULL DEFAULT 0,
  supervisor_allowance REAL NOT NULL DEFAULT 0,
  incentives REAL NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_employees_branch ON employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(employee_name);
CREATE INDEX IF NOT EXISTS idx_employees_branch_active ON employees(branch_id, is_active);

-- ===========================================
-- جدول الإيرادات
-- ===========================================
CREATE TABLE IF NOT EXISTS revenues (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  date INTEGER NOT NULL,
  cash REAL DEFAULT 0,
  network REAL DEFAULT 0,
  budget REAL DEFAULT 0,
  total REAL DEFAULT 0,           -- كاش + شبكة فقط
  calculated_total REAL DEFAULT 0, -- المجموع المحسوب
  is_matched BOOLEAN DEFAULT 0,
  mismatch_reason TEXT,
  user_id TEXT NOT NULL,
  branch_id TEXT,
  branch_name TEXT,
  employees TEXT, -- JSON array: [{"name": "...", "revenue": 100}]
  is_approved_for_bonus BOOLEAN DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_revenues_date ON revenues(date);
CREATE INDEX IF NOT EXISTS idx_revenues_branch ON revenues(branch_id);
CREATE INDEX IF NOT EXISTS idx_revenues_user ON revenues(user_id);

-- ===========================================
-- جدول المصروفات
-- ===========================================
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  branch_id TEXT,
  branch_name TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_branch ON expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);

-- ===========================================
-- جدول السلف
-- ===========================================
CREATE TABLE IF NOT EXISTS advances (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  branch_id TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  amount REAL NOT NULL,
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,
  description TEXT,
  recorded_by TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_advances_employee ON advances(employee_id);
CREATE INDEX IF NOT EXISTS idx_advances_month_year ON advances(year, month);
CREATE INDEX IF NOT EXISTS idx_advances_employee_month ON advances(employee_id, year, month);

-- ===========================================
-- جدول الخصومات
-- ===========================================
CREATE TABLE IF NOT EXISTS deductions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  branch_id TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  amount REAL NOT NULL,
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  recorded_by TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_deductions_employee ON deductions(employee_id);
CREATE INDEX IF NOT EXISTS idx_deductions_month_year ON deductions(year, month);
CREATE INDEX IF NOT EXISTS idx_deductions_employee_month ON deductions(employee_id, year, month);

-- ===========================================
-- جدول طلبات الموظفين
-- ===========================================
CREATE TABLE IF NOT EXISTS employee_requests (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  branch_id TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  request_type TEXT NOT NULL, -- "سلفة", "إجازة", "صرف متأخرات", "استئذان", "اعتراض على مخالفة", "استقالة"
  status TEXT NOT NULL DEFAULT 'تحت الإجراء', -- "تحت الإجراء", "مقبول", "مرفوض"
  request_date INTEGER NOT NULL,

  -- تفاصيل حسب نوع الطلب
  advance_amount REAL,
  vacation_date INTEGER,
  dues_amount REAL,
  permission_date INTEGER,
  permission_start_time TEXT,
  permission_end_time TEXT,
  permission_hours REAL,
  violation_date INTEGER,
  objection_reason TEXT,
  objection_details TEXT,
  national_id TEXT,
  resignation_text TEXT,

  -- رد الإدارة
  admin_response TEXT,
  response_date INTEGER,

  user_id TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_employee_requests_branch ON employee_requests(branch_id);
CREATE INDEX IF NOT EXISTS idx_employee_requests_status ON employee_requests(status);
CREATE INDEX IF NOT EXISTS idx_employee_requests_employee ON employee_requests(employee_name);
CREATE INDEX IF NOT EXISTS idx_employee_requests_user ON employee_requests(user_id);

-- ===========================================
-- جدول طلبات المنتجات
-- ===========================================
CREATE TABLE IF NOT EXISTS product_orders (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  order_name TEXT,
  products TEXT NOT NULL, -- JSON array: [{"productName": "...", "quantity": 1, "price": 100, "total": 100}]
  grand_total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- "draft", "pending", "approved", "rejected", "completed"
  is_draft BOOLEAN DEFAULT 0,
  requested_by TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  notes TEXT,
  branch_id TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (requested_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_product_orders_status ON product_orders(status);
CREATE INDEX IF NOT EXISTS idx_product_orders_branch ON product_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_product_orders_draft ON product_orders(is_draft);
CREATE INDEX IF NOT EXISTS idx_product_orders_employee ON product_orders(employee_name);

-- ===========================================
-- جدول سجلات البونص
-- ===========================================
CREATE TABLE IF NOT EXISTS bonus_records (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  branch_id TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  week_number INTEGER NOT NULL, -- 1-5
  week_label TEXT NOT NULL,
  start_date INTEGER NOT NULL,
  end_date INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  employee_bonuses TEXT NOT NULL, -- JSON array: [{"employeeName": "...", "totalRevenue": 1000, "bonusAmount": 100, "isEligible": true}]
  total_bonus_paid REAL NOT NULL,
  approved_by TEXT NOT NULL,
  approved_at INTEGER NOT NULL,
  revenue_snapshot TEXT NOT NULL, -- JSON array: [{"date": 123, "employeeName": "...", "revenue": 100}]
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_bonus_branch_date ON bonus_records(branch_id, year, month, week_number);
CREATE INDEX IF NOT EXISTS idx_bonus_branch ON bonus_records(branch_id);

-- ===========================================
-- جدول كشف الرواتب
-- ===========================================
CREATE TABLE IF NOT EXISTS payroll_records (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  branch_id TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  supervisor_name TEXT,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  employees TEXT NOT NULL, -- JSON array
  total_net_salary REAL NOT NULL,
  generated_at INTEGER NOT NULL,
  generated_by TEXT NOT NULL,
  pdf_url TEXT,
  email_sent BOOLEAN DEFAULT 0,
  email_sent_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (generated_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_branch_month ON payroll_records(branch_id, year, month);
CREATE INDEX IF NOT EXISTS idx_payroll_month_year ON payroll_records(year, month);

-- ===========================================
-- جدول الإشعارات
-- ===========================================
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  branch_id TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  type TEXT NOT NULL, -- "warning", "info", "success", "error", "critical"
  severity TEXT NOT NULL, -- "low", "medium", "high", "critical"
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reasoning TEXT,
  ai_generated BOOLEAN DEFAULT 0,
  action_required BOOLEAN DEFAULT 0,
  related_entity_type TEXT,
  related_entity_id TEXT,
  is_read BOOLEAN DEFAULT 0,
  is_dismissed BOOLEAN DEFAULT 0,
  expires_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_notifications_branch ON notifications(branch_id);
CREATE INDEX IF NOT EXISTS idx_notifications_branch_read ON notifications(branch_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_severity ON notifications(severity);

-- ===========================================
-- جدول سجلات البريد
-- ===========================================
CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  to_addresses TEXT NOT NULL, -- JSON array
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- "sent", "failed", "pending"
  email_id TEXT,
  error TEXT,
  sent_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

-- ===========================================
-- جدول إعدادات البريد
-- ===========================================
CREATE TABLE IF NOT EXISTS email_settings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL, -- JSON
  updated_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_email_settings_key ON email_settings(setting_key);

-- ===========================================
-- جدول النسخ الاحتياطية
-- ===========================================
CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  date INTEGER NOT NULL,
  backup_date TEXT NOT NULL,
  type TEXT NOT NULL, -- "daily-automatic", "manual"
  reason TEXT,
  data_snapshot TEXT NOT NULL, -- JSON
  revenues_data TEXT NOT NULL, -- JSON array
  expenses_data TEXT NOT NULL, -- JSON array
  product_orders_data TEXT NOT NULL, -- JSON array
  employee_requests_data TEXT NOT NULL, -- JSON array
  bonus_records_data TEXT NOT NULL, -- JSON array
  status TEXT NOT NULL DEFAULT 'completed', -- "completed", "failed"
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_backups_date ON backups(date);
CREATE INDEX IF NOT EXISTS idx_backups_type ON backups(type);

-- ===========================================
-- جدول Zapier Webhooks
-- ===========================================
CREATE TABLE IF NOT EXISTS zapier_webhooks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  event_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  description TEXT,
  last_triggered INTEGER,
  trigger_count INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_zapier_event ON zapier_webhooks(event_type, is_active);

-- ===========================================
-- جدول Zapier Logs
-- ===========================================
CREATE TABLE IF NOT EXISTS zapier_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  webhook_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL, -- JSON
  status TEXT NOT NULL, -- "sent", "failed"
  response_code INTEGER,
  error TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (webhook_id) REFERENCES zapier_webhooks(id)
);

CREATE INDEX IF NOT EXISTS idx_zapier_logs_webhook ON zapier_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_zapier_logs_status ON zapier_logs(status);
