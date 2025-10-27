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
│   ├── project-structure.mdx
│   ├── working-memory.mdx
│   ├── memory-processors.mdx
│   ├── chunking-embedding.mdx
│   ├── json-chunking.mdx
│   ├── custom-llm-eval.mdx
│   ├── hallucination-eval.mdx
│   ├── parallel-workflows.mdx
│   ├── agent-get-memory.mdx
│   ├── memory-query.mdx
│   ├── graph-rag-tool.mdx
│   └── cloudflare-deployer.mdx
│
├── claude-skills/        # Claude Skills Documentation
│   ├── authoring-best-practices.md
│   ├── advanced-programming-skill/
│   │   ├── SKILL.md
│   │   ├── DEBUGGING_PATTERNS.md
│   │   ├── ARCHITECTURE_PATTERNS.md
│   │   ├── SECURITY_PATTERNS.md
│   │   └── PERFORMANCE_PATTERNS.md
│   ├── backend-architecture-skill/
│   │   ├── SKILL.md
│   │   └── AUTH_PATTERNS.md
│   ├── error-handling-skill/
│   │   ├── SKILL.md
│   │   └── GRACEFUL_DEGRADATION.md
│   ├── testing-qa-skill/
│   │   └── SKILL.md
│   ├── database-optimization-skill/
│   │   └── SKILL.md
│   └── devops-deployment-skill/
│       └── SKILL.md
│
├── anthropic-api/        # Anthropic API Reference
│   └── context-1m-beta.md
│
├── prompt-engineering/   # Prompt Engineering Techniques
│   ├── chapter-6-thinking-step-by-step.ipynb
│   └── multi-turn-conversations.md
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

### Working Memory (⭐ Critical Feature)
**الوصف:** نظام الذاكرة العاملة في Mastra للحفاظ على معلومات المستخدم المستمرة
**الملف:** `mastra-docs/working-memory.mdx`
**الأهمية:** 🔥 **أساسي جداً لتطوير agents ذكية ومتذكرة**

**المفهوم الأساسي:**
Working memory = ذاكرة Agent النشطة، مثل دفتر الملاحظات المستمر
- يحفظ معلومات المستخدم (الاسم، التفضيلات، الأهداف)
- يستمر عبر المحادثات المختلفة
- يتحدث بشكل تلقائي من خلال `updateWorkingMemory` tool

**Memory Scopes:**

1. **Resource-Scoped (Default)**:
   ```typescript
   // الذاكرة تستمر لنفس المستخدم عبر جميع المحادثات
   const memory = new Memory({
     options: {
       workingMemory: {
         enabled: true,
         scope: 'resource',  // عبر كل threads للمستخدم
       },
     },
   });

   // يجب تمرير resourceId
   await agent.generate("Hello!", {
     threadId: "conv-123",
     resourceId: "user-456"  // نفس المستخدم
   });
   ```

2. **Thread-Scoped**:
   ```typescript
   // الذاكرة معزولة لكل محادثة
   const memory = new Memory({
     options: {
       workingMemory: {
         enabled: true,
         scope: 'thread',  // معزول لكل thread
       },
     },
   });
   ```

**Template vs Schema:**

**Template (Markdown)** - Free-form text:
```typescript
const memory = new Memory({
  options: {
    workingMemory: {
      enabled: true,
      template: `# User Profile
- Name:
- Location:
- Timezone:
- Preferences:
  - Communication Style:
  - Project Goal:
`,
    },
  },
});
```

**Schema (Zod)** - Structured JSON:
```typescript
const userProfileSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
  preferences: z.object({
    communicationStyle: z.string().optional(),
    projectGoal: z.string().optional(),
  }).optional(),
});

const memory = new Memory({
  options: {
    workingMemory: {
      enabled: true,
      schema: userProfileSchema,  // Type-safe!
    },
  },
});
```

**Setting Initial Memory:**
```typescript
// عند إنشاء thread جديد
const thread = await memory.createThread({
  threadId: "thread-123",
  resourceId: "user-456",
  metadata: {
    workingMemory: `# Patient Profile
- Name: John Doe
- Blood Type: O+
- Allergies: Penicillin
`
  }
});

// Update مباشر
await memory.updateWorkingMemory({
  threadId: "thread-123",
  resourceId: "user-456",
  workingMemory: "Updated content..."
});
```

**Template Design Best Practices:**
- ✅ Short, focused labels (`## Personal Info`, `- Name:`)
- ✅ Consistent casing (Title Case أو lowercase)
- ✅ Simple placeholders (`[e.g., Formal]`, `[Date]`)
- ✅ Abbreviate long values (`- Name: [First name]`)
- ✅ Update rules في agent instructions

**Storage Support:**
- ✅ LibSQL (@mastra/libsql)
- ✅ PostgreSQL (@mastra/pg)
- ✅ Upstash (@mastra/upstash)

**Use Cases:**
- Personal assistants (user preferences)
- Customer service (customer context)
- Educational apps (student progress)
- Medical apps (patient history)
- Session state management

**Example: Memory Evolution:**
```markdown
Initial:
# User Profile
- Name:
- Location:

After "My name is Sam from Berlin":
# User Profile
- Name: Sam
- Location: Berlin

After "I'm in CET timezone":
# User Profile
- Name: Sam
- Location: Berlin
- Timezone: CET
```

**الاستخدامات المثالية:**
✅ Persistent user memory عبر sessions
✅ Context maintenance في conversations طويلة
✅ Personalization based on user preferences
✅ Stateful agents مع ذاكرة متطورة
✅ Multi-thread user tracking

**مهم جداً:** هذه الميزة أساسية لبناء agents ذكية تتذكر المستخدمين وتفضيلاتهم!

### Memory Processors (⭐ Performance Optimization)
**الوصف:** معالجات الذاكرة لتحويل وتصفية الرسائل قبل إرسالها للـ LLM
**الملف:** `mastra-docs/memory-processors.mdx`
**الأهمية:** 🎯 **مهم لإدارة context window وتحسين الأداء**

**المفهوم الأساسي:**
Memory Processors = فلاتر تعمل على الرسائل المسترجعة من الذاكرة قبل إرسالها للـ LLM
- يعدّلون الرسائل (filter, trim, transform)
- لا يؤثرون على رسالة المستخدم الجديدة
- ينفّذون بالترتيب (pipeline pattern)

