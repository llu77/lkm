/**
 * Explainability types for neural network interpretability
 * Provides SHAP-like feature importance and decision explanations
 */

export interface FeatureImportance {
  featureName: string;
  featureIndex: number;
  importance: number; // -1 to 1, negative means reduces output
  confidence: number; // 0 to 1
  rank: number;
}

export interface ShapValue {
  featureName: string;
  featureIndex: number;
  baseValue: number;
  shapValue: number; // Contribution to prediction
  featureValue: any;
  percentageContribution: number;
}

export interface Explanation {
  predictionId: string;
  modelId: string;
  input: any;
  output: any;
  prediction: number | number[];
  baseValue: number; // Expected value
  shapValues: ShapValue[];
  featureImportances: FeatureImportance[];
  confidence: number;
  timestamp: number;
  method: 'shap' | 'lime' | 'integrated-gradients' | 'attention';
}

export interface AttentionWeights {
  layerName: string;
  headIndex?: number;
  weights: number[][]; // Attention matrix
  inputTokens?: string[];
  outputTokens?: string[];
}

export interface LayerActivation {
  layerName: string;
  layerIndex: number;
  activations: number[];
  statistics: {
    mean: number;
    std: number;
    min: number;
    max: number;
    sparsity: number; // Percentage of zeros
  };
}

export interface DecisionPath {
  layers: Array<{
    layerName: string;
    topNeurons: Array<{
      index: number;
      activation: number;
      contribution: number;
    }>;
  }>;
  totalPathStrength: number;
}

export interface CounterfactualExample {
  original: any;
  counterfactual: any;
  changes: Array<{
    feature: string;
    originalValue: any;
    newValue: any;
    impact: number;
  }>;
  originalPrediction: number;
  newPrediction: number;
  distance: number; // How different from original
}

export interface ExplainabilityConfig {
  method: 'shap' | 'lime' | 'integrated-gradients' | 'attention' | 'all';
  numSamples?: number; // For sampling-based methods
  topK?: number; // Top K features to explain
  baseline?: any; // Baseline input for comparison
  includeAttention?: boolean;
  includeActivations?: boolean;
  includeCounterfactuals?: boolean;
}

export interface ExplainabilityResult {
  explanation: Explanation;
  attentionWeights?: AttentionWeights[];
  layerActivations?: LayerActivation[];
  decisionPath?: DecisionPath;
  counterfactuals?: CounterfactualExample[];
  visualizations?: {
    type: string;
    data: any;
  }[];
}

export interface ExplanationCache {
  get(predictionId: string): Promise<ExplainabilityResult | null>;
  set(predictionId: string, result: ExplainabilityResult): Promise<void>;
  clear(): Promise<void>;
}

export interface ExplanationMetrics {
  totalExplanations: number;
  averageConfidence: number;
  topFeatures: Map<string, number>; // Feature -> importance score
  methodUsage: Map<string, number>; // Method -> count
  averageProcessingTime: number;
}
