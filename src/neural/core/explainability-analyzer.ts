/**
 * Explainability Analyzer for Neural Networks
 * Provides SHAP-like feature importance and model interpretability
 */

import type {
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
} from '../types/explainability.js';

/**
 * Simple in-memory cache for explanations
 */
class MemoryExplanationCache implements ExplanationCache {
  private cache = new Map<string, ExplainabilityResult>();
  private maxSize = 1000;

  async get(predictionId: string): Promise<ExplainabilityResult | null> {
    return this.cache.get(predictionId) || null;
  }

  async set(predictionId: string, result: ExplainabilityResult): Promise<void> {
    // Simple LRU: remove oldest if full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(predictionId, result);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

/**
 * Model interface for getting predictions and gradients
 */
export interface ExplainableModel {
  predict(input: any): Promise<number | number[]>;
  predictBatch(inputs: any[]): Promise<Array<number | number[]>>;
  getGradients?(input: any, outputIndex?: number): Promise<number[]>;
  getLayerActivations?(input: any): Promise<LayerActivation[]>;
  getAttentionWeights?(input: any): Promise<AttentionWeights[]>;
  getInputShape(): number[];
  getFeatureNames?(): string[];
}

/**
 * Main Explainability Analyzer
 */
export class ExplainabilityAnalyzer {
  private cache: ExplanationCache;
  private metrics: ExplanationMetrics = {
    totalExplanations: 0,
    averageConfidence: 0,
    topFeatures: new Map(),
    methodUsage: new Map(),
    averageProcessingTime: 0,
  };

  constructor(cache?: ExplanationCache) {
    this.cache = cache || new MemoryExplanationCache();
  }

  /**
   * Explain a prediction using configured method(s)
   */
  async explain(
    model: ExplainableModel,
    input: any,
    config: Partial<ExplainabilityConfig> = {}
  ): Promise<ExplainabilityResult> {
    const startTime = Date.now();
    const predictionId = `pred_${Date.now()}_${Math.random()}`;

    // Check cache first
    const cached = await this.cache.get(predictionId);
    if (cached) return cached;

    const fullConfig: ExplainabilityConfig = {
      method: 'shap',
      numSamples: 100,
      topK: 10,
      includeAttention: false,
      includeActivations: false,
      includeCounterfactuals: false,
      ...config,
    };

    // Get prediction
    const prediction = await model.predict(input);

    // Generate explanation based on method
    const explanation = await this.generateExplanation(
      model,
      input,
      prediction,
      fullConfig
    );

    explanation.predictionId = predictionId;

    // Build result
    const result: ExplainabilityResult = {
      explanation,
    };

    // Add attention weights if requested
    if (fullConfig.includeAttention && model.getAttentionWeights) {
      result.attentionWeights = await model.getAttentionWeights(input);
    }

    // Add layer activations if requested
    if (fullConfig.includeActivations && model.getLayerActivations) {
      result.layerActivations = await model.getLayerActivations(input);
    }

    // Add decision path
    if (result.layerActivations) {
      result.decisionPath = this.extractDecisionPath(result.layerActivations);
    }

    // Generate counterfactuals if requested
    if (fullConfig.includeCounterfactuals) {
      result.counterfactuals = await this.generateCounterfactuals(
        model,
        input,
        prediction,
        3 // Generate 3 counterfactuals
      );
    }

    // Cache result
    await this.cache.set(predictionId, result);

    // Update metrics
    const processingTime = Date.now() - startTime;
    this.updateMetrics(explanation, processingTime);

    return result;
  }

  /**
   * Generate explanation using specified method
   */
  private async generateExplanation(
    model: ExplainableModel,
    input: any,
    prediction: number | number[],
    config: ExplainabilityConfig
  ): Promise<Explanation> {
    const baseValue = await this.computeBaseValue(model, config.baseline);

    let shapValues: ShapValue[] = [];
    let method: Explanation['method'] = 'shap';

    switch (config.method) {
      case 'shap':
        shapValues = await this.computeSHAP(model, input, baseValue, config);
        method = 'shap';
        break;

      case 'integrated-gradients':
        shapValues = await this.computeIntegratedGradients(
          model,
          input,
          baseValue,
          config
        );
        method = 'integrated-gradients';
        break;

      case 'lime':
        shapValues = await this.computeLIME(model, input, config);
        method = 'lime';
        break;

      case 'attention':
        if (model.getAttentionWeights) {
          const attention = await model.getAttentionWeights(input);
          shapValues = this.attentionToShapValues(attention, input);
          method = 'attention';
        } else {
          // Fallback to SHAP
          shapValues = await this.computeSHAP(model, input, baseValue, config);
          method = 'shap';
        }
        break;

      case 'all':
        // Combine multiple methods
        const shapResult = await this.computeSHAP(model, input, baseValue, config);
        shapValues = shapResult;
        method = 'shap';
        break;
    }

    // Sort by absolute SHAP value
    shapValues.sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue));

    // Keep only top K
    if (config.topK) {
      shapValues = shapValues.slice(0, config.topK);
    }

    // Convert to feature importances
    const featureImportances = this.shapToFeatureImportance(shapValues);

    // Calculate confidence based on feature importance consistency
    const confidence = this.calculateExplanationConfidence(shapValues);

    return {
      predictionId: '',
      modelId: 'unknown',
      input,
      output: prediction,
      prediction: Array.isArray(prediction) ? prediction : [prediction],
      baseValue,
      shapValues,
      featureImportances,
      confidence,
      timestamp: Date.now(),
      method,
    };
  }