**Built-in Processors:**

1. **TokenLimiter** - منع تجاوز context window:
   ```typescript
   import { TokenLimiter } from "@mastra/memory/processors";

   const memory = new Memory({
     processors: [
       new TokenLimiter(127000), // GPT-4o limit (~127k)
     ],
   });

   // مع models أخرى
   import cl100k_base from "js-tiktoken/ranks/cl100k_base";
   new TokenLimiter({
     limit: 16000,
     encoding: cl100k_base, // For older OpenAI models
   });
   ```

   - يستخدم `o200k_base` encoding افتراضياً (GPT-4o)
   - يحذف أقدم الرسائل حتى يصل للحد المسموح
   - يمنع errors من context window overflow

2. **ToolCallFilter** - إزالة tool calls من الذاكرة:
   ```typescript
   import { ToolCallFilter } from "@mastra/memory/processors";

   const memory = new Memory({
     processors: [
       // حذف جميع tool calls
       new ToolCallFilter(),

       // حذف tools محددة فقط
       new ToolCallFilter({ exclude: ["generateImageTool"] }),
     ],
   });
   ```

   - يوفر tokens بإزالة tool interactions المطولة
   - مفيد إذا كنت تريد Agent يعيد استدعاء tool دائماً
   - يزيل النتائج السابقة من memory

**Processor Chaining:**
```typescript
import { ToolCallFilter, TokenLimiter } from "@mastra/memory/processors";

const memory = new Memory({
  processors: [
    // 1. Filter tools أولاً
    new ToolCallFilter({ exclude: ["verboseDebugTool"] }),

    // 2. Custom filtering (e.g., PII removal)
    // new PIIFilter(),

    // 3. TokenLimiter دائماً في النهاية! ⚠️
    new TokenLimiter(127000),
  ],
});
```

**⚠️ مهم:** دائماً ضع `TokenLimiter` في النهاية لأدق حساب للـ tokens

**Custom Processors:**
```typescript
import { MemoryProcessor } from "@mastra/core/memory";
import { CoreMessage, MemoryProcessorOpts } from "@mastra/core";

class ConversationOnlyFilter extends MemoryProcessor {
  constructor() {
    super({ name: "ConversationOnlyFilter" });
  }

  process(
    messages: CoreMessage[],
    _opts: MemoryProcessorOpts = {}
  ): CoreMessage[] {
    // إبقاء user و assistant messages فقط
    return messages.filter(
      (msg) => msg.role === "user" || msg.role === "assistant"
    );
  }
}

// Usage
const memory = new Memory({
  processors: [
    new ConversationOnlyFilter(),
    new TokenLimiter(127000),
  ],
});
```

**Best Practices:**
- ✅ ضع `TokenLimiter` دائماً في النهاية
- ✅ لا تعدّل `messages` array مباشرة (immutability)
- ✅ استخدم processor name للـ debugging
- ✅ تسلسل processors حسب الأولوية
- ✅ Filter قبل Limit للدقة الأفضل

**Use Cases:**
- Context window management (منع errors)
- Token optimization (تقليل التكلفة)
- Tool call filtering (إزالة noise)
- PII removal (privacy)
- Role-based filtering (user/assistant only)
- Conversation summarization
- Message deduplication

**الاستخدامات المثالية:**
✅ تحسين استخدام tokens وتقليل التكلفة
✅ منع context window overflow errors
✅ تصفية tool calls المطولة أو غير المفيدة
✅ إنشاء custom filtering logic للـ privacy/compliance
✅ Pipeline معالجة متعدد المراحل

**مهم:** الترتيب مهم! TokenLimiter يجب أن يكون أخيراً.

### Chunking & Embedding (⭐ RAG Foundation)
**الوصف:** دليل تقسيم وتضمين المستندات للـ RAG (Retrieval Augmented Generation)
**الملف:** `mastra-docs/chunking-embedding.mdx`
**الأهمية:** 🔥 **أساسي لبناء RAG systems وvector search**

**المفهوم الأساسي:**
Pipeline من خطوتين: تقسيم المستندات → توليد embeddings → تخزين في vector DB

**Document Initialization:**
```typescript
import { MDocument } from "@mastra/rag";

const docFromText = MDocument.fromText("Your text...");
const docFromHTML = MDocument.fromHTML("<html>...</html>");
const docFromMarkdown = MDocument.fromMarkdown("# Markdown...");
const docFromJSON = MDocument.fromJSON(`{"key": "value"}`);
```

**Chunking Strategies (9 استراتيجيات):**

1. **recursive** - Smart content-aware splitting:
   ```typescript
   const chunks = await doc.chunk({
     strategy: "recursive",
     maxSize: 512,
     overlap: 50,
     separators: ["\n"],
     extract: { metadata: true }, // LLM-powered metadata extraction
   });
   ```

2. **sentence** - Preserve sentence structure:
   ```typescript
   const chunks = await doc.chunk({
     strategy: "sentence",
     maxSize: 450,
     minSize: 50,
     overlap: 0,
     sentenceEnders: ["."],
     keepSeparator: true,
   });
   ```

3. **semantic-markdown** - Preserve header relationships:
   ```typescript
   const chunks = await doc.chunk({
     strategy: "semantic-markdown",
     joinThreshold: 500,
     modelName: "gpt-3.5-turbo",
   });
   ```

4. **Other strategies**:
   - `character` - Simple character-based
   - `token` - Token-aware splitting
   - `markdown` - Markdown structure-aware
   - `html` - HTML structure-aware
   - `json` - JSON structure-aware
   - `latex` - LaTeX structure-aware

**Embedding Generation:**

**Method 1: Model Router (Recommended):**
```typescript
import { ModelRouterEmbeddingModel } from "@mastra/core";
import { embedMany } from "ai";

const embeddingModel = new ModelRouterEmbeddingModel(
  "openai/text-embedding-3-small"
);

const { embeddings } = await embedMany({
  model: embeddingModel,
  values: chunks.map((chunk) => chunk.text),
});
```

**Supported Models:**
- **OpenAI**: text-embedding-3-small, text-embedding-3-large, text-embedding-ada-002
- **Google**: gemini-embedding-001, text-embedding-004

