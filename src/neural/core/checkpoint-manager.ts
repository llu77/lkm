/**
 * Checkpoint Manager for Neural Network Training
 * Handles saving, loading, and managing model checkpoints
 */

import type {
  Checkpoint,
  CheckpointConfig,
  CheckpointMetadata,
  CheckpointStorage,
  CheckpointEvent,
  ModelWeights,
  OptimizerState,
  TrainingState,
} from '../types/checkpointing.js';

/**
 * In-memory checkpoint storage implementation
 */
class MemoryCheckpointStorage implements CheckpointStorage {
  private checkpoints = new Map<string, Checkpoint>();

  async save(checkpoint: Checkpoint): Promise<string> {
    const id = checkpoint.metadata.id;
    this.checkpoints.set(id, checkpoint);
    return id;
  }

  async load(checkpointId: string): Promise<Checkpoint | null> {
    return this.checkpoints.get(checkpointId) || null;
  }

  async list(modelId?: string): Promise<CheckpointMetadata[]> {
    const checkpoints = Array.from(this.checkpoints.values());
    const filtered = modelId
      ? checkpoints.filter((cp) => cp.metadata.modelId === modelId)
      : checkpoints;

    return filtered
      .map((cp) => cp.metadata)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async delete(checkpointId: string): Promise<boolean> {
    return this.checkpoints.delete(checkpointId);
  }

  async deleteOldest(modelId: string, keep: number): Promise<number> {
    const checkpoints = await this.list(modelId);
    const toDelete = checkpoints.slice(keep);

    let deleted = 0;
    for (const cp of toDelete) {
      if (await this.delete(cp.id)) {
        deleted++;
      }
    }

    return deleted;
  }

  async getLatest(modelId: string): Promise<Checkpoint | null> {
    const list = await this.list(modelId);
    if (list.length === 0) return null;

    const latest = list[0]; // Already sorted by timestamp desc
    return this.load(latest.id);
  }

  async getBest(modelId: string, metric = 'accuracy'): Promise<Checkpoint | null> {
    const checkpoints = Array.from(this.checkpoints.values())
      .filter((cp) => cp.metadata.modelId === modelId);

    if (checkpoints.length === 0) return null;

    const best = checkpoints.reduce((best, current) => {
      const bestMetric = best.trainingState[metric as keyof TrainingState] as number || 0;
      const currentMetric = current.trainingState[metric as keyof TrainingState] as number || 0;

      return currentMetric > bestMetric ? current : best;
    });

    return best;
  }
}

/**
 * LocalStorage-based checkpoint storage
 */
class LocalStorageCheckpointStorage implements CheckpointStorage {
  private prefix = 'neural:checkpoint:';

  private getKey(id: string): string {
    return `${this.prefix}${id}`;
  }

  private getIndexKey(): string {
    return `${this.prefix}index`;
  }

  private async getIndex(): Promise<CheckpointMetadata[]> {
    if (typeof localStorage === 'undefined') return [];

    const index = localStorage.getItem(this.getIndexKey());
    return index ? JSON.parse(index) : [];
  }

  private async updateIndex(metadata: CheckpointMetadata[]): Promise<void> {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(this.getIndexKey(), JSON.stringify(metadata));
  }

  async save(checkpoint: Checkpoint): Promise<string> {
    if (typeof localStorage === 'undefined') {
      throw new Error('LocalStorage not available');
    }

    const id = checkpoint.metadata.id;
    localStorage.setItem(this.getKey(id), JSON.stringify(checkpoint));

    const index = await this.getIndex();
    const existing = index.findIndex((m) => m.id === id);

    if (existing >= 0) {
      index[existing] = checkpoint.metadata;
    } else {
      index.push(checkpoint.metadata);
    }

    await this.updateIndex(index);
    return id;
  }

  async load(checkpointId: string): Promise<Checkpoint | null> {
    if (typeof localStorage === 'undefined') return null;

    const data = localStorage.getItem(this.getKey(checkpointId));
    return data ? JSON.parse(data) : null;
  }

