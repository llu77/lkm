# Reference Code Library

مكتبة مرجعية للأكواد والأمثلة المحفوظة للاستفادة اللاحقة.

## 📁 الهيكل

```
.claude/
└── persona               # OpenCode Coder Prompt

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
│   ├── agent-service.go
│   ├── models.go
│   ├── diagnostics-tool.go
│   └── patch-tool.go
│
├── workflows/            # GitHub Actions
│   └── build.yml
│
└── README.md            # This file
```

---

## 🎯 **OpenCode Coder Prompt**

**الوصف:** System prompt ديناميكي لـ OpenCode CLI يتكيف مع Provider (Anthropic/OpenAI)
**الموقع:** `.claude/persona`
**الميزات:**
- Dual provider support (Anthropic/OpenAI) مع prompts متخصصة لكل منهما
- Environment info injection (working directory, git status, platform, date)
- LSP diagnostics integration
- OpenCode.md memory system للحفاظ على أوامر وتفضيلات المستخدم
- Concise response policy (< 4 lines unless detailed)

**System Prompts:**
- **Anthropic Prompt**: OpenCode CLI helper مع توازن بين الـ proactiveness والـ precision
- **OpenAI Prompt**: Deployed coding agent مع coding guidelines صارمة

**Key Features:**
```go
// يقوم بحقن معلومات البيئة بشكل ديناميكي
func getEnvironmentInfo() string {
    cwd := config.WorkingDirectory()
    isGit := isGitRepo(cwd)
    platform := runtime.GOOS
    date := time.Now().Format("1/2/2006")
    ls := tools.NewLsTool()
    r, _ := ls.Run(context.Background(), tools.ToolCall{
        Input: `{"path":"."}`,
    })
    return fmt.Sprintf(`<env>...</env><project>...</project>`)
}

// يضيف LSP information للـ agents التي تدعمها
func lspInformation() string {
    // Enables file_diagnostics and project_diagnostics
}
```

**استخدامات:**
✅ فهم كيفية بناء system prompts ديناميكية
✅ التعلم من coding guidelines best practices
✅ تطبيق memory system (OpenCode.md pattern)
✅ تكامل LSP diagnostics في tool responses

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

### Models Configuration (Anthropic)
**الوصف:** تكوينات نماذج Claude بجميع إصداراتها مع معلومات التسعير والإمكانيات
**الميزات:**
- تسعير كامل لجميع نماذج Claude (Input/Output/Cached)
- معلومات Context Window وأقصى Tokens
- دعم Attachments و Reasoning capabilities
- تكوينات موحدة لـ 7 نماذج Claude

**المشروع الأصلي:** OpenCode AI
**الملف:** `go/models.go`

**النماذج المدعومة:**
```go
// Claude 3.5 Sonnet (المتوازن - الأكثر استخداماً)
- Input:  $3.00 / 1M tokens
- Output: $15.00 / 1M tokens
- Context: 200K tokens
- Max Output: 5K tokens

// Claude 3 Haiku (الأسرع والأرخص)
- Input:  $0.25 / 1M tokens
- Output: $1.25 / 1M tokens
- Context: 200K tokens

// Claude 3.7 Sonnet (Extended reasoning)
- CanReason: true
- Max Output: 50K tokens

// Claude 3.5 Haiku (متوازن وسريع)
- Input:  $0.80 / 1M tokens
- Output: $4.00 / 1M tokens

// Claude 3 Opus (الأقوى - الأغلى)
- Input:  $15.00 / 1M tokens
- Output: $75.00 / 1M tokens

// Claude 4 Sonnet (Latest with reasoning)
- CanReason: true
- API: "claude-sonnet-4-20250514"

// Claude 4 Opus (Next-gen flagship)
- API: "claude-opus-4-20250514"
```

**ميزات Prompt Caching:**
```go
CostPer1MInCached:   3.75   // تكلفة إنشاء Cache
CostPer1MOutCached:  0.30   // تكلفة قراءة من Cache (خصم 90%)
```

**الاستخدامات المثالية:**
✅ مرجع لتسعير نماذج Claude
✅ حساب تكلفة المشاريع بناءً على استخدام Tokens
✅ اختيار النموذج المناسب حسب الميزانية والمتطلبات
✅ تنفيذ cost tracking في Agent services

### Diagnostics Tool
**الوصف:** أداة للحصول على diagnostics من LSP clients مع دعم file-level و project-level
**الميزات:**
- LSP client integration مع دعم متعدد الـ clients
- Async waiting للـ diagnostics مع timeout (5 seconds)
- Severity-based sorting (Errors أولاً)
- Diagnostic formatting مع location، source، code، tags
- Summary statistics (errors/warnings count)

**المشروع الأصلي:** OpenCode AI
**الملف:** `go/diagnostics-tool.go`

**Key Functions:**
```go
// فتح ملف في LSP وانتظار diagnostics
func waitForLspDiagnostics(ctx context.Context, filePath string,
    lsps map[string]*lsp.Client)

// تنسيق diagnostics بتفاصيل كاملة
func getDiagnostics(filePath string, lsps map[string]*lsp.Client) string

// عرض diagnostics مع تقسيم file/project
// Output: <file_diagnostics>...</file_diagnostics>
//         <project_diagnostics>...</project_diagnostics>
//         <diagnostic_summary>...</diagnostic_summary>
```

**Output Format:**
```
Error: /path/file.go:12:5 [gopls][SA1006] (unnecessary) message here
Warn: /path/file.go:15:10 [gopls] warning message

<diagnostic_summary>
Current file: 2 errors, 1 warnings
Project: 5 errors, 3 warnings
</diagnostic_summary>
```

**الاستخدامات المثالية:**
✅ Code quality checks بعد التعديلات
✅ Integration في testing workflows
✅ Real-time error detection
✅ Multi-LSP support (gopls, typescript-language-server, etc.)

### Patch Tool
**الوصف:** أداة لتطبيق patches على ملفات متعددة بشكل atomic مع permission system
**الميزات:**
- Multi-file atomic patching (Update/Add/Delete)
- Permission system integration
- File history versioning
- LSP diagnostics بعد التطبيق
- Fuzzy matching detection (max fuzz: 3)
- Pre-patch validation (file read requirements)

**المشروع الأصلي:** OpenCode AI
**الملف:** `go/patch-tool.go`

**Patch Format:**
```
*** Begin Patch
*** Update File: /path/to/file
@@ Unique context line
 Line to keep
-Line to remove
+Line to add
 Line to keep
*** Add File: /path/to/new/file
+Content of the new file
*** Delete File: /path/to/delete
*** End Patch
```

**Safety Features:**
```go
// يجب قراءة الملفات قبل التعديل
if getLastReadTime(absPath).IsZero() {
    return error("must read file first")
}

// التحقق من تعديلات خارجية
if modTime.After(lastRead) {
    return error("file modified since last read")
}

// Fuzzy match detection
if fuzz > 3 {
    return error("context lines not precise enough")
}

// Permission request لكل تغيير
p.permissions.Request(permission.CreatePermissionRequest{...})
```

**Response Metadata:**
```go
type PatchResponseMetadata struct {
    FilesChanged []string
    Additions    int
    Removals     int
}
```

**الاستخدامات المثالية:**
✅ Coordinated multi-file refactoring
✅ Safe file modifications مع permission control
✅ Version tracking لكل التعديلات
✅ Atomic operations مع rollback support

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

**آخر تحديث:** 2025-10-27
**الحالة:** مكتبة مرجعية - جاهزة للاستخدام