**Method 2: AI SDK Direct:**
```typescript
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";

const { embeddings } = await embedMany({
  model: openai.embedding("text-embedding-3-small"),
  values: chunks.map((chunk) => chunk.text),
});
```

**Dimension Configuration:**
```typescript
// OpenAI - reduce dimensions to save storage
const { embeddings } = await embedMany({
  model: openai.embedding("text-embedding-3-small", {
    dimensions: 256, // Default: 1536
  }),
  values: chunks.map((chunk) => chunk.text),
});

// Google - truncate from end
const { embeddings } = await embedMany({
  model: google.textEmbeddingModel("text-embedding-004", {
    outputDimensionality: 256,
  }),
  values: chunks.map((chunk) => chunk.text),
});
```

**Complete Pipeline Example:**
```typescript
import { MDocument } from "@mastra/rag";
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";

// 1. Initialize document
const doc = MDocument.fromText(`
  Climate change poses significant challenges...
`);

// 2. Chunk document
const chunks = await doc.chunk({
  strategy: "recursive",
  maxSize: 256,
  overlap: 50,
});

// 3. Generate embeddings
const { embeddings } = await embedMany({
  model: openai.embedding("text-embedding-3-small"),
  values: chunks.map((chunk) => chunk.text),
});

// 4. Store in vector database
await vectorStore.upsert({
  indexName: "embeddings",
  vectors: embeddings,
});
```

**Key Concepts:**

- **Chunks**: Manageable text pieces optimized for LLM context
- **Embeddings**: Vector representations للمعنى الدلالي
- **Overlap**: تداخل بين chunks للحفاظ على السياق
- **Dimensions**: حجم vector (trade-off بين accuracy و storage)
- **Vector DB Compatibility**: يجب مطابقة dimensions في index

**Chunking Strategy Selection:**
- 📄 **Plain text**: `recursive` أو `sentence`
- 📝 **Markdown**: `semantic-markdown` أو `markdown`
- 🌐 **HTML**: `html`
- 📊 **JSON**: `json`
- 📐 **LaTeX**: `latex`
- 🔤 **Simple split**: `character` أو `token`

**Best Practices:**
- ✅ اختر strategy حسب نوع المحتوى
- ✅ استخدم overlap (50-100) للحفاظ على context
- ✅ maxSize حسب model context window
- ✅ Reduce dimensions للتوفير في storage
- ✅ تأكد من vector DB index dimensions تطابق embedding dimensions
- ⚠️ Metadata extraction يستخدم LLM (API key required)

**Use Cases:**
- RAG systems (document Q&A)
- Semantic search
- Knowledge base retrieval
- Document similarity
- Content recommendation
- FAQ matching

**الاستخدامات المثالية:**
✅ بناء RAG systems لـ document Q&A
✅ Semantic search في knowledge bases
✅ Document similarity و clustering
✅ Content retrieval optimization
✅ Building vector databases

**مهم جداً:** هذا أساس أي RAG system - الفهم الصحيح للـ chunking والـ embeddings ضروري!

---

## 🎯 **Claude Skills (Advanced)**

### Advanced Programming & Debugging Skill
**الوصف:** Claude Skill متقدم شامل للبرمجة والإصلاح مع تفكير عميق وأنماط sub-agents
**الموقع:** `claude-skills/advanced-programming-skill/`
**النوع:** Skill كامل مع ملفات مرجعية متخصصة

**المكونات:**

**SKILL.md (الملف الرئيسي):**
- Thinking Framework متعدد المراحل (Problem Analysis → Brainstorming → Decision → Implementation)
- Debugging Protocol منهجي (Information Gathering → Hypothesis Formation → Investigation → Root Cause → Fix)
- Sub-Agent Delegation Patterns (Code Analysis, Security Analysis, Performance Analysis, Test Generation)
- Execution Patterns (Iterative Refinement, Test-Driven Debugging, Layered Analysis, Comparative Implementation)
- Code Review Protocol شامل (Correctness, Performance, Security, Maintainability, Testing, Architecture)

**Thinking Framework Structure:**
```
<problem-analysis>
- Core problem identification
- Constraints analysis
- Edge cases and failure modes
- Dependencies and side effects
</problem-analysis>

<solution-brainstorm>
Approach A: [pros, cons, best for]
Approach B: [pros, cons, best for]
Approach C: [pros, cons, best for]
</solution-brainstorm>

<decision>
Selected approach: [rationale]
Trade-offs accepted: [why acceptable]
</decision>

<implementation-plan>
1. Step-by-step actions
2. Testing strategy
3. Rollback plan
</implementation-plan>
```

**Sub-Agent Patterns:**

**Code Analysis Sub-Agent:** للبحث عن patterns عبر ملفات متعددة، فهم codebase structure، تحليل dependencies.

**Security Analysis Sub-Agent:** للمراجعة الأمنية، فحص vulnerabilities، تحليل authentication/authorization logic.

**Performance Analysis Sub-Agent:** لتحديد bottlenecks، تحليل algorithmic complexity، إيجاد memory leaks.

**Test Generation Sub-Agent:** لإنشاء test suites شاملة، integration tests، test fixtures ومocks.

**DEBUGGING_PATTERNS.md:**
10 أنماط debugging متقدمة مع أمثلة كاملة:

**Binary Search Debugging:** عزل مكان الـ bug في codebase كبير بطريقة binary search.

**State Snapshot Comparison:** مقارنة state قبل وبعد العملية لتحديد التغييرات غير المتوقعة.

**Minimal Reproduction:** تقليل السيناريو المعقد إلى أصغر مجموعة تعيد إنتاج الـ bug.

**Time-Travel Debugging:** استخدام git bisect لإيجاد الـ commit الذي أدخل الـ bug.

**Rubber Duck Debugging++:** نسخة محسنة مع structured explanation framework.

**Assertion Injection:** حقن assertions مؤقتة لالتقاط state corruption مبكراً.

**Differential Debugging:** مقارنة سلوك النسخة العاملة مع المكسورة side-by-side.

**Heisenbug Trapping:** للـ bugs التي تختفي عند محاولة debugging (race conditions, timing bugs).

**Statistical Debugging:** تحليل إحصائي للـ bugs المتقطعة بجمع samples وإيجاد patterns.

