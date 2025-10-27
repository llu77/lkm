# Neural Network System

نظام متقدم للشبكات العصبية يوفر **Checkpointing** و **Explainability** للتدريب والتنبؤ.

## ✨ المميزات

### 1️⃣ **Checkpointing System**
- ✅ حفظ/استعادة حالة التدريب تلقائياً
- ✅ استراتيجيات متعددة: `best`, `latest`, `all`, `interval`
- ✅ تخزين الأوزان وحالة Optimizer
- ✅ إدارة ذكية للنقاط القديمة
- ✅ دعم LocalStorage أو Memory
- ✅ ضغط الأوزان اختياري

### 2️⃣ **Explainability System**
- ✅ SHAP Values (Shapley Additive Explanations)
- ✅ Integrated Gradients
- ✅ LIME (Local Interpretable Model-agnostic Explanations)
- ✅ Attention Weights Analysis
- ✅ Feature Importance Ranking
- ✅ Counterfactual Examples
- ✅ Decision Path Visualization
- ✅ Layer Activation Analysis

## 📦 التثبيت

```typescript
import { setupNeuralSystem } from './neural';

const system = setupNeuralSystem({
  checkpointing: {
    strategy: 'best',
    maxCheckpoints: 10,
  },
  explainability: true,
});
```

## 🚀 الاستخدام

### مثال 1: Checkpointing

```typescript
import { CheckpointManager } from './neural';

const checkpointMgr = new CheckpointManager({
  strategy: 'best',
  maxCheckpoints: 5,
  saveOptimizer: true,
});

// حفظ checkpoint
const checkpointId = await checkpointMgr.save(
  'my-model',
  modelWeights,
  optimizerState,
  trainingState
);

// استعادة أفضل checkpoint
const checkpoint = await checkpointMgr.loadBest('my-model');

// حفظ تلقائي
await checkpointMgr.autoSave(
  'my-model',
  modelWeights,
  optimizerState,
  trainingState
);
```

### مثال 2: Explainability

```typescript
import { ExplainabilityAnalyzer } from './neural';

const analyzer = new ExplainabilityAnalyzer();

// شرح التنبؤ
const result = await analyzer.explain(model, input, {
  method: 'shap',
  topK: 5,
  includeAttention: true,
  includeCounterfactuals: true,
});

// عرض Feature Importance
for (const feature of result.explanation.featureImportances) {
  console.log(`${feature.featureName}: ${feature.importance}`);
}
```

### مثال 3: Enhanced Hooks

```typescript
import { registerEnhancedNeuralHooks } from './neural';

// تسجيل الـ hooks المحسّنة
registerEnhancedNeuralHooks();

// الآن الـ hooks ستعمل تلقائياً:
// - حفظ checkpoints بعد كل epoch
// - استعادة من آخر checkpoint
// - إضافة explanations للتنبؤات
// - تتبع Feature Importance
```

## 📊 الأنواع الرئيسية

### Checkpoint

```typescript
interface Checkpoint {
  metadata: CheckpointMetadata;
  modelWeights: ModelWeights;
  optimizerState: OptimizerState;
  trainingState: TrainingState;
}
```

### Explanation

```typescript
interface Explanation {
  predictionId: string;
  modelId: string;
  prediction: number | number[];
  shapValues: ShapValue[];
  featureImportances: FeatureImportance[];
  confidence: number;
  method: 'shap' | 'lime' | 'integrated-gradients';
}
```

### ExplainableModel

```typescript
interface ExplainableModel {
  predict(input: any): Promise<number | number[]>;
  predictBatch(inputs: any[]): Promise<Array<number | number[]>>;
  getGradients?(input: any): Promise<number[]>;
  getAttentionWeights?(input: any): Promise<AttentionWeights[]>;
  getFeatureNames?(): string[];
}
```

## 🎯 استراتيجيات Checkpointing

| Strategy | الوصف |
|----------|-------|
| `best` | حفظ أفضل نموذج فقط (أعلى accuracy) |
| `latest` | حفظ آخر نموذج فقط |
| `all` | حفظ كل النماذج |
| `interval` | حفظ كل N epochs |

## 🔍 طرق Explainability

| Method | الوصف | السرعة | الدقة |
|--------|-------|--------|-------|
| **SHAP** | Shapley values من نظرية الألعاب | ⚠️ بطيء | ⭐⭐⭐ عالية |
| **Integrated Gradients** | تكامل التدرجات على مسار | ⚡ سريع | ⭐⭐ متوسطة |
| **LIME** | نماذج خطية محلية | ⚡⚡ سريع جداً | ⭐ منخفضة |
| **Attention** | أوزان الانتباه (للـ Transformers) | ⚡⚡⚡ فوري | ⭐⭐⭐ عالية |