  async list(modelId?: string): Promise<CheckpointMetadata[]> {
    const index = await this.getIndex();
    const filtered = modelId
      ? index.filter((m) => m.modelId === modelId)
      : index;

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  async delete(checkpointId: string): Promise<boolean> {
    if (typeof localStorage === 'undefined') return false;

    localStorage.removeItem(this.getKey(checkpointId));

    const index = await this.getIndex();
    const filtered = index.filter((m) => m.id !== checkpointId);
    await this.updateIndex(filtered);

    return true;
  }

  async deleteOldest(modelId: string, keep: number): Promise<number> {
    const checkpoints = await this.list(modelId);
    const toDelete = checkpoints.slice(keep);

    let deleted = 0;
    for (const cp of toDelete) {
      if (await this.delete(cp.id)) {
        deleted++;
      }
    }

    return deleted;
  }

  async getLatest(modelId: string): Promise<Checkpoint | null> {
    const list = await this.list(modelId);
    if (list.length === 0) return null;

    return this.load(list[0].id);
  }

  async getBest(modelId: string, metric = 'accuracy'): Promise<Checkpoint | null> {
    const list = await this.list(modelId);
    if (list.length === 0) return null;

    let best: CheckpointMetadata | null = null;
    let bestValue = -Infinity;

    for (const metadata of list) {
      const checkpoint = await this.load(metadata.id);
      if (!checkpoint) continue;

      const value = checkpoint.trainingState[metric as keyof TrainingState] as number || 0;
      if (value > bestValue) {
        bestValue = value;
        best = metadata;
      }
    }

    return best ? this.load(best.id) : null;
  }
}

/**
 * Main Checkpoint Manager
 */
export class CheckpointManager {
  private storage: CheckpointStorage;
  private config: CheckpointConfig;
  private listeners: Array<(event: CheckpointEvent) => void> = [];

  constructor(
    config: Partial<CheckpointConfig> = {},
    storage?: CheckpointStorage
  ) {
    this.config = {
      strategy: 'best',
      maxCheckpoints: 5,
      saveOptimizer: true,
      compressWeights: false,
      autoRestore: true,
      ...config,
    };

    this.storage = storage || (
      typeof localStorage !== 'undefined'
        ? new LocalStorageCheckpointStorage()
        : new MemoryCheckpointStorage()
    );
  }