**Dependency Isolation:** عزل external dependencies بـ mocks لتحديد مصدر الـ bug.

**ARCHITECTURE_PATTERNS.md:**
6 architectural patterns مع trade-off analysis شامل:

**Layered Architecture:** Presentation → Business Logic → Data Access → Database. متى يستخدم، المزايا والعيوب، decision criteria.

**Hexagonal Architecture (Ports & Adapters):** Application Core محاط بـ ports وadapters. مثالي للـ testability وswapping infrastructure.

**Event-Driven Architecture:** Loose coupling عبر event bus. للأنظمة التي تحتاج asynchronous processing وeventual consistency.

**CQRS (Command Query Responsibility Segregation):** فصل read وwrite models. للأنظمة التي تحتاج independent scaling للقراءة والكتابة.

**Microservices:** Independent services مع databases منفصلة. للفرق الكبيرة والأنظمة التي تحتاج independent deployment.

**Domain-Driven Design:** Rich domain models مع entities, value objects, aggregates. للـ business logic المعقد.

**Decision Framework:**
- Team size considerations
- Domain complexity analysis
- Scaling needs evaluation
- Consistency requirements
- Deployment independence needs

**Architecture Evolution Path:**
```
Phase 1 (0-6 months): Simple Layered Monolith
Phase 2 (6-24 months): Hexagonal for core + Events
Phase 3 (24+ months): Extract Microservices selectively
```

**Anti-patterns محددة:** Resume-Driven Development, Big Bang Rewrites, Architecture Astronauts, Technology Mismatches.

**SECURITY_PATTERNS.md:**
10 security patterns مع أمثلة تنفيذية كاملة:

**Defense in Depth:** طبقات أمان متعددة (Input Validation → Authentication → Authorization → Encryption → Logging → Incident Response).

**Input Validation:** Allowlist approach، type validation مع Pydantic، تجنب injection attacks.

**SQL Injection Prevention:** Parameterized queries دائماً، عدم concatenation للـ SQL أبداً، ORM usage الآمن.

**Authentication & Password Security:** bcrypt/argon2 للـ passwords، JWT security مع expiration وrevocation، multi-factor authentication.

**Authorization (RBAC/ABAC):** Role-Based وAttribute-Based access control patterns.

**XSS Prevention:** Output encoding/escaping، Content Security Policy (CSP)، template auto-escaping.

**CSRF Prevention:** CSRF tokens على state-changing requests، SameSite cookie attribute.

**Secure File Upload:** Extension validation، size limits، filename sanitization، malware scanning.

**Secrets Management:** Environment variables، secrets management services، encryption at rest.

**Rate Limiting:** Per-endpoint وper-user rate limits، DoS protection.

**Security Headers:** X-Frame-Options، Content-Security-Policy، Strict-Transport-Security، وغيرها.

**Security Checklist شامل:** Input Validation, Authentication, Authorization, Data Protection, SQL Injection, XSS, CSRF, Logging, Dependencies, Error Handling.

**PERFORMANCE_PATTERNS.md:**
10 performance optimization patterns مع profiling tools:

**Rule 0:** Measure First, Optimize Later - عدم optimization بدون قياس.

**Database Query Optimization:** حل N+1 query problem، indexing strategy، query optimization checklist.

**Caching Strategies:** Cache hierarchy (L1: in-memory → L2: Redis → L3: Database)، cache invalidation patterns.

**Lazy Loading:** تحميل الـ resources فقط عند الحاجة.

**Batch Operations:** Bulk operations بدلاً من loops، bulk insert patterns.

**Pagination:** Offset-based وcursor-based pagination للـ large datasets.

**Async I/O:** Asynchronous API calls للعمليات المتوازية.

**Connection Pooling:** إعادة استخدام database connections بدلاً من إنشاء جديدة.

**Compression:** Gzip compression للـ large responses.

**Memoization:** Cache نتائج الحسابات المكلفة.

**Profiling Tools:**
- Python profiling (cProfile, pstats)
- Memory profiling (memory_profiler)
- Database query profiling (SQLAlchemy events)
- Performance testing (timer context manager)

**Performance Checklist:** Database optimization, Caching, API/Network, Code algorithms, Monitoring, Frontend optimization.

**الاستخدامات المثالية:**
- Systematic debugging لمشاكل معقدة
- Architecture decisions مع trade-off analysis
- Security reviews شاملة
- Performance optimization مبني على قياسات
- Code reviews منهجية
- Sub-agent delegation للمهام الكبيرة
- Teaching and mentoring عبر structured thinking

**مهم:**
- يجمع بين thinking step-by-step للدقة
- Systematic debugging للكفاءة
- Sub-agent delegation للمهام المعقدة
- Clear communication للتعاون
- Continuous learning للتحسين المستمر

**Best Practices:**
- Always think before coding
- Test assumptions, don't guess
- Document reasoning
- Use sub-agents strategically
- Communicate uncertainty
- Show your work
- Iterate incrementally
- Learn from bugs

### Backend Architecture & API Design Skill
**الوصف:** Claude Skill متخصص في تصميم وبناء backend systems مع تحليل منهجي وarchitectural thinking
**الموقع:** `claude-skills/backend-architecture-skill/`
**النوع:** Production-grade backend skill مع أنماط RESTful APIs

**المكونات:**

**SKILL.md (الملف الرئيسي):**
- Thinking Protocol للـ Backend Tasks (Requirements Analysis → Architecture Analysis → Technology Selection → Implementation Plan)
- API Design Principles (RESTful design, Request/Response patterns, Pagination)
- Database Design Patterns (Schema design, Repository pattern, Indexes)
- Service Layer Pattern مع Dependency Injection
- Testing Backend Systems (unit, integration, load testing)
- Decision Checklist شامل للـ backend features

**Thinking Protocol Structure:**
```
<backend-requirements>
- Functional requirements
- Non-functional requirements (load, latency, availability)
- Security requirements
- Constraints
</backend-requirements>

<architecture-analysis>
- System boundaries
- Scalability considerations
- Failure modes
- Data model
</architecture-analysis>

<technology-selection>
- Database choice (SQL vs NoSQL)
- Caching strategy
- Message queue (if needed)
- API design (REST vs GraphQL)
- Rationale for each
</technology-selection>
```

**API Design:**