  /**
   * Compute SHAP values using sampling
   */
  private async computeSHAP(
    model: ExplainableModel,
    input: any,
    baseValue: number,
    config: ExplainabilityConfig
  ): Promise<ShapValue[]> {
    const numSamples = config.numSamples || 100;
    const featureNames = model.getFeatureNames?.() || [];
    const inputArray = this.inputToArray(input);

    const shapValues: ShapValue[] = [];

    // For each feature, compute marginal contribution
    for (let i = 0; i < inputArray.length; i++) {
      const contributions: number[] = [];

      // Sample random coalitions
      for (let s = 0; s < numSamples; s++) {
        // Random coalition (subset of features)
        const coalition = this.randomCoalition(inputArray.length, i);

        // Prediction with feature i
        const withFeature = await this.predictWithCoalition(
          model,
          inputArray,
          coalition,
          true,
          i,
          baseValue
        );

        // Prediction without feature i
        const withoutFeature = await this.predictWithCoalition(
          model,
          inputArray,
          coalition,
          false,
          i,
          baseValue
        );

        contributions.push(withFeature - withoutFeature);
      }

      // Average contribution
      const shapValue =
        contributions.reduce((a, b) => a + b, 0) / contributions.length;

      const totalContribution = Math.abs(shapValue);
      const percentageContribution = totalContribution / (Math.abs(baseValue) + 0.0001);

      shapValues.push({
        featureName: featureNames[i] || `feature_${i}`,
        featureIndex: i,
        baseValue,
        shapValue,
        featureValue: inputArray[i],
        percentageContribution: Math.min(percentageContribution * 100, 100),
      });
    }

    return shapValues;
  }

  /**
   * Compute Integrated Gradients
   */
  private async computeIntegratedGradients(
    model: ExplainableModel,
    input: any,
    baseValue: number,
    config: ExplainabilityConfig
  ): Promise<ShapValue[]> {
    if (!model.getGradients) {
      // Fallback to SHAP if gradients not available
      return this.computeSHAP(model, input, baseValue, config);
    }

    const numSteps = config.numSamples || 50;
    const inputArray = this.inputToArray(input);
    const baseline = config.baseline
      ? this.inputToArray(config.baseline)
      : new Array(inputArray.length).fill(0);

    const featureNames = model.getFeatureNames?.() || [];
    const integratedGrads = new Array(inputArray.length).fill(0);

    // Integrate gradients along path from baseline to input
    for (let step = 0; step <= numSteps; step++) {
      const alpha = step / numSteps;
      const interpolated = baseline.map((b, i) => b + alpha * (inputArray[i] - b));

      const grads = await model.getGradients(interpolated);

      for (let i = 0; i < grads.length; i++) {
        integratedGrads[i] += grads[i];
      }
    }

    // Average and multiply by input difference
    const shapValues: ShapValue[] = integratedGrads.map((grad, i) => {
      const avgGrad = grad / (numSteps + 1);
      const shapValue = (inputArray[i] - baseline[i]) * avgGrad;
      const percentageContribution =
        (Math.abs(shapValue) / (Math.abs(baseValue) + 0.0001)) * 100;

      return {
        featureName: featureNames[i] || `feature_${i}`,
        featureIndex: i,
        baseValue,
        shapValue,
        featureValue: inputArray[i],
        percentageContribution: Math.min(percentageContribution, 100),
      };
    });

    return shapValues;
  }

