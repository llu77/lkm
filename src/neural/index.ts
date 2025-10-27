/**
 * Neural Network System - Main Entry Point
 *
 * Provides:
 * - Checkpointing: Save/restore training state
 * - Explainability: SHAP, LIME, Integrated Gradients
 * - Enhanced Hooks: Automatic checkpointing and explanations
 */

// Core managers
export { CheckpointManager } from './core/checkpoint-manager.js';
export { ExplainabilityAnalyzer } from './core/explainability-analyzer.js';
export type { ExplainableModel } from './core/explainability-analyzer.js';

// Import for internal use
import { CheckpointManager } from './core/checkpoint-manager.js';
import { ExplainabilityAnalyzer } from './core/explainability-analyzer.js';
import { registerEnhancedNeuralHooks } from './hooks/enhanced-neural-hooks.js';

// Types - Checkpointing
export type {
  Checkpoint,
  CheckpointConfig,
  CheckpointMetadata,
  CheckpointStorage,
  CheckpointEvent,
  ModelWeights,
  OptimizerState,
  TrainingState,
} from './types/checkpointing.js';

// Types - Explainability
export type {
  Explanation,
  ExplainabilityConfig,
  ExplainabilityResult,
  FeatureImportance,
  ShapValue,
  AttentionWeights,
  LayerActivation,
  DecisionPath,
  CounterfactualExample,
  ExplanationCache,
  ExplanationMetrics,
} from './types/explainability.js';

// Enhanced hooks
export {
  enhancedPreNeuralTrainHook,
  enhancedPostNeuralTrainHook,
  enhancedNeuralPredictionHook,
  checkpointRestoreHook,
  featureImportanceTrackingHook,
  registerEnhancedNeuralHooks,
  checkpointManager,
  explainabilityAnalyzer,
} from './hooks/enhanced-neural-hooks.js';

// Version
export const VERSION = '1.0.0';

// Quick setup function
export function setupNeuralSystem(config?: {
  checkpointing?: Partial<import('./types/checkpointing.js').CheckpointConfig>;
  explainability?: boolean;
}) {
  const checkpointMgr = new CheckpointManager(config?.checkpointing);
  const explainMgr = config?.explainability !== false
    ? new ExplainabilityAnalyzer()
    : null;

  registerEnhancedNeuralHooks();

  return {
    checkpointManager: checkpointMgr,
    explainabilityAnalyzer: explainMgr,
    version: VERSION,
  };
}