RESTful resource-oriented endpoints مع HTTP methods صحيحة، Request validation باستخدام Pydantic، Response structures موحدة مع error handling، Pagination patterns (offset-based و cursor-based).

**Database Patterns:**

Schema design مع audit fields (created_at, updated_at, deleted_at)، Indexes للـ queries الشائعة، Repository pattern للـ data access، Soft delete support.

**AUTH_PATTERNS.md:**
أنماط Authentication & Authorization production-ready:

**JWT Implementation:** كامل مع access tokens و refresh tokens، Token rotation، Token revocation باستخدام Redis، FastAPI integration مع dependencies.

**RBAC (Role-Based Access Control):** Role-Permission mapping، Permission decorators، Authorization checks في endpoints.

**ABAC (Attribute-Based Access Control):** Policy-based access control، AccessControlEngine للـ policy evaluation، Multi-policy support (Owner, Admin, TeamMember, Published).

**API Key Authentication:** لـ service-to-service auth، API key generation و hashing، Rate limiting per key، FastAPI dependency للـ verification.

**OAuth2 Integration:** Google OAuth2 flow example، Token handling، User creation from OAuth.

**Best Practices:** Never store plain passwords، Use HTTPS، Rate limiting، Refresh token rotation، Appropriate expiration، Logging auth events، Account lockout، 2FA للـ sensitive operations.

**الاستخدامات المثالية:**
- تصميم RESTful APIs production-grade
- Database schema design مع optimization
- Authentication و authorization systems
- Service layer architecture
- Backend testing strategies
- Technology selection مع trade-off analysis
- Scalability planning

**مهم:**
- يجمع systematic analysis مع practical implementation
- Production-tested patterns
- Security-first approach
- Testability built-in
- Clear decision frameworks

### Advanced Error Handling & Recovery Skill
**الوصف:** Claude Skill متخصص في error handling شامل و fault tolerance مع recovery strategies
**الموقع:** `claude-skills/error-handling-skill/`
**النوع:** Resilient systems skill مع graceful degradation

**المكونات:**

**SKILL.md (الملف الرئيسي):**
- Error Handling Philosophy (Errors WILL happen، Fail fast recover fast، Never silence errors، User-friendly outside detailed inside، Errors are data)
- Error Analysis Framework (Error Taxonomy → Error Handling Strategy → Fault Tolerance Design)
- Error Handling Patterns (Structured hierarchy، Retry with backoff، Circuit breaker، Recovery chain)
- Error Classification (Transient vs Permanent vs Infrastructure vs Business vs Data errors)

**Error Analysis Framework:**
```
<error-taxonomy>
Transient Errors: Network timeouts, DB connection failures, Rate limiting
Strategy: Retry with exponential backoff

Permanent Errors: Invalid input, Unauthorized, Not found
Strategy: Return clear error, don't retry

Infrastructure Errors: Database down, Cache unavailable
Strategy: Circuit breaker, fallback, graceful degradation

Business Logic Errors: Insufficient balance, Out of stock
Strategy: Domain-specific error, suggest remedy
</error-taxonomy>

<error-strategy>
Detection: How do we detect? Early warnings? Prevention?
Response: Retry? Fallback? Fail safely?
Communication: User message? Logs? Alerts?
Recovery: Auto-recover? Manual intervention? Prevention?
</error-strategy>
```

**Error Handling Patterns:**

**Structured Error Hierarchy:** AppError base class مع error_code و details و cause و traceback، Domain-specific errors (ValidationError, ResourceNotFoundError، BusinessRuleViolation، ExternalServiceError)، Structured error responses.

**Retry with Exponential Backoff:** Decorator implementation مع configurable parameters، Jitter لمنع thundering herd، Selective retry على exceptions محددة، Logging لكل retry attempt.

**Circuit Breaker:** Three states (CLOSED, OPEN, HALF_OPEN)، Failure threshold و recovery timeout، Auto-recovery testing، Thread-safe implementation.

**Error Recovery Chain:** Multiple recovery strategies، Strategy pattern implementation، Fallback chain (Retry → Cache → Fallback value)، Context passing للـ recovery logic.

**GRACEFUL_DEGRADATION.md:**
أنماط graceful degradation و fallback strategies:

**Feature Flags for Degradation:** FeatureState (ENABLED, DEGRADED, DISABLED)، Redis-based feature flags، Auto-degradation على error threshold، Primary → Secondary → Tertiary fallbacks.

**Cascading Fallbacks:** FallbackChain implementation، Timeout per strategy، Comprehensive logging، AllFallbacksFailedError عند فشل كل شيء.

**Circuit Breaker with Fallback:** Circuit breaker مدمج مع fallback function، State transitions automatic، Fallback triggered عند OPEN state، Recovery detection في HALF_OPEN.

**Partial Response Pattern:** Aggregate data من multiple services، Parallel execution مع ThreadPoolExecutor، Tolerance للـ partial failures، Fallback data للـ failed services، User communication عن degraded state.

**Degraded Mode Communication:** SystemHealth tracking (HEALTHY, DEGRADED, CRITICAL)، Component-level health status، Public health check endpoint، HTTP status codes appropriate.

**Best Practices:** Always have fallback، Communicate degradation، Log everything، Monitor fallback usage، Auto-recover، Test degradation regularly، Prioritize features، Clear timeouts، Circuit breakers، Cache aggressively.

**الاستخدامات المثالية:**
- Building resilient systems
- Implementing retry logic
- Circuit breaker patterns
- Graceful degradation
- Partial failure handling
- Error monitoring و analysis
- Fault tolerance design
- Recovery automation

**مهم:**
- Fail-safe design approach
- User experience during failures
- Automatic recovery when possible
- Clear error communication
- Production-tested resilience patterns

### Testing & QA Skill
**الوصف:** Claude Skill شامل لاستراتيجيات الاختبار وضمان الجودة مع Test Pyramid approach
**الموقع:** `claude-skills/testing-qa-skill/`
**النوع:** Production-grade testing skill مع comprehensive strategies

**المكونات:**

