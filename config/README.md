# Configuration Files

This directory contains configuration files for various system optimizations and settings.

## Performance Configuration

**File:** `performance.json`

This configuration file controls performance optimization settings for AI/ML inference and processing.

### Settings

#### Prediction Cache
```json
{
  "predictionCache": {
    "enabled": true,
    "maxEntries": 10000,
    "ttl": 300000
  }
}
```

- **enabled**: Enable/disable prediction result caching
- **maxEntries**: Maximum number of cached predictions (default: 10,000)
- **ttl**: Time-to-live in milliseconds (default: 300,000ms = 5 minutes)

**Use case:** Cache frequently requested predictions to reduce API calls and improve latency.

#### Model Preloading
```json
{
  "preload": {
    "models": [
      "task_predictor",
      "error_preventer",
      "performance_optimizer"
    ],
    "warmup": true
  }
}
```

- **models**: List of models to preload at startup
- **warmup**: Run warmup inference to prepare models

**Use case:** Reduce cold start latency by preloading critical models.

#### Batching
```json
{
  "batching": {
    "enabled": true,
    "maxBatchSize": 100,
    "maxWaitTime": 50
  }
}
```

- **enabled**: Enable/disable request batching
- **maxBatchSize**: Maximum requests per batch (default: 100)
- **maxWaitTime**: Maximum wait time in milliseconds before processing batch (default: 50ms)

**Use case:** Batch multiple requests together to improve throughput and reduce costs.

#### WebAssembly Optimization
```json
{
  "wasm": {
    "simd": true,
    "threads": 4,
    "memoryPages": 256
  }
}
```

- **simd**: Enable SIMD (Single Instruction, Multiple Data) operations
- **threads**: Number of worker threads for parallel processing
- **memoryPages**: WebAssembly memory allocation in pages (1 page = 64KB)

**Use case:** Optimize edge computing and browser-based inference performance.

## Usage

### Python
```python
import json
from pathlib import Path

# Load configuration
config_path = Path(__file__).parent / "config" / "performance.json"
with open(config_path) as f:
    config = json.load(f)

# Use settings
cache_enabled = config["predictionCache"]["enabled"]
batch_size = config["batching"]["maxBatchSize"]
```

### JavaScript/TypeScript
```javascript
import config from './config/performance.json';

// Use settings
const cacheEnabled = config.predictionCache.enabled;
const batchSize = config.batching.maxBatchSize;
```

## Environment-Specific Configurations

You can create environment-specific configs:
- `performance.dev.json` - Development settings
- `performance.prod.json` - Production settings
- `performance.test.json` - Testing settings

## Quality Gate Configuration

**File:** `quality-gate.json`

This configuration file controls quality assurance and CI/CD enforcement settings.

### Settings

#### Mode and Thresholds
```json
{
  "enabled": false,
  "mode": "passive",
  "truth_threshold": 0.80,
  "rollback_enabled": false
}
```

- **enabled**: Enable/disable quality gate checks
- **mode**: Enforcement mode (`passive`, `active`, `strict`)
- **truth_threshold**: Minimum confidence threshold for validation (0.0-1.0)
- **rollback_enabled**: Auto-rollback on quality gate failure

#### Quality Weights
```json
{
  "weights": {
    "tests": 0.40,
    "lint": 0.20,
    "types": 0.20,
    "build": 0.20
  }
}
```

Relative importance of different quality checks (must sum to 1.0):
- **tests**: Unit/integration test results
- **lint**: Code style and linting
- **types**: Type checking
- **build**: Build success

#### Enforcement Modes

**Passive Mode** (default):
- Log results only
- No warnings or failures
- Good for monitoring

**Active Mode**:
- Log results
- Warn on failures
- Don't block execution

**Strict Mode**:
- Log results
- Warn on failures
- Block on failures (fail CI/CD)

#### Integrations
```json
{
  "integrations": {
    "github_actions": true,
    "mcp_tools": true,
    "npx_commands": true,
    "memory_persistence": true
  }
}
```

- **github_actions**: GitHub Actions integration
- **mcp_tools**: Model Context Protocol tools
- **npx_commands**: NPX command execution
- **memory_persistence**: Persist results across runs

#### Reporting
```json
{
  "reporting": {
    "auto_generate": true,
    "frequency": "on_completion",
    "format": "markdown",
    "include_evidence": true
  }
}
```

- **auto_generate**: Automatically generate reports
- **frequency**: When to generate (`on_completion`, `always`, `on_failure`)
- **format**: Report format (`markdown`, `json`, `html`)
- **include_evidence**: Include detailed evidence in reports

### Usage Scenarios

**Development (Passive)**:
```json
{
  "mode": "passive",
  "enabled": true
}
```

**Pre-production (Active)**:
```json
{
  "mode": "active",
  "enabled": true,
  "truth_threshold": 0.85
}
```

**Production (Strict)**:
```json
{
  "mode": "strict",
  "enabled": true,
  "truth_threshold": 0.95,
  "rollback_enabled": true
}
```

## Tuning Guidelines

### For High Throughput
- Increase `batching.maxBatchSize` to 200-500
- Reduce `batching.maxWaitTime` to 20-30ms
- Increase `predictionCache.maxEntries` to 50,000+

### For Low Latency
- Reduce `batching.maxBatchSize` to 10-20
- Reduce `batching.maxWaitTime` to 10ms
- Enable `preload.warmup`

### For Cost Optimization
- Increase `predictionCache.ttl` to 600,000ms (10 minutes)
- Increase `batching.maxBatchSize` to maximize batching
- Enable aggressive caching

### For Memory-Constrained Environments
- Reduce `predictionCache.maxEntries` to 1,000-5,000
- Reduce `wasm.memoryPages` to 128
- Reduce `wasm.threads` to 2
