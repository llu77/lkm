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
│   ├── tool-base.go
│   ├── diagnostics-tool.go
│   └── patch-tool.go
│
├── mastra-docs/          # Mastra Documentation
│   ├── framework-meta.ts
│   ├── vite-react-integration.mdx
│   └── project-structure.mdx
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

### Tool Base Interface
**الوصف:** الواجهة الأساسية لجميع الأدوات في OpenCode مع context management
**الميزات:**
- Unified tool interface (BaseTool)
- Response types (Text/Image/Error)
- Metadata support في الـ responses
- Context value extraction (SessionID, MessageID)
- JSON parameter handling

**المشروع الأصلي:** OpenCode AI
**الملف:** `go/tool-base.go`

**Core Interface:**
```go
type BaseTool interface {
    Info() ToolInfo        // معلومات الأداة (Name, Description, Parameters)
    Run(ctx context.Context, params ToolCall) (ToolResponse, error)
}

type ToolInfo struct {
    Name        string
    Description string
    Parameters  map[string]any  // JSON schema للـ parameters
    Required    []string        // Required parameter names
}

type ToolCall struct {
    ID    string  // Tool call identifier
    Name  string  // Tool name
    Input string  // JSON-encoded parameters
}

type ToolResponse struct {
    Type     toolResponseType  // "text" أو "image"
    Content  string
    Metadata string            // JSON metadata (optional)
    IsError  bool
}
```

**Response Helpers:**
```go
// Response عادي
NewTextResponse(content string) ToolResponse

// Response مع metadata
WithResponseMetadata(response ToolResponse, metadata any) ToolResponse

// Error response
NewTextErrorResponse(content string) ToolResponse
```

**Context Management:**
```go
// استرجاع SessionID و MessageID من Context
func GetContextValues(ctx context.Context) (sessionID, messageID string)

// يستخدم في الأدوات للحصول على معلومات الجلسة:
sessionID, messageID := GetContextValues(ctx)
```

**استخدام النمط:**
```go
type myTool struct {
    // dependencies
}

func (t *myTool) Info() ToolInfo {
    return ToolInfo{
        Name: "my_tool",
        Description: "Tool description",
        Parameters: map[string]any{
            "param": map[string]any{
                "type": "string",
                "description": "Parameter description",
            },
        },
        Required: []string{"param"},
    }
}

func (t *myTool) Run(ctx context.Context, call ToolCall) (ToolResponse, error) {
    var params MyParams
    json.Unmarshal([]byte(call.Input), &params)

    sessionID, _ := GetContextValues(ctx)
    // ... perform work ...

    return WithResponseMetadata(
        NewTextResponse("Success"),
        MyMetadata{...},
    ), nil
}
```

**الاستخدامات المثالية:**
✅ بناء أدوات جديدة بواجهة موحدة
✅ فهم معمارية OpenCode tools
✅ إضافة metadata للـ tool responses
✅ Session و message tracking

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

## 📚 **Mastra Documentation**

### Framework Meta Configuration
**الوصف:** Framework selection metadata لـ Mastra documentation
**الملف:** `mastra-docs/framework-meta.ts`

```typescript
const meta = {
  "vite-react": "With Vite/React",
  "next-js": "With Next.js",
  astro: "With Astro",
  sveltekit: "With SvelteKit",
};
```

**الاستخدام:** تحديد الـ frameworks المدعومة في Mastra docs

### Vite/React Integration Guide
**الوصف:** دليل كامل لدمج Mastra مع Vite/React مع React Router v7
**الملف:** `mastra-docs/vite-react-integration.mdx`
**التنسيق:** MDX (Markdown + JSX) مع Nextra components

**المحتوى:**
- تثبيت Mastra packages (mastra, @mastra/core, @mastra/libsql, @mastra/client-js)
- طريقتين للـ integration:
  * One-liner command مع defaults
  * Interactive CLI للتخصيص
- TypeScript configuration
- Environment variables setup
- Mastra Dev Server (port 4111)
- MastraClient setup مع baseUrl
- React Router v7 integration
- Weather agent example

**Key Code Examples:**
```bash
# Installation
npm install mastra@latest @mastra/core@latest @mastra/libsql@latest @mastra/client-js@latest

# One-liner init
npx mastra@latest init --dir . --components agents,tools --example --llm openai

# Dev server
npm run dev:mastra
```

```typescript
// MastraClient setup
import { MastraClient } from "@mastra/client-js";

export const mastraClient = new MastraClient({
  baseUrl: import.meta.env.VITE_MASTRA_API_URL || "http://localhost:4111",
});

// Usage in React component
const agent = mastraClient.getAgent("weatherAgent");
const response = await agent.generate({
  messages: [{ role: "user", content: `What's the weather like in ${city}?` }]
});
```

**Project Structure:**
```
app/
├── routes/
│   ├── home.tsx
│   └── test.tsx
├── routes.ts
lib/
└── mastra.ts
mastra/              # Mastra backend
├── agents/
├── tools/
└── index.ts
```

**الاستخدامات المثالية:**
✅ فهم Mastra architecture (client/server separation)
✅ Integration مع Vite/React projects
✅ Agent-based AI features في frontend apps
✅ Monorepo setup pattern (frontend + Mastra backend)

### Project Structure Guide
**الوصف:** دليل تنظيم ملفات ومجلدات Mastra projects مع best practices
**الملف:** `mastra-docs/project-structure.mdx`
**التنسيق:** MDX (Markdown + JSX) مع Nextra components

**المحتوى:**
- Default folder structure من `create mastra` command
- شرح كل مجلد ووظيفته
- Top-level files configuration
- Flexibility في تنظيم الملفات (unopinionated framework)

**Folder Structure:**
```
src/mastra/
├── index.ts           # Entry point و Mastra configuration
├── agents/            # Agent definitions (behavior, goals, tools)
├── workflows/         # Multi-step workflows orchestration
├── tools/             # Reusable tools للـ agents
├── mcp/              # (Optional) Custom MCP servers
├── scorers/          # (Optional) Agent performance evaluation
└── public/           # (Optional) Static assets للـ build output

Root files:
├── .env.example      # Environment variables template
├── package.json      # Dependencies و npm scripts
└── tsconfig.json     # TypeScript configuration
```

**Key Concepts:**
- **Unopinionated**: يمكن تنظيم الملفات بأي طريقة (حتى في ملف واحد!)
- **Templates**: الملفات المُنشأة من CLI تعمل كـ templates للنسخ والتعديل
- **Consistency**: المهم المحافظة على تنظيم ثابت للـ maintainability
- **Colocate**: حرية في colocating files حسب احتياجات المشروع

**الاستخدامات المثالية:**
✅ فهم Mastra project organization
✅ Setup جديد لمشروع Mastra
✅ Best practices للـ folder structure
✅ Planning monorepo architecture

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