**SKILL.md (الملف الرئيسي):**
- Testing Philosophy (Tests are documentation، Fail fast fail clear، Test pyramid approach)
- Test Pyramid Approach (70% unit، 20% integration، 10% E2E)
- Testing Framework (Requirements Analysis → Testing Strategy → Test Implementation → Coverage Analysis)
- AAA Pattern (Arrange-Act-Assert) لجميع الـ tests
- Test Organization Patterns (Test file structure، Naming conventions، Fixtures and mocks)

**Testing Patterns:**

**Unit Testing:** pytest مع AAA pattern، Test doubles (Mock، Stub، Fake، Spy)، Parameterized testing، Exception testing، Async function testing.

**Integration Testing:** Database testing مع fixtures، API testing مع test client، External service testing مع mocking، Transaction rollback في tests.

**End-to-End Testing:** Selenium/Playwright للـ UI testing، Full user workflows، Authentication flows، Error scenarios.

**Test-Driven Development (TDD):** Red-Green-Refactor cycle، Writing tests before code، Incremental development، Refactoring with confidence.

**Performance Testing:** Load testing، Stress testing، Profiling، Benchmark comparisons.

**Test Coverage:** Line coverage، Branch coverage، Coverage reports، Coverage goals (>80% recommended).

**الاستخدامات المثالية:**
- بناء test suites شاملة
- TDD workflow implementation
- Integration testing strategies
- Performance testing و profiling
- Test coverage analysis
- Mocking external dependencies
- Async code testing
- CI/CD testing integration

**مهم:**
- Test pyramid approach للكفاءة
- AAA pattern للوضوح
- Comprehensive test coverage
- Fast feedback loops
- Isolated unit tests
- Realistic integration tests

### Database Optimization Skill
**الوصف:** Claude Skill متخصص في database performance optimization مع measurement-driven approach
**الموقع:** `claude-skills/database-optimization-skill/`
**النوع:** Production database optimization skill

**المكونات:**

**SKILL.md (الملف الرئيسي):**
- Optimization Philosophy (Measure first optimize later، Query analysis با EXPLAIN، Index strategy، Connection pooling)
- Performance Analysis Framework (Baseline Measurement → Bottleneck Identification → Optimization → Verification)
- Query Optimization Patterns (N+1 queries، JOIN optimization، Index usage، Query caching)
- Schema Design Patterns (Normalization vs denormalization، Partitioning strategies، Audit fields)
- Database Monitoring (Slow query logs، Performance metrics، Connection pool monitoring)

**Optimization Patterns:**

**N+1 Query Problem:** Detection با profiling، Eager loading مع joinedload، Batch loading strategies، Subquery optimization.

**Indexing Strategies:** Simple indexes، Composite indexes، Covering indexes، Partial indexes، Expression indexes، Index maintenance.

**Query Optimization:** EXPLAIN ANALYZE analysis، JOIN order optimization، Subquery vs JOIN trade-offs، Query hints، Query plan caching.

**Connection Pooling:** Pool size configuration، Connection lifecycle، Health checks، Monitoring pool usage، Handling connection leaks.

**Schema Optimization:** Normalization levels (1NF → BCNF)، Denormalization للـ performance، Partitioning (range, hash, list)، Archiving strategies.

**Caching Strategies:** Query result caching مع Redis، Cache invalidation patterns، Cache-aside pattern، Write-through caching.

**Transaction Optimization:** Transaction isolation levels، Lock management، Deadlock prevention، Batch commits.

**Database Monitoring:** Slow query log analysis، Performance schema queries، Connection monitoring، Query execution plans.

**الاستخدامات المثالية:**
- N+1 query detection والحل
- Index optimization strategies
- Query performance tuning
- Schema design optimization
- Connection pool management
- Caching implementation
- Transaction optimization
- Performance monitoring setup

**مهم:**
- Always measure before optimizing
- EXPLAIN ANALYZE للفهم
- Index strategy is critical
- Connection pooling is essential
- Monitor production queries
- Cache wisely with invalidation

### DevOps & Deployment Skill
**الوصف:** Claude Skill شامل لـ DevOps practices و CI/CD pipelines و infrastructure automation
**الموقع:** `claude-skills/devops-deployment-skill/`
**النوع:** Production DevOps و deployment strategies skill

**المكونات:**

**SKILL.md (الملف الرئيسي):**
- DevOps Thinking Framework (Requirements Analysis → Infrastructure Analysis → Solution Design → Implementation Plan)
- CI/CD Pipeline Patterns (GitHub Actions، GitLab CI، Jenkins)
- Infrastructure as Code (Terraform، CloudFormation، Pulumi)
- Deployment Strategies (Rolling، Blue-Green، Canary، Recreate)
- Monitoring & Observability (Prometheus، Grafana، ELK stack)
- Container Orchestration (Docker، Kubernetes)

**DevOps Patterns:**

**CI/CD Pipeline Design:** Multi-stage pipelines (test → security → build → deploy)، Parallel execution، Caching strategies، Environment-specific deployments، Automated rollback.

**Deployment Strategies:**

**Rolling Deployment:** Gradual pod replacement، Zero-downtime updates، Health check integration، Automatic rollback على failures.

**Blue-Green Deployment:** Zero-downtime switching، Complete environment isolation، Instant rollback capability، Smoke testing قبل switch.

**Canary Deployment:** Gradual traffic shift (10% → 50% → 100%)، Metrics monitoring، Automated rollback على degradation، Progressive delivery.

**Infrastructure as Code:** Terraform modules للـ AWS/GCP/Azure، VPC و networking setup، RDS و database configuration، ElastiCache و caching، S3 storage، EKS/GKS cluster management.

**Monitoring Stack:** Prometheus metrics collection، Grafana dashboards، Alert rules configuration، Application instrumentation، Request tracking، Error rate monitoring، Latency monitoring، Database performance tracking.

**Python Instrumentation:** prometheus_client integration، Custom metrics decorators، Request middleware، Database query tracking، Cache hit/miss tracking.

**Best Practices Checklists:**

**CI/CD Checklist:** Version control setup، Protected branches، Code reviews، Automated linting، Testing gates، Security scanning، Build optimization، Deployment automation، Health checks، Automated rollback.

**Infrastructure Checklist:** Multi-AZ deployment، Auto-scaling، Load balancer setup، Database replication، Disaster recovery plan، Network segmentation، Security groups، Encryption، Secrets rotation، Monitoring و alerting.