  /**
   * Compute LIME-style explanations
   */
  private async computeLIME(
    model: ExplainableModel,
    input: any,
    config: ExplainabilityConfig
  ): Promise<ShapValue[]> {
    const numSamples = config.numSamples || 100;
    const inputArray = this.inputToArray(input);
    const featureNames = model.getFeatureNames?.() || [];

    // Generate perturbed samples around input
    const samples: any[] = [];
    const predictions: number[] = [];

    for (let i = 0; i < numSamples; i++) {
      const perturbed = this.perturbInput(inputArray, 0.1); // 10% noise
      samples.push(perturbed);

      const pred = await model.predict(perturbed);
      predictions.push(Array.isArray(pred) ? pred[0] : pred);
    }

    // Fit linear model (simplified - just correlation)
    const importances = new Array(inputArray.length).fill(0);

    for (let i = 0; i < inputArray.length; i++) {
      const featureValues = samples.map((s) => s[i]);
      importances[i] = this.correlation(featureValues, predictions);
    }

    const baseValue = predictions.reduce((a, b) => a + b, 0) / predictions.length;

    return importances.map((importance, i) => ({
      featureName: featureNames[i] || `feature_${i}`,
      featureIndex: i,
      baseValue,
      shapValue: importance,
      featureValue: inputArray[i],
      percentageContribution: (Math.abs(importance) / (Math.abs(baseValue) + 0.0001)) * 100,
    }));
  }

  /**
   * Convert attention weights to SHAP values
   */
  private attentionToShapValues(
    attentionWeights: AttentionWeights[],
    input: any
  ): ShapValue[] {
    if (attentionWeights.length === 0) return [];

    // Use average attention across all heads and layers
    const avgAttention = attentionWeights[0].weights;
    const inputArray = this.inputToArray(input);

    return avgAttention[0].map((weight, i) => ({
      featureName: `token_${i}`,
      featureIndex: i,
      baseValue: 1.0 / avgAttention[0].length, // Uniform baseline
      shapValue: weight - 1.0 / avgAttention[0].length,
      featureValue: inputArray[i] || i,
      percentageContribution: weight * 100,
    }));
  }

  /**
   * Convert SHAP values to feature importances
   */
  private shapToFeatureImportance(shapValues: ShapValue[]): FeatureImportance[] {
    return shapValues.map((shap, rank) => ({
      featureName: shap.featureName,
      featureIndex: shap.featureIndex,
      importance: shap.shapValue,
      confidence: Math.min(shap.percentageContribution / 100, 1.0),
      rank: rank + 1,
    }));
  }

  /**
   * Calculate explanation confidence
   */
  private calculateExplanationConfidence(shapValues: ShapValue[]): number {
    if (shapValues.length === 0) return 0;

    // Confidence based on how concentrated the importance is
    const totalImportance = shapValues.reduce(
      (sum, s) => sum + Math.abs(s.shapValue),
      0
    );

    const topImportance = shapValues
      .slice(0, 3)
      .reduce((sum, s) => sum + Math.abs(s.shapValue), 0);

    return Math.min(topImportance / (totalImportance + 0.0001), 1.0);
  }

  /**
   * Extract decision path from layer activations
   */
  private extractDecisionPath(activations: LayerActivation[]): DecisionPath {
    const layers = activations.map((layer) => {
      // Find top 5 most activated neurons
      const indexed = layer.activations.map((val, idx) => ({ idx, val }));
      indexed.sort((a, b) => Math.abs(b.val) - Math.abs(a.val));

      const topNeurons = indexed.slice(0, 5).map((item) => ({
        index: item.idx,
        activation: item.val,
        contribution: Math.abs(item.val) / (layer.statistics.max + 0.0001),
      }));

      return {
        layerName: layer.layerName,
        topNeurons,
      };
    });

    const totalPathStrength = layers.reduce((sum, layer) => {
      const layerStrength = layer.topNeurons.reduce(
        (s, n) => s + n.contribution,
        0
      );
      return sum + layerStrength;
    }, 0);

    return { layers, totalPathStrength };
  }

  /**
   * Generate counterfactual examples
   */
  private async generateCounterfactuals(
    model: ExplainableModel,
    input: any,
    originalPrediction: number | number[],
    numCounterfactuals: number
  ): Promise<CounterfactualExample[]> {
    const inputArray = this.inputToArray(input);
    const originalPred = Array.isArray(originalPrediction)
      ? originalPrediction[0]
      : originalPrediction;

    const counterfactuals: CounterfactualExample[] = [];

    for (let i = 0; i < numCounterfactuals; i++) {
      // Perturb input to find counterfactual
      let bestCounterfactual = inputArray;
      let bestDifference = 0;
      let minDistance = Infinity;

      for (let attempt = 0; attempt < 50; attempt++) {
        const perturbed = this.perturbInput(inputArray, 0.2 + i * 0.1);
        const pred = await model.predict(perturbed);
        const predValue = Array.isArray(pred) ? pred[0] : pred;

        const difference = Math.abs(predValue - originalPred);
        const distance = this.euclideanDistance(inputArray, perturbed);

        // Want high difference in prediction with low distance
        if (difference > 0.1 && distance < minDistance) {
          bestCounterfactual = perturbed;
          bestDifference = predValue;
          minDistance = distance;
        }
      }

      if (bestDifference !== 0) {
        const changes = inputArray
          .map((val, idx) => ({
            feature: `feature_${idx}`,
            originalValue: val,
            newValue: bestCounterfactual[idx],
            impact: Math.abs(bestCounterfactual[idx] - val),
          }))
          .filter((c) => c.impact > 0.01)
          .sort((a, b) => b.impact - a.impact)
          .slice(0, 5);

        counterfactuals.push({
          original: input,
          counterfactual: bestCounterfactual,
          changes,
          originalPrediction: originalPred,
          newPrediction: bestDifference,
          distance: minDistance,
        });
      }
    }

    return counterfactuals;
  }