  /**
   * Save a checkpoint
   */
  async save(
    modelId: string,
    modelWeights: ModelWeights,
    optimizerState: OptimizerState,
    trainingState: TrainingState,
    metadata: Partial<CheckpointMetadata> = {}
  ): Promise<string> {
    try {
      const id = `checkpoint_${modelId}_${Date.now()}`;

      const checkpoint: Checkpoint = {
        metadata: {
          id,
          modelId,
          sessionId: metadata.sessionId || 'default',
          epoch: trainingState.epoch,
          step: trainingState.step,
          accuracy: trainingState.accuracy,
          loss: trainingState.loss,
          timestamp: Date.now(),
          version: '1.0.0',
          ...metadata,
        },
        modelWeights: this.config.compressWeights
          ? this.compressWeights(modelWeights)
          : modelWeights,
        optimizerState: this.config.saveOptimizer
          ? optimizerState
          : this.stripOptimizerState(optimizerState),
        trainingState,
      };

      const checkpointId = await this.storage.save(checkpoint);

      // Clean up old checkpoints based on strategy
      await this.cleanupCheckpoints(modelId);

      this.emit({
        type: 'saved',
        checkpoint: checkpoint.metadata,
        timestamp: Date.now(),
      });

      return checkpointId;
    } catch (error) {
      this.emit({
        type: 'error',
        error: error as Error,
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Load a checkpoint by ID
   */
  async load(checkpointId: string): Promise<Checkpoint | null> {
    try {
      const checkpoint = await this.storage.load(checkpointId);

      if (checkpoint) {
        this.emit({
          type: 'loaded',
          checkpoint: checkpoint.metadata,
          timestamp: Date.now(),
        });
      }

      return checkpoint;
    } catch (error) {
      this.emit({
        type: 'error',
        error: error as Error,
        timestamp: Date.now(),
      });
      return null;
    }
  }

  /**
   * Load latest checkpoint for a model
   */
  async loadLatest(modelId: string): Promise<Checkpoint | null> {
    return this.storage.getLatest(modelId);
  }

  /**
   * Load best checkpoint for a model
   */
  async loadBest(modelId: string, metric = 'accuracy'): Promise<Checkpoint | null> {
    return this.storage.getBest(modelId, metric);
  }

  /**
   * List all checkpoints for a model
   */
  async listCheckpoints(modelId?: string): Promise<CheckpointMetadata[]> {
    return this.storage.list(modelId);
  }

  /**
   * Delete a checkpoint
   */
  async deleteCheckpoint(checkpointId: string): Promise<boolean> {
    const success = await this.storage.delete(checkpointId);

    if (success) {
      this.emit({
        type: 'deleted',
        timestamp: Date.now(),
      });
    }

    return success;
  }

  /**
   * Auto-save checkpoint based on strategy
   */
  async autoSave(
    modelId: string,
    modelWeights: ModelWeights,
    optimizerState: OptimizerState,
    trainingState: TrainingState,
    metadata: Partial<CheckpointMetadata> = {}
  ): Promise<string | null> {
    const { strategy, intervalEpochs } = this.config;

    // Check if we should save based on strategy
    let shouldSave = false;

    switch (strategy) {
      case 'all':
        shouldSave = true;
        break;

      case 'latest':
        shouldSave = true;
        break;

      case 'best':
        const best = await this.loadBest(modelId);
        shouldSave = !best || trainingState.accuracy > best.trainingState.accuracy;
        break;

      case 'interval':
        shouldSave = intervalEpochs
          ? trainingState.epoch % intervalEpochs === 0
          : false;
        break;
    }

    if (!shouldSave) {
      return null;
    }

    return this.save(
      modelId,
      modelWeights,
      optimizerState,
      trainingState,
      metadata
    );
  }

  /**
   * Restore training state from checkpoint
   */
  async restore(
    modelId: string,
    checkpointId?: string
  ): Promise<Checkpoint | null> {
    let checkpoint: Checkpoint | null = null;

    if (checkpointId) {
      checkpoint = await this.load(checkpointId);
    } else {
      // Load best by default
      checkpoint = await this.loadBest(modelId);
    }

    return checkpoint;
  }

  /**
   * Add event listener
   */
  on(listener: (event: CheckpointEvent) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove event listener
   */
  off(listener: (event: CheckpointEvent) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index >= 0) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get checkpoint statistics
   */
  async getStatistics(modelId: string): Promise<{
    total: number;
    latest?: CheckpointMetadata;
    best?: CheckpointMetadata;
    averageAccuracy: number;
    totalSize: number;
  }> {
    const checkpoints = await this.listCheckpoints(modelId);
    const latest = await this.storage.getLatest(modelId);
    const best = await this.storage.getBest(modelId);

    const totalAccuracy = checkpoints.reduce((sum, cp) => sum + cp.accuracy, 0);
    const averageAccuracy = checkpoints.length > 0
      ? totalAccuracy / checkpoints.length
      : 0;

    // Estimate size (rough approximation)
    const totalSize = checkpoints.length * 1024 * 1024; // 1MB per checkpoint estimate

    return {
      total: checkpoints.length,
      latest: latest?.metadata,
      best: best?.metadata,
      averageAccuracy,
      totalSize,
    };
  }

  private emit(event: CheckpointEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in checkpoint event listener:', error);
      }
    }
  }

  private async cleanupCheckpoints(modelId: string): Promise<void> {
    const { maxCheckpoints, strategy } = this.config;

    if (!maxCheckpoints || strategy === 'all') {
      return;
    }

    await this.storage.deleteOldest(modelId, maxCheckpoints);
  }

  private compressWeights(weights: ModelWeights): ModelWeights {
    // Simple compression: round to 4 decimal places
    const compressed: ModelWeights = {};

    for (const [layer, data] of Object.entries(weights)) {
      compressed[layer] = {
        weights: data.weights.map((row) =>
          row.map((val) => Math.round(val * 10000) / 10000)
        ),
        biases: data.biases?.map((val) => Math.round(val * 10000) / 10000),
        metadata: data.metadata,
      };
    }

    return compressed;
  }

  private stripOptimizerState(state: OptimizerState): OptimizerState {
    // Return minimal optimizer state (just type and LR)
    return {
      type: state.type,
      learningRate: state.learningRate,
    };
  }
}