**الاستخدامات المثالية:**
- CI/CD pipeline setup
- Infrastructure as Code implementation
- Deployment strategy selection
- Kubernetes cluster management
- Monitoring و observability setup
- Container orchestration
- Cloud infrastructure design
- Disaster recovery planning
- Security automation (DevSecOps)

**مهم:**
- Start simple، evolve gradually
- Automate everything possible
- Monitor extensively
- Test deployments in staging
- Have rollback plans ready
- Security from the start
- Cost optimization awareness
- Document infrastructure decisions

---

## 🤖 **Anthropic API Reference**

### 1M Context Window (Beta)
**الوصف:** Extended context window حتى 1 مليون token لمعالجة مستندات ضخمة
**الملف:** `anthropic-api/context-1m-beta.md`
**الحالة:** Beta Feature (تتطلب header خاص)

**الميزات:**
- Context window: 1,000,000 tokens (vs 200K standard)
- Model: claude-sonnet-4-5
- Beta header: `betas=["context-1m-2025-08-07"]`
- Prompt caching: **ضروري جداً** للتوفير في التكلفة

**API Usage:**
```python
from anthropic import Anthropic

client = Anthropic()

response = client.beta.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Process this large document..."}
    ],
    betas=["context-1m-2025-08-07"]  # Required!
)
```

**Token Scale:**
- 1M tokens ≈ 750,000 كلمة إنجليزية
- 1M tokens ≈ 3,000+ صفحة نص
- يمكن استيعاب codebase كامل متوسط/كبير

**Use Cases:**
✅ Codebase analysis (المشروع بأكمله)
✅ Book/research paper analysis (كتب كاملة)
✅ Legal document review (عقود طويلة)
✅ Multi-document Q&A (عدة مستندات في context واحد)
✅ Extended conversation history

**⚠️ مهم جداً:**
- يجب استخدام `betas=["context-1m-2025-08-07"]` في كل request
- **استخدم Prompt Caching دائماً** - بدونه التكلفة عالية جداً
- Cache creation توفر ~90% على القراءات المتكررة
- استخدم `.beta.messages.create()` وليس `.messages.create()`

**Prompt Caching Pattern:**
```python
response = client.beta.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": "Large system prompt...",
            "cache_control": {"type": "ephemeral"}  # Cache this!
        }
    ],
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Very large document...",
                    "cache_control": {"type": "ephemeral"}  # Cache this too!
                }
            ]
        }
    ],
    betas=["context-1m-2025-08-07", "prompt-caching-2024-07-31"]
)
```

**الاستخدامات المثالية:**
✅ تحليل codebase كامل في سياق واحد
✅ معالجة مستندات ضخمة (كتب، أبحاث، عقود)
✅ Multi-document analysis والمقارنة
✅ Maintain very long conversation threads
✅ مشاريع تحتاج context كبير جداً

---

## 📚 **Prompt Engineering Techniques**

### Chapter 6: Thinking Step by Step (Precognition)
**الوصف:** تقنيات جعل Claude يفكر خطوة بخطوة لتحسين دقة الإجابات
**الملف:** `prompt-engineering/chapter-6-thinking-step-by-step.ipynb`
**النوع:** Jupyter Notebook تفاعلي مع أمثلة عملية

**المفهوم الأساسي:**
إعطاء Claude وقت للتفكير بصوت عالٍ قبل الإجابة يحسن الدقة بشكل كبير، خاصة في المهام المعقدة. التفكير يجب أن يكون ظاهر في الـ output، لا يمكن طلب التفكير ثم عرض الإجابة فقط.

**التقنيات المشروحة:**

**1. Thinking Out Loud:**
```python
PROMPT = """Is this review sentiment positive or negative?
First, write the best arguments for each side in <positive-argument>
and <negative-argument> XML tags, then answer.

This movie blew my mind with its freshness and originality.
In totally unrelated news, I have been living under a rock since 1900."""
```

Claude يحلل الحجج من الجانبين قبل اتخاذ القرار النهائي، مما يحسن فهم النصوص الساخرة والمعقدة.

**2. Brainstorming Pattern:**
```python
PROMPT = """Name a famous movie starring an actor who was born in 1956.
First brainstorm about some actors and their birth years in <brainstorm> tags,
then give your answer."""
```

يطلب من Claude التفكير في معلومات ذات صلة قبل الإجابة، مما يقلل الأخطاء الواقعية.

**3. Role Prompting Integration:**
```python
SYSTEM_PROMPT = "You are a savvy reader of movie reviews."
```

دمج role prompting مع thinking patterns يعزز فهم Claude للسياق.

**Key Insights:**

**Ordering Sensitivity:** Claude أحياناً يميل لاختيار الخيار الثاني من خيارين، ربما بسبب أنماط في training data. عند طلب تحليل positive vs negative، الترتيب يمكن أن يؤثر على النتيجة النهائية.

**Thinking Must Be Visible:** لا يمكن طلب التفكير دون عرضه في output. العبارة "think but don't show your work" لا تعمل لأن التفكير الفعلي يحدث فقط عند الكتابة.

**XML Tags for Structure:** استخدام XML tags مثل `<brainstorm>`, `<positive-argument>`, `<negative-argument>` يساعد في تنظيم التفكير واستخراج الأجزاء المختلفة برمجياً.

**Exercises Included:**

**Exercise 6.1 - Email Classification:** تصنيف الإيميلات إلى فئات محددة مع استخدام thinking patterns لتحسين الدقة. الفئات تشمل pre-sale questions, defective items, billing issues, other.

**Exercise 6.2 - Output Formatting:** استخدام تقنيات formatting لجعل Claude يخرج التصنيف في tags محددة مثل `<answer>B</answer>` للمعالجة البرمجية.

**Code Structure:**
- Setup cell مع Anthropic client initialization
- Helper function `get_completion()` مع دعم system prompts و prefill
- Multiple examples تظهر improvement من التفكير
- Grading system تلقائي باستخدام regex
- Example Playground للتجربة الحرة

**الاستخدامات المثالية:**
- Sentiment analysis للنصوص المعقدة أو الساخرة
- Factual questions التي تتطلب استرجاع معلومات دقيقة
- Classification tasks مع فئات متعددة
- Complex reasoning حيث الخطوات المتوسطة مهمة
- Reducing hallucinations بجعل Claude يتحقق من معلوماته
- Debugging Claude's mistakes بفهم مسار تفكيره