## 📈 المقاييس

### Checkpoint Statistics

```typescript
const stats = await checkpointMgr.getStatistics('my-model');
console.log(stats);
// {
//   total: 5,
//   latest: { id: '...', accuracy: 0.89 },
//   best: { id: '...', accuracy: 0.92 },
//   averageAccuracy: 0.85,
//   totalSize: 5242880
// }
```

### Explainability Metrics

```typescript
const metrics = analyzer.getMetrics();
console.log(metrics);
// {
//   totalExplanations: 100,
//   averageConfidence: 0.87,
//   topFeatures: Map { 'feature_A' => 45.2, ... },
//   methodUsage: Map { 'shap' => 60, 'lime' => 40 },
//   averageProcessingTime: 150
// }
```

## 🔧 التكوين المتقدم

```typescript
const checkpointMgr = new CheckpointManager({
  strategy: 'best',
  maxCheckpoints: 10,
  saveOptimizer: true,      // حفظ حالة Optimizer
  compressWeights: true,    // ضغط الأوزان
  autoRestore: true,        // استعادة تلقائية
  intervalEpochs: 5,        // للـ interval strategy
});

const analyzer = new ExplainabilityAnalyzer(customCache);
```

## 📁 هيكل المجلدات

```
src/neural/
├── core/
│   ├── checkpoint-manager.ts      # مدير Checkpoints
│   └── explainability-analyzer.ts # محلل Explainability
├── types/
│   ├── checkpointing.ts           # أنواع Checkpointing
│   └── explainability.ts          # أنواع Explainability
├── hooks/
│   └── enhanced-neural-hooks.ts   # Hooks محسّنة
├── examples/
│   └── usage-examples.ts          # أمثلة الاستخدام
├── index.ts                       # نقطة الدخول
└── README.md                      # هذا الملف
```

## 🧪 تشغيل الأمثلة

```bash
# تشغيل جميع الأمثلة
ts-node src/neural/examples/usage-examples.ts

# أو استيراد مثال محدد
import { example1_BasicCheckpointing } from './neural/examples/usage-examples';
await example1_BasicCheckpointing();
```

## 🎓 حالات الاستخدام

### 1. التدريب الطويل
```typescript
// حفظ تلقائي كل 10 epochs
const checkpointMgr = new CheckpointManager({
  strategy: 'interval',
  intervalEpochs: 10,
});

for (let epoch = 0; epoch < 100; epoch++) {
  // تدريب...
  await checkpointMgr.autoSave(modelId, weights, optimizer, state);
}
```

### 2. تصحيح الأخطاء
```typescript
// شرح التنبؤات الخاطئة
if (prediction !== expectedOutput) {
  const explanation = await analyzer.explain(model, input, {
    method: 'shap',
    includeCounterfactuals: true,
  });

  console.log('Top contributing features:',
    explanation.explanation.featureImportances);
}
```

### 3. النماذج في الإنتاج
```typescript
// استعادة أفضل نموذج
const checkpoint = await checkpointMgr.loadBest('production-model');
model.loadWeights(checkpoint.modelWeights);

// شرح كل تنبؤ
const result = await analyzer.explain(model, userInput, {
  method: 'shap',
  topK: 3,
});
```

## 🔗 الدمج مع الأنظمة الأخرى

```typescript
// الدمج مع MemoryCache
import { MemoryCache } from '../cache/memory-cache';

const cache = new MemoryCache(1024 * 1024, logger);
const checkpointMgr = new CheckpointManager(
  { strategy: 'best' },
  customStorageWithCache
);

// الدمج مع NeuralInit
import { NeuralInit } from '../init/neural-init';

const neuralInit = new NeuralInit();
await neuralInit.initialize({
  checkpointManager,
  explainabilityAnalyzer: analyzer,
  // ... config أخرى
});
```

## 📚 مراجع

- [SHAP Paper](https://arxiv.org/abs/1705.07874)
- [Integrated Gradients](https://arxiv.org/abs/1703.01365)
- [LIME](https://arxiv.org/abs/1602.04938)

## 🤝 المساهمة

نرحب بالمساهمات! انظر [CONTRIBUTING.md](../../CONTRIBUTING.md)

## 📄 الترخيص

MIT License - انظر [LICENSE](../../LICENSE)

---

**🧠 Powered by Advanced Neural Systems** | Version 1.0.0
