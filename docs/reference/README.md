# Reference Code Library

مكتبة مرجعية للأكواد والأمثلة المحفوظة للاستفادة اللاحقة.

## 📁 الهيكل

```
docs/reference/
├── zcf-agents/           # ZCF Agent Prompts
│   ├── config-architect.md
│   ├── template-engine.md
│   └── devops-engineer.md
│
├── typescript/           # TypeScript Utilities
│   ├── claude-code-config-manager.ts
│   └── error-handlers.ts
│
├── go/                   # Go Code Samples
│   ├── file-history-service.go
│   ├── agent-tool.go
│   └── agent-service.go
│
├── workflows/            # GitHub Actions
│   └── build.yml
│
└── README.md            # This file
```

---

## 🤖 **ZCF Agents**

### 1. Config Architect (Opus)
**الوظيفة:** إدارة التكوينات المتقدمة، نسخ احتياطية، TOML/JSON validation
**التقنيات:** smol-toml, fs-extra, JSON schemas
**الملف:** `zcf-agents/config-architect.md`

### 2. Template Engine (Haiku)
**الوظيفة:** نظام القوالب، workflow templates، AI personality styles
**التقنيات:** Template systems, fs-extra, pathe
**الملف:** `zcf-agents/template-engine.md`

### 3. DevOps Engineer (Inherit)
**الوظيفة:** Build systems، Release management، CI/CD pipelines
**التقنيات:** unbuild, changesets, GitHub Actions
**الملف:** `zcf-agents/devops-engineer.md`

---

## 💻 **TypeScript Utilities**

### ClaudeCodeConfigManager
**الوصف:** مدير تكوينات متقدم لـ Claude Code مع دعم TOML
**الميزات:**
- إدارة profiles متعددة
- TOML storage مع ترحيل تلقائي من JSON
- CCR Proxy support
- Backup & restore
- Validation & sanitization

**الملف:** `typescript/claude-code-config-manager.ts`

### Error Handlers
**الوصف:** معالجات أخطاء مع دعم i18n وتنسيق ملون
**الميزات:**
- ExitPromptError handling
- General error formatting
- Stack trace logging
- i18n support

**الملف:** `typescript/error-handlers.ts`

---

## 🔧 **Go Code Samples**

### File History Service
**الوصف:** خدمة إدارة إصدارات الملفات مع Pub/Sub
**الميزات:**
- Version management (initial → v1 → v2 → ...)
- Transaction safety مع retry logic
- Pub/Sub events (Created/Updated/Deleted)
- Session management

**المشروع الأصلي:** OpenCode AI
**الملف:** `go/file-history-service.go`

### Agent Tool
**الوصف:** نظام Agent متداخل مع دعم LSP وإدارة الجلسات
**الميزات:**
- Launch nested agents for complex tasks
- Session management with cost tracking
- LSP client integration (Glob, Grep, LS, View)
- Stateless agent invocations
- Concurrent agent execution support
- Parent-child session cost aggregation

**المشروع الأصلي:** OpenCode AI
**الملف:** `go/agent-tool.go`

**وصف الأداة:**
```
الأداة تسمح بإطلاق وكلاء فرعيين (sub-agents) لديهم صلاحية استخدام:
- GlobTool: البحث عن الملفات بنمط معين
- GrepTool: البحث عن نص داخل الملفات
- LS: سرد محتويات المجلد
- View: عرض محتوى ملف

الاستخدامات المثالية:
✅ البحث عن keyword غير محدد (مثل "config" أو "logger")
✅ أسئلة مثل "which file does X?"
✅ تشغيل عدة agents بشكل متوازي للأداء الأفضل

القيود:
❌ لا يمكن للـ agent استخدام Bash, Replace, Edit
❌ لا يمكن تعديل الملفات (read-only)
```

### Agent Service
**الوصف:** خدمة Agent كاملة مع streaming ومعالجة tools وتلخيص محادثات
**الميزات:**
- Event-driven streaming architecture
- Multi-provider support (OpenAI, Anthropic, Local)
- Session management with cost tracking
- Tool execution with permission handling
- Conversation summarization
- Title generation
- Cancellation support
- Token usage tracking and cost calculation

**المشروع الأصلي:** OpenCode AI
**الملف:** `go/agent-service.go`

**Key Interface:**
```go
type Service interface {
    pubsub.Suscriber[AgentEvent]
    Model() models.Model
    Run(ctx context.Context, sessionID string, content string,
        attachments ...message.Attachment) (<-chan AgentEvent, error)
    Cancel(sessionID string)
    IsSessionBusy(sessionID string) bool
    IsBusy() bool
    Update(agentName config.AgentName, modelID models.ModelID) (models.Model, error)
    Summarize(ctx context.Context, sessionID string) error
}

type AgentEvent struct {
    Type    AgentEventType
    Message message.Message
    Error   error
}
```

**Event Types:**
- `AgentEventTypeError`: خطأ أثناء المعالجة
- `AgentEventTypeResponse`: رد من الـ LLM
- `AgentEventTypeSummarize`: تلخيص المحادثة

**حساب التكلفة:**
```go
cost := model.CostPer1MInCached/1e6*float64(usage.CacheCreationTokens) +
    model.CostPer1MOutCached/1e6*float64(usage.CacheReadTokens) +
    model.CostPer1MIn/1e6*float64(usage.InputTokens) +
    model.CostPer1MOut/1e6*float64(usage.OutputTokens)
```

**الاستخدامات المثالية:**
✅ إنشاء agent services مع دعم streaming
✅ إدارة جلسات متعددة مع تتبع التكلفة
✅ تكامل مع providers مختلفة (OpenAI/Anthropic)
✅ معالجة tools بشكل ديناميكي
✅ تلخيص محادثات طويلة تلقائياً

---

## ⚙️ **GitHub Actions Workflows**

### Build Workflow (Go)
**الوصف:** Build workflow لمشروع Go باستخدام GoReleaser
**الميزات:**
- Auto-trigger على push to main
- Go 1.23.2+ setup
- GoReleaser snapshot builds
- Tag management

**الملف:** `workflows/build.yml`

---

## 📝 **ملاحظات الاستخدام**

### للاستخدام اللاحق:
1. **ZCF Agents**: يمكن استخدامها كـ system prompts في Claude
2. **TypeScript Code**: يمكن دمجها في المشروع أو استخدامها كمرجع
3. **Go Code**: أمثلة reference لـ versioning system و agent architecture
4. **Workflows**: يمكن تعديلها لتناسب المشاريع المختلفة

### الأكواد المرجعية:
- جميع الأكواد محفوظة كما هي (verbatim)
- قد تحتاج تعديلات للتكامل مع المشاريع الحالية
- التبعيات (dependencies) غير مضمنة

---

## 🔗 **الروابط ذات الصلة**

- **خطة TDD**: `../planning/claude-code-multi-config-tdd-plan.md`
- **النظام العصبي**: `../../src/neural/`
- **المشروع الأساسي**: `/home/user/lkm/`

---

**آخر تحديث:** 2025-01-27
**الحالة:** مكتبة مرجعية - جاهزة للاستخدام