**مهم:**
- Temperature = 0.0 في الأمثلة للحصول على نتائج متسقة
- XML tags أسلوب مفضل لتنظيم التفكير
- System prompts تعزز فعالية thinking patterns
- Prefill يمكن استخدامه لبدء الإجابة بشكل معين

**When to Use Thinking:**
- مهام معقدة تتطلب تحليل متعدد الخطوات
- عندما Claude يعطي إجابات خاطئة مباشرة
- Classification مع خيارات متعددة أو غامضة
- فهم النصوص الساخرة أو المجازية
- Questions تحتاج fact-checking
- عندما تريد شفافية في reasoning process

### Multi-turn Conversations
**الوصف:** تقنيات إدارة المحادثات متعددة الأدوار مع Claude للحفاظ على السياق
**الملف:** `prompt-engineering/multi-turn-conversations.md`
**النوع:** دليل شامل مع أمثلة Python عملية

**المفهوم الأساسي:**
المحادثات متعددة الأدوار تسمح لـ Claude بالحفاظ على السياق عبر عدة exchanges بتمرير تاريخ المحادثة الكامل في messages array. كل turn يتضمن رسائل المستخدم والردود السابقة من Claude.

**Message Array Structure:**
```python
messages = [
    {"role": "user", "content": "Initial question"},
    {"role": "assistant", "content": "Claude's response"},
    {"role": "user", "content": "Follow-up question"},
    {"role": "assistant", "content": "Second response"},
    {"role": "user", "content": "Refinement request"}
]
```

**Key Patterns:**

**1. Iterative Refinement:**
```python
# Turn 1: Generate initial output
messages = [{"role": "user", "content": "Write ten words ending in 'ab'"}]
first_response = get_completion(messages)

# Turn 2: Refine with guard clause
messages.extend([
    {"role": "assistant", "content": first_response},
    {"role": "user", "content": "Find replacements for non-real words. If all are real, return original list."}
])
```

Guard clauses تمنع التعديلات غير الضرورية عندما يكون output صحيح بالفعل.

**2. Hardcoded Responses for Testing:**
```python
first_response = """Here are 10 words that end with 'ab':
1. Cab
2. Dab
3. Grab..."""

messages = [
    {"role": "user", "content": prompt},
    {"role": "assistant", "content": first_response},
    {"role": "user", "content": refinement}
]
```

يضمن سيناريوهات testing متسقة بتثبيت response معين.

**3. Prefill Continuation:**
```python
# First turn with prefill
messages = [
    {"role": "user", "content": "Extract names from text"},
    {"role": "assistant", "content": prefill}
]
first_response = get_completion(messages)

# Second turn - concatenate prefill with response
messages = [
    {"role": "user", "content": "Extract names from text"},
    {"role": "assistant", "content": prefill + "\n" + first_response},
    {"role": "user", "content": "Alphabetize the list"}
]
```

**4. Multi-step Data Processing:**
```python
# Pipeline pattern
"Extract dates..." → "Convert to ISO..." → "Sort chronologically..."
```

**ConversationManager Class:**
```python
class ConversationManager:
    def __init__(self, system_prompt=""):
        self.messages = []
        self.system_prompt = system_prompt

    def add_user_message(self, content):
        self.messages.append({"role": "user", "content": content})

    def get_response(self):
        response = get_completion(self.messages, self.system_prompt)
        self.messages.append({"role": "assistant", "content": response})
        return response

    def reset(self):
        self.messages = []
```

**Best Practices:**

**Always include full conversation history** في messages array لكل API call حتى لو كانت المحادثة طويلة.

**Alternate roles properly** - لا يمكن وجود رسالتين متتاليتين بنفس الـ role. يجب تبديل user/assistant/user.

**Use guard clauses** في follow-up prompts لتفادي تعديلات غير مرغوبة عندما يكون output صحيح.

**Monitor token usage** - المحادثات الطويلة تستهلك tokens بسرعة، استخدم context pruning عند الحاجة.

**Be specific in follow-ups** - تجنب "make it better" واستخدم تعليمات واضحة مثل "add error handling" أو "use more descriptive variables".

**Token Management:**
```python
total_tokens = 0
for turn in conversation:
    total_tokens += count_tokens(messages) + count_tokens(response)
    if total_tokens > limit:
        messages = prune_messages(messages)  # Remove oldest turns
```

**Use Cases:**

**Iterative refinement** لتحسين outputs تدريجياً عبر عدة turns.

**Data extraction pipelines** مثل extract → format → sort → filter.

**Creative collaboration** مع تعديلات متعددة على نصوص إبداعية.

**Classification and correction** حيث يصنف Claude ثم يصحح أخطاءه.

**Conversational applications** مثل chatbots و virtual assistants.

**Debugging workflows** حيث يشرح Claude خطواته ثم يصححها.

**When to Avoid:**

Simple one-shot queries لا تحتاج multi-turn overhead.

Independent batch processing حيث كل query مستقل.

Token budget constraints عند قيود صارمة على عدد الـ tokens.

Real-time applications حيث latency مهم جداً.

**Error Handling:**
```python
try:
    response = get_completion(messages)
    messages.append({"role": "assistant", "content": response})
except anthropic.APIError as e:
    # Handle retry logic or conversation reset
    pass
```

**Common Pitfalls:**

Forgetting to include previous turns في messages array.

Consecutive messages بنفس الـ role.

Not concatenating prefill مع responses في multi-turn.

Vague follow-up instructions مثل "improve this" بدون تحديد.

Ignoring token accumulation في محادثات طويلة.

**الاستخدامات المثالية:**
- بناء chatbots تفاعلية مع ذاكرة سياق
- Iterative code refinement مع تحسينات متعددة
- Data processing pipelines متعددة المراحل
- Creative writing collaboration مع تعديلات تدريجية
- Debugging و troubleshooting workflows
- Complex tasks تتطلب خطوات متعددة

**مهم:**
- كل API call يجب أن يحتوي تاريخ المحادثة الكامل
- الترتيب مهم: user ثم assistant ثم user...
- Prefill يجب concatenation مع response في الـ turn التالي
- استخدم explicit instructions وليس vague requests

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
