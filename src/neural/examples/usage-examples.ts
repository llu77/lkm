/**
 * Neural System Usage Examples
 * Demonstrates checkpointing and explainability features
 */

import {
  CheckpointManager,
  ExplainabilityAnalyzer,
  setupNeuralSystem,
} from '../index.js';
import type {
  ModelWeights,
  OptimizerState,
  TrainingState,
  ExplainableModel,
} from '../index.js';

// ==================== EXAMPLE 1: Basic Checkpointing ====================

export async function example1_BasicCheckpointing() {
  console.log('=== Example 1: Basic Checkpointing ===\n');

  // Create checkpoint manager
  const checkpointMgr = new CheckpointManager({
    strategy: 'best', // Only save best models
    maxCheckpoints: 5, // Keep last 5 checkpoints
    saveOptimizer: true,
  });

  // Mock training data
  const modelId = 'my-neural-model';
  const modelWeights: ModelWeights = {
    layer1: {
      weights: [[0.5, 0.3], [0.2, 0.8]],
      biases: [0.1, 0.2],
    },
    layer2: {
      weights: [[0.7, 0.4]],
      biases: [0.3],
    },
  };

  const optimizerState: OptimizerState = {
    type: 'adam',
    learningRate: 0.001,
    beta1: 0.9,
    beta2: 0.999,
  };

  const trainingState: TrainingState = {
    epoch: 10,
    step: 1000,
    totalSteps: 10000,
    batchSize: 32,
    learningRate: 0.001,
    loss: 0.25,
    accuracy: 0.89,
    bestAccuracy: 0.89,
    bestEpoch: 10,
  };

  // Save checkpoint
  const checkpointId = await checkpointMgr.save(
    modelId,
    modelWeights,
    optimizerState,
    trainingState,
    {
      sessionId: 'session-123',
      description: 'Best model after 10 epochs',
      tags: ['production', 'v1.0'],
    }
  );

  console.log('✅ Checkpoint saved:', checkpointId);

  // Load checkpoint
  const loadedCheckpoint = await checkpointMgr.load(checkpointId);
  console.log('✅ Checkpoint loaded:');
  console.log('   - Epoch:', loadedCheckpoint?.trainingState.epoch);
  console.log('   - Accuracy:', loadedCheckpoint?.trainingState.accuracy);

  // Get statistics
  const stats = await checkpointMgr.getStatistics(modelId);
  console.log('✅ Statistics:');
  console.log('   - Total checkpoints:', stats.total);
  console.log('   - Average accuracy:', stats.averageAccuracy);
  console.log();
}

// ==================== EXAMPLE 2: Auto-Save Strategy ====================

export async function example2_AutoSaveStrategy() {
  console.log('=== Example 2: Auto-Save Strategy ===\n');

  const checkpointMgr = new CheckpointManager({
    strategy: 'interval', // Save every N epochs
    intervalEpochs: 5,
    maxCheckpoints: 10,
  });

  const modelId = 'auto-save-model';

  // Simulate training loop
  for (let epoch = 1; epoch <= 20; epoch++) {
    const accuracy = 0.5 + epoch * 0.02; // Increasing accuracy
    const loss = 1.0 - epoch * 0.03; // Decreasing loss

    const trainingState: TrainingState = {
      epoch,
      step: epoch * 100,
      totalSteps: 2000,
      batchSize: 32,
      learningRate: 0.001,
      loss: Math.max(loss, 0.1),
      accuracy: Math.min(accuracy, 0.95),
      bestAccuracy: Math.min(accuracy, 0.95),
      bestEpoch: epoch,
    };

    // Auto-save will only save every 5 epochs
    const checkpointId = await checkpointMgr.autoSave(
      modelId,
      {} as ModelWeights,
      { type: 'adam', learningRate: 0.001 },
      trainingState
    );

    if (checkpointId) {
      console.log(`✅ Auto-saved at epoch ${epoch}: ${checkpointId}`);
    }
  }

  // List all checkpoints
  const checkpoints = await checkpointMgr.listCheckpoints(modelId);
  console.log(`\n📊 Total checkpoints saved: ${checkpoints.length}`);
  console.log();
}

// ==================== EXAMPLE 3: Checkpoint Restore ====================

export async function example3_CheckpointRestore() {
  console.log('=== Example 3: Checkpoint Restore ===\n');

  const checkpointMgr = new CheckpointManager({
    strategy: 'best',
    autoRestore: true,
  });

  const modelId = 'restore-model';

  // Save multiple checkpoints with different accuracies
  for (let i = 1; i <= 3; i++) {
    await checkpointMgr.save(
      modelId,
      {} as ModelWeights,
      { type: 'sgd', learningRate: 0.01 },
      {
        epoch: i,
        step: i * 100,
        totalSteps: 300,
        batchSize: 32,
        learningRate: 0.01,
        loss: 1.0 - i * 0.2,
        accuracy: 0.6 + i * 0.1,
        bestAccuracy: 0.6 + i * 0.1,
        bestEpoch: i,
      }
    );
  }

  // Restore best checkpoint
  const bestCheckpoint = await checkpointMgr.restore(modelId);
  console.log('✅ Restored best checkpoint:');
  console.log('   - Epoch:', bestCheckpoint?.trainingState.epoch);
  console.log('   - Accuracy:', bestCheckpoint?.trainingState.accuracy);
  console.log('   - Checkpoint ID:', bestCheckpoint?.metadata.id);
  console.log();
}

