/**
 * Enhanced Neural Training Hooks with Checkpointing and Explainability
 * Integrates checkpoint management and model interpretability
 */

import { CheckpointManager } from '../core/checkpoint-manager.js';
import { ExplainabilityAnalyzer } from '../core/explainability-analyzer.js';
import type {
  ModelWeights,
  OptimizerState,
  TrainingState,
} from '../types/checkpointing.js';

// Mock hook manager for demonstration
const hookManager = {
  register: (hook: any) => {
    console.log(`Registered hook: ${hook.id}`);
  },
};

// Initialize managers
const checkpointManager = new CheckpointManager({
  strategy: 'best',
  maxCheckpoints: 10,
  saveOptimizer: true,
  intervalEpochs: 5,
});

const explainabilityAnalyzer = new ExplainabilityAnalyzer();

// ===== Enhanced Pre-Neural Train Hook =====

export const enhancedPreNeuralTrainHook = {
  id: 'enhanced-pre-neural-train',
  type: 'pre-neural-train' as const,
  priority: 100,

  handler: async (payload: any, context: any): Promise<any> => {
    const { modelId, operation } = payload;

    if (operation !== 'train') {
      return { continue: true };
    }

    const sideEffects: any[] = [];

    try {
      // Check if we should restore from checkpoint
      if (checkpointManager) {
        const checkpoint = await checkpointManager.loadBest(modelId);

        if (checkpoint) {
          sideEffects.push({
            type: 'log',
            action: 'write',
            data: {
              level: 'info',
              message: 'Restored training from checkpoint',
              data: {
                epoch: checkpoint.trainingState.epoch,
                accuracy: checkpoint.trainingState.accuracy,
                checkpointId: checkpoint.metadata.id,
              },
            },
          });

          // Resume from checkpoint
          return {
            continue: true,
            modified: true,
            payload: {
              ...payload,
              resumeFromCheckpoint: checkpoint,
              initialEpoch: checkpoint.trainingState.epoch,
              bestAccuracy: checkpoint.trainingState.bestAccuracy,
            },
            sideEffects,
          };
        }
      }
    } catch (error) {
      sideEffects.push({
        type: 'log',
        action: 'write',
        data: {
          level: 'warn',
          message: 'Failed to restore checkpoint',
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    return {
      continue: true,
      sideEffects,
    };
  },
};

// ===== Enhanced Post-Neural Train Hook =====

export const enhancedPostNeuralTrainHook = {
  id: 'enhanced-post-neural-train',
  type: 'post-neural-train' as const,
  priority: 100,

  handler: async (payload: any, context: any): Promise<any> => {
    const {
      modelId,
      accuracy,
      loss,
      epoch,
      step,
      modelWeights,
      optimizerState,
    } = payload;

    const sideEffects: any[] = [];

    try {
      // Save checkpoint
      if (checkpointManager && modelWeights && optimizerState) {
        const trainingState: TrainingState = {
          epoch: epoch || 0,
          step: step || 0,
          totalSteps: payload.totalSteps || 0,
          batchSize: payload.batchSize || 32,
          learningRate: optimizerState.learningRate || 0.001,
          loss: loss || 0,
          accuracy: accuracy || 0,
          bestAccuracy: payload.bestAccuracy || accuracy || 0,
          bestEpoch: payload.bestEpoch || epoch || 0,
        };

        const checkpointId = await checkpointManager.autoSave(
          modelId,
          modelWeights,
          optimizerState,
          trainingState,
          {
            sessionId: context.sessionId,
            description: `Training epoch ${epoch}`,
            tags: ['auto-save', `epoch-${epoch}`],
          }
        );

        if (checkpointId) {
          sideEffects.push({
            type: 'log',
            action: 'write',
            data: {
              level: 'info',
              message: 'Checkpoint saved',
              data: {
                checkpointId,
                epoch,
                accuracy,
                loss,
              },
            },
          });

          // Get checkpoint statistics
          const stats = await checkpointManager.getStatistics(modelId);
          sideEffects.push({
            type: 'metric',
            action: 'update',
            data: {
              name: `neural.checkpoints.${modelId}`,
              value: stats.total,
            },
          });
        }
      }
    } catch (error) {
      sideEffects.push({
        type: 'log',
        action: 'write',
        data: {
          level: 'error',
          message: 'Failed to save checkpoint',
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    return {
      continue: true,
      sideEffects,
    };
  },
};

// ===== Enhanced Neural Prediction Hook with Explainability =====

export const enhancedNeuralPredictionHook = {
  id: 'enhanced-neural-prediction',
  type: 'neural-prediction' as const,
  priority: 100,

  handler: async (payload: any, context: any): Promise<any> => {
    const { prediction, modelId, input, explainableModel } = payload;

    if (!prediction || !explainableModel) {
      return { continue: true };
    }

    const sideEffects: any[] = [];

    try {
      // Generate explanation for prediction
      const explanation = await explainabilityAnalyzer.explain(
        explainableModel,
        input,
        {
          method: 'shap',
          topK: 5,
          includeActivations: true,
          includeCounterfactuals: prediction.confidence < 0.7, // Only for low confidence
        }
      );

      // Add explanation to prediction
      const enhancedPrediction = {
        ...prediction,
        explanation: {
          topFeatures: explanation.explanation.featureImportances.slice(0, 5),
          confidence: explanation.explanation.confidence,
          method: explanation.explanation.method,
          decisionPath: explanation.decisionPath,
        },
      };

      // Log if low confidence with explanation
      if (prediction.confidence < 0.6) {
        sideEffects.push({
          type: 'log',
          action: 'write',
          data: {
            level: 'warn',
            message: 'Low confidence prediction with explanation',
            data: {
              confidence: prediction.confidence,
              topFeatures: enhancedPrediction.explanation.topFeatures,
              counterfactuals: explanation.counterfactuals?.length || 0,
            },
          },
        });
      }

      // Store explanation metrics
      const metrics = explainabilityAnalyzer.getMetrics();
      sideEffects.push({
        type: 'metric',
        action: 'update',
        data: {
          name: `neural.explainability.confidence.${modelId}`,
          value: metrics.averageConfidence,
        },
      });

      return {
        continue: true,
        modified: true,
        payload: {
          ...payload,
          prediction: enhancedPrediction,
          explainability: explanation,
        },
        sideEffects,
      };
    } catch (error) {
      sideEffects.push({
        type: 'log',
        action: 'write',
        data: {
          level: 'error',
          message: 'Failed to generate explanation',
          error: error instanceof Error ? error.message : String(error),
        },
      });

      return { continue: true, sideEffects };
    }
  },
};

// ===== Checkpoint Restore Hook =====

export const checkpointRestoreHook = {
  id: 'checkpoint-restore',
  type: 'pre-model-load' as const,
  priority: 100,

  handler: async (payload: any, context: any): Promise<any> => {
    const { modelId, restoreFromCheckpoint } = payload;

    if (!restoreFromCheckpoint) {
      return { continue: true };
    }

    const sideEffects: any[] = [];

    try {
      let checkpoint;

      if (typeof restoreFromCheckpoint === 'string') {
        // Load specific checkpoint by ID
        checkpoint = await checkpointManager.load(restoreFromCheckpoint);
      } else if (restoreFromCheckpoint === 'best') {
        // Load best checkpoint
        checkpoint = await checkpointManager.loadBest(modelId);
      } else {
        // Load latest checkpoint
        checkpoint = await checkpointManager.loadLatest(modelId);
      }

      if (checkpoint) {
        sideEffects.push({
          type: 'log',
          action: 'write',
          data: {
            level: 'info',
            message: 'Checkpoint loaded successfully',
            data: {
              checkpointId: checkpoint.metadata.id,
              epoch: checkpoint.trainingState.epoch,
              accuracy: checkpoint.trainingState.accuracy,
            },
          },
        });

        return {
          continue: true,
          modified: true,
          payload: {
            ...payload,
            checkpoint,
            modelWeights: checkpoint.modelWeights,
            optimizerState: checkpoint.optimizerState,
            trainingState: checkpoint.trainingState,
          },
          sideEffects,
        };
      } else {
        sideEffects.push({
          type: 'log',
          action: 'write',
          data: {
            level: 'warn',
            message: 'No checkpoint found for model',
            data: { modelId },
          },
        });
      }
    } catch (error) {
      sideEffects.push({
        type: 'log',
        action: 'write',
        data: {
          level: 'error',
          message: 'Failed to restore checkpoint',
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    return { continue: true, sideEffects };
  },
};

// ===== Feature Importance Tracking Hook =====

export const featureImportanceTrackingHook = {
  id: 'feature-importance-tracking',
  type: 'neural-pattern-detected' as const,
  priority: 95,

  handler: async (payload: any, context: any): Promise<any> => {
    const { patterns, modelId, explainableModel } = payload;

    if (!patterns || patterns.length === 0 || !explainableModel) {
      return { continue: true };
    }

    const sideEffects: any[] = [];

    try {
      // Analyze feature importance for each pattern
      for (const pattern of patterns) {
        if (pattern.confidence > 0.75 && pattern.context?.input) {
          const explanation = await explainabilityAnalyzer.explain(
            explainableModel,
            pattern.context.input,
            {
              method: 'shap',
              topK: 3,
            }
          );

          // Store pattern with feature importance
          sideEffects.push({
            type: 'memory',
            action: 'store',
            data: {
              key: `pattern:explained:${pattern.id}`,
              value: {
                pattern,
                topFeatures: explanation.explanation.featureImportances.slice(0, 3),
                confidence: explanation.explanation.confidence,
              },
              ttl: 0, // Permanent
            },
          });
        }
      }

      // Update global feature importance rankings
      const metrics = explainabilityAnalyzer.getMetrics();
      const topFeatures = Array.from(metrics.topFeatures.entries())
        .sort((a, b) => {
          const aVal = a[1] as number;
          const bVal = b[1] as number;
          return bVal - aVal;
        })
        .slice(0, 10);

      sideEffects.push({
        type: 'metric',
        action: 'update',
        data: {
          name: `neural.features.importance.${modelId}`,
          value: topFeatures,
        },
      });
    } catch (error) {
      sideEffects.push({
        type: 'log',
        action: 'write',
        data: {
          level: 'error',
          message: 'Failed to track feature importance',
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    return { continue: true, sideEffects };
  },
};

// ===== Register All Enhanced Hooks =====

export function registerEnhancedNeuralHooks(): void {
  hookManager.register(enhancedPreNeuralTrainHook);
  hookManager.register(enhancedPostNeuralTrainHook);
  hookManager.register(enhancedNeuralPredictionHook);
  hookManager.register(checkpointRestoreHook);
  hookManager.register(featureImportanceTrackingHook);

  console.log('Enhanced neural hooks registered successfully');
  console.log('- Checkpointing: Enabled');
  console.log('- Explainability: SHAP, Integrated Gradients, LIME');
  console.log('- Auto-save: Best model strategy');
  console.log('- Feature tracking: Enabled');
}

// Export managers for external use
export { checkpointManager, explainabilityAnalyzer };
