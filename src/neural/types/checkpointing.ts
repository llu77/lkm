/**
 * Checkpointing types for neural network training
 * Enables saving and restoring training state
 */

export interface CheckpointMetadata {
  id: string;
  modelId: string;
  sessionId: string;
  epoch: number;
  step: number;
  accuracy: number;
  loss: number;
  timestamp: number;
  version: string;
  description?: string;
  tags?: string[];
}

export interface ModelWeights {
  [layerName: string]: {
    weights: number[][];
    biases?: number[];
    metadata?: Record<string, any>;
  };
}

export interface OptimizerState {
  type: string; // 'adam', 'sgd', 'rmsprop', etc.
  learningRate: number;
  momentum?: number;
  beta1?: number;
  beta2?: number;
  epsilon?: number;
  velocities?: ModelWeights;
  squared?: ModelWeights;
  firstMoment?: ModelWeights;
  secondMoment?: ModelWeights;
}

export interface TrainingState {
  epoch: number;
  step: number;
  totalSteps: number;
  batchSize: number;
  learningRate: number;
  loss: number;
  accuracy: number;
  validationLoss?: number;
  validationAccuracy?: number;
  bestAccuracy: number;
  bestEpoch: number;
  earlyStoppingCounter?: number;
  metrics?: Record<string, number>;
}

export interface Checkpoint {
  metadata: CheckpointMetadata;
  modelWeights: ModelWeights;
  optimizerState: OptimizerState;
  trainingState: TrainingState;
  randomState?: {
    seed: number;
    state: any;
  };
  hyperparameters?: Record<string, any>;
  architecture?: Record<string, any>;
}

export interface CheckpointConfig {
  strategy: 'best' | 'latest' | 'all' | 'interval';
  intervalEpochs?: number;
  maxCheckpoints?: number;
  saveOptimizer?: boolean;
  compressWeights?: boolean;
  autoRestore?: boolean;
}

export interface CheckpointStorage {
  save(checkpoint: Checkpoint): Promise<string>;
  load(checkpointId: string): Promise<Checkpoint | null>;
  list(modelId?: string): Promise<CheckpointMetadata[]>;
  delete(checkpointId: string): Promise<boolean>;
  deleteOldest(modelId: string, keep: number): Promise<number>;
  getLatest(modelId: string): Promise<Checkpoint | null>;
  getBest(modelId: string, metric?: string): Promise<Checkpoint | null>;
}

export interface CheckpointEvent {
  type: 'saved' | 'loaded' | 'deleted' | 'error';
  checkpoint?: CheckpointMetadata;
  error?: Error;
  timestamp: number;
}