// ==================== EXAMPLE 4: Basic Explainability ====================

export async function example4_BasicExplainability() {
  console.log('=== Example 4: Basic Explainability ===\n');

  // Create mock model
  const model: ExplainableModel = {
    async predict(input: number[]): Promise<number> {
      // Simple linear model: sum of inputs
      return input.reduce((sum, val) => sum + val, 0) / input.length;
    },

    async predictBatch(inputs: number[][]): Promise<number[]> {
      const results = await Promise.all(inputs.map(i => this.predict(i)));
      return results.map(r => Array.isArray(r) ? r[0] : r);
    },

    getInputShape(): number[] {
      return [5]; // 5 features
    },

    getFeatureNames(): string[] {
      return ['feature_A', 'feature_B', 'feature_C', 'feature_D', 'feature_E'];
    },
  };

  // Create analyzer
  const analyzer = new ExplainabilityAnalyzer();

  // Input to explain
  const input = [0.8, 0.2, 0.6, 0.9, 0.3];

  // Generate explanation
  const result = await analyzer.explain(model, input, {
    method: 'shap',
    topK: 3,
  });

  console.log('✅ Prediction:', result.explanation.prediction);
  console.log('✅ Base value:', result.explanation.baseValue);
  console.log('✅ Confidence:', result.explanation.confidence.toFixed(3));
  console.log('\n📊 Top Feature Importances:');

  for (const fi of result.explanation.featureImportances) {
    console.log(
      `   ${fi.rank}. ${fi.featureName}: ${fi.importance.toFixed(4)} (${fi.confidence.toFixed(2)})`
    );
  }
  console.log();
}

// ==================== EXAMPLE 5: SHAP Values Explanation ====================

export async function example5_ShapValuesExplanation() {
  console.log('=== Example 5: SHAP Values Explanation ===\n');

  // Mock model with non-linear behavior
  const model: ExplainableModel = {
    async predict(input: number[]): Promise<number> {
      // Non-linear: x1^2 + 2*x2 - x3
      return input[0] ** 2 + 2 * input[1] - input[2];
    },

    async predictBatch(inputs: number[][]): Promise<number[]> {
      const results = await Promise.all(inputs.map(i => this.predict(i)));
      return results.map(r => Array.isArray(r) ? r[0] : r);
    },

    getInputShape(): number[] {
      return [3];
    },

    getFeatureNames(): string[] {
      return ['x1', 'x2', 'x3'];
    },
  };

  const analyzer = new ExplainabilityAnalyzer();
  const input = [2, 3, 1]; // Expected output: 2^2 + 2*3 - 1 = 9

  const result = await analyzer.explain(model, input, {
    method: 'shap',
    numSamples: 200,
    topK: 3,
  });

  console.log('✅ Prediction:', result.explanation.prediction);
  console.log('\n📊 SHAP Values:');

  for (const shap of result.explanation.shapValues) {
    console.log(`   ${shap.featureName}:`);
    console.log(`      Value: ${shap.featureValue}`);
    console.log(`      SHAP: ${shap.shapValue.toFixed(4)}`);
    console.log(`      Contribution: ${shap.percentageContribution.toFixed(2)}%`);
  }
  console.log();
}

// ==================== EXAMPLE 6: Integrated System ====================

export async function example6_IntegratedSystem() {
  console.log('=== Example 6: Integrated System Setup ===\n');

  // Quick setup with default config
  const system = setupNeuralSystem({
    checkpointing: {
      strategy: 'best',
      maxCheckpoints: 5,
    },
    explainability: true,
  });

  console.log('✅ Neural System initialized');
  console.log('   - Version:', system.version);
  console.log('   - Checkpointing: Enabled');
  console.log('   - Explainability: Enabled');

  // Use the managers
  const modelId = 'integrated-model';

  // Save a checkpoint
  await system.checkpointManager.save(
    modelId,
    {} as ModelWeights,
    { type: 'adam', learningRate: 0.001 },
    {
      epoch: 5,
      step: 500,
      totalSteps: 1000,
      batchSize: 32,
      learningRate: 0.001,
      loss: 0.3,
      accuracy: 0.85,
      bestAccuracy: 0.85,
      bestEpoch: 5,
    }
  );

  console.log('✅ Checkpoint saved');

  // Generate explanation
  const mockModel: ExplainableModel = {
    predict: async (input) => input[0] + input[1],
    predictBatch: async (inputs) => inputs.map(i => i[0] + i[1]),
    getInputShape: () => [2],
    getFeatureNames: () => ['A', 'B'],
  };

  if (system.explainabilityAnalyzer) {
    const explanation = await system.explainabilityAnalyzer.explain(
      mockModel,
      [0.5, 0.3]
    );
    console.log('✅ Explanation generated');
    console.log('   - Confidence:', explanation.explanation.confidence.toFixed(3));
  }

  console.log();
}

// ==================== Run All Examples ====================

export async function runAllExamples() {
  console.log('\n🚀 Neural System Examples\n');
  console.log('=' .repeat(60) + '\n');

  await example1_BasicCheckpointing();
  await example2_AutoSaveStrategy();
  await example3_CheckpointRestore();
  await example4_BasicExplainability();
  await example5_ShapValuesExplanation();
  await example6_IntegratedSystem();

  console.log('=' .repeat(60));
  console.log('\n✅ All examples completed!\n');
}

// Export for manual execution
// Run with: import { runAllExamples } from './usage-examples';
// await runAllExamples();