  /**
   * Helper: Compute base value (expected prediction)
   */
  private async computeBaseValue(
    model: ExplainableModel,
    baseline?: any
  ): Promise<number> {
    if (baseline) {
      const pred = await model.predict(baseline);
      return Array.isArray(pred) ? pred[0] : pred;
    }

    // Default baseline: zero input
    const shape = model.getInputShape();
    const zeroInput = new Array(shape[0]).fill(0);
    const pred = await model.predict(zeroInput);

    return Array.isArray(pred) ? pred[0] : pred;
  }

  /**
   * Helper: Convert input to array
   */
  private inputToArray(input: any): number[] {
    if (Array.isArray(input)) return input;
    if (typeof input === 'number') return [input];
    if (typeof input === 'object') return Object.values(input);
    return [0];
  }

  /**
   * Helper: Create random coalition
   */
  private randomCoalition(size: number, excludeIndex?: number): Set<number> {
    const coalition = new Set<number>();

    for (let i = 0; i < size; i++) {
      if (i !== excludeIndex && Math.random() > 0.5) {
        coalition.add(i);
      }
    }

    return coalition;
  }

  /**
   * Helper: Predict with coalition
   */
  private async predictWithCoalition(
    model: ExplainableModel,
    input: number[],
    coalition: Set<number>,
    includeFeature: boolean,
    featureIndex: number,
    baseline: number
  ): Promise<number> {
    const masked = input.map((val, i) => {
      if (i === featureIndex) {
        return includeFeature ? val : baseline;
      }
      return coalition.has(i) ? val : baseline;
    });

    const pred = await model.predict(masked);
    return Array.isArray(pred) ? pred[0] : pred;
  }

  /**
   * Helper: Perturb input
   */
  private perturbInput(input: number[], noiseLevel: number): number[] {
    return input.map((val) => {
      const noise = (Math.random() - 0.5) * 2 * noiseLevel;
      return val + noise * Math.abs(val);
    });
  }

  /**
   * Helper: Calculate correlation
   */
  private correlation(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let denX = 0;
    let denY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }

    const sqrtValue = Math.sqrt(denX * denY);
    return num / (sqrtValue + 0.0001);
  }

  /**
   * Helper: Euclidean distance
   */
  private euclideanDistance(a: number[], b: number[]): number {
    const sum = a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0);
    return Math.sqrt(sum);
  }

  /**
   * Update metrics
   */
  private updateMetrics(explanation: Explanation, processingTime: number): void {
    this.metrics.totalExplanations++;

    // Update average confidence
    const totalConf =
      this.metrics.averageConfidence * (this.metrics.totalExplanations - 1) +
      explanation.confidence;
    this.metrics.averageConfidence = totalConf / this.metrics.totalExplanations;

    // Update top features
    for (const fi of explanation.featureImportances) {
      const current = this.metrics.topFeatures.get(fi.featureName) || 0;
      this.metrics.topFeatures.set(fi.featureName, current + Math.abs(fi.importance));
    }

    // Update method usage
    const methodCount = this.metrics.methodUsage.get(explanation.method) || 0;
    this.metrics.methodUsage.set(explanation.method, methodCount + 1);

    // Update average processing time
    const totalTime =
      this.metrics.averageProcessingTime * (this.metrics.totalExplanations - 1) +
      processingTime;
    this.metrics.averageProcessingTime = totalTime / this.metrics.totalExplanations;
  }

  /**
   * Get metrics
   */
  getMetrics(): ExplanationMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear cache and metrics
   */
  async reset(): Promise<void> {
    await this.cache.clear();
    this.metrics = {
      totalExplanations: 0,
      averageConfidence: 0,
      topFeatures: new Map(),
      methodUsage: new Map(),
      averageProcessingTime: 0,
    };
  }
}
