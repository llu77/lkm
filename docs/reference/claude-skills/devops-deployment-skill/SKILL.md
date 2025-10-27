# DevOps & Deployment Skill

A comprehensive Claude skill for DevOps practices, CI/CD pipelines, infrastructure automation, and production deployment strategies.

## Core Capabilities

You are an expert DevOps engineer with deep knowledge in:
- CI/CD pipeline design and optimization
- Infrastructure as Code (IaC)
- Container orchestration and Kubernetes
- Deployment strategies and zero-downtime releases
- Monitoring, logging, and observability
- Cloud platform architecture (AWS, GCP, Azure)
- Security automation (DevSecOps)
- Disaster recovery and business continuity

## DevOps Thinking Framework

Before implementing any DevOps solution, use this structured approach:

### 1. Requirements Analysis
```
<devops-requirements>
- What are we deploying? (app type, architecture, dependencies)
- Scale requirements? (traffic, users, data volume)
- Availability requirements? (SLA, downtime tolerance)
- Security requirements? (compliance, data sensitivity)
- Budget constraints? (cloud costs, team size)
- Team expertise? (current skills, learning capacity)
</devops-requirements>
```

### 2. Infrastructure Analysis
```
<infrastructure-analysis>
- Current state: [existing infrastructure, pain points]
- Desired state: [target architecture, improvements]
- Gap analysis: [what needs to change]
- Migration strategy: [how to get from current to desired]
- Risk assessment: [what could go wrong, mitigation plans]
</infrastructure-analysis>
```

### 3. Solution Design
```
<devops-solution>
- CI/CD pipeline: [build → test → deploy stages]
- Infrastructure: [compute, storage, networking, monitoring]
- Deployment strategy: [blue-green, canary, rolling]
- Rollback plan: [how to revert if deployment fails]
- Monitoring: [metrics, alerts, dashboards]
- Cost optimization: [resource sizing, auto-scaling]
</devops-solution>
```

### 4. Implementation Plan
```
<implementation-plan>
Phase 1: Foundation
  - Set up version control and branching strategy
  - Create base infrastructure with IaC
  - Implement basic CI pipeline

Phase 2: Automation
  - Add automated testing gates
  - Implement CD with staging environment
  - Set up monitoring and alerting

Phase 3: Optimization
  - Add deployment strategies (canary, blue-green)
  - Implement auto-scaling
  - Optimize costs and performance

Phase 4: Maturity
  - Chaos engineering and resilience testing
  - Advanced observability
  - Self-healing systems
</implementation-plan>
```

## CI/CD Pipeline Patterns

### Pattern 1: GitHub Actions Pipeline

Complete production-ready pipeline:

```yaml
# .github/workflows/deploy.yml
name: Build, Test, and Deploy

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run linters
        run: |
          ruff check .
          black --check .
          mypy .

      - name: Run unit tests
        run: |
          pytest tests/unit \
            --cov=src \
            --cov-report=xml \
            --cov-report=html \
            --junitxml=junit.xml

      - name: Run integration tests
        run: |
          docker-compose -f docker-compose.test.yml up -d
          pytest tests/integration
          docker-compose -f docker-compose.test.yml down

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage.xml
          fail_ci_if_error: true

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD

  build:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILD_DATE=${{ github.event.head_commit.timestamp }}
            VCS_REF=${{ github.sha }}
            VERSION=${{ steps.meta.outputs.version }}

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - name: Deploy to staging
        uses: azure/k8s-deploy@v4
        with:
          manifests: |
            k8s/staging/deployment.yml
            k8s/staging/service.yml
          images: |
            ${{ needs.build.outputs.image-tag }}
          namespace: staging

      - name: Run smoke tests
        run: |
          curl -f https://staging.example.com/health || exit 1
          npm run test:e2e -- --env=staging

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://example.com
    steps:
      - name: Deploy to production (Canary)
        uses: azure/k8s-deploy@v4
        with:
          manifests: |
            k8s/production/deployment-canary.yml
          images: |
            ${{ needs.build.outputs.image-tag }}
          namespace: production
          strategy: canary
          percentage: 10

      - name: Wait and monitor canary
        run: |
          sleep 300  # 5 minutes
          # Check error rate, latency, etc.
          ./scripts/check-canary-metrics.sh

      - name: Promote canary to full deployment
        uses: azure/k8s-deploy@v4
        with:
          manifests: |
            k8s/production/deployment.yml
            k8s/production/service.yml
          images: |
            ${{ needs.build.outputs.image-tag }}
          namespace: production
```

**Key Features:**
- Multi-stage pipeline (test → security → build → deploy)
- Parallel test and security scanning
- Docker layer caching for fast builds
- Staged deployments (staging → canary → production)
- Environment-specific configurations
- Automated rollback on smoke test failure

### Pattern 2: Multi-Environment Deployment Strategy

```python
# scripts/deploy.py
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum
import time
import requests

class DeploymentStrategy(Enum):
    ROLLING = "rolling"
    BLUE_GREEN = "blue_green"
    CANARY = "canary"
    RECREATE = "recreate"

class HealthCheckStatus(Enum):
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"

@dataclass
class DeploymentConfig:
    environment: str
    image_tag: str
    replicas: int
    strategy: DeploymentStrategy
    health_check_url: str
    health_check_timeout: int = 300
    canary_percentage: int = 10
    canary_duration: int = 300

class DeploymentOrchestrator:
    """Orchestrates deployments with different strategies"""

    def __init__(self, config: DeploymentConfig):
        self.config = config
        self.kubectl = KubectlWrapper()
        self.metrics = MetricsCollector()

    def deploy(self) -> bool:
        """Execute deployment based on configured strategy"""
        print(f"Deploying to {self.config.environment} using {self.config.strategy.value}")

        if self.config.strategy == DeploymentStrategy.CANARY:
            return self._deploy_canary()
        elif self.config.strategy == DeploymentStrategy.BLUE_GREEN:
            return self._deploy_blue_green()
        elif self.config.strategy == DeploymentStrategy.ROLLING:
            return self._deploy_rolling()
        else:
            return self._deploy_recreate()

    def _deploy_canary(self) -> bool:
        """Canary deployment: gradual rollout with monitoring"""
        print(f"Starting canary deployment at {self.config.canary_percentage}%")

        # Deploy canary version
        canary_replicas = max(1, int(self.config.replicas * self.config.canary_percentage / 100))
        self.kubectl.deploy(
            name=f"{self.config.environment}-canary",
            image=self.config.image_tag,
            replicas=canary_replicas,
            labels={"version": "canary"}
        )

        # Wait for canary to be healthy
        if not self._wait_for_healthy(f"{self.config.environment}-canary"):
            print("Canary deployment failed health check")
            self._rollback_canary()
            return False

        # Monitor canary metrics
        print(f"Monitoring canary for {self.config.canary_duration}s")
        baseline_metrics = self.metrics.get_current_metrics(f"{self.config.environment}-stable")
        time.sleep(self.config.canary_duration)
        canary_metrics = self.metrics.get_current_metrics(f"{self.config.environment}-canary")

        # Compare metrics
        if not self._compare_metrics(baseline_metrics, canary_metrics):
            print("Canary metrics degraded, rolling back")
            self._rollback_canary()
            return False

        # Promote canary to full deployment
        print("Canary successful, promoting to full deployment")
        self.kubectl.deploy(
            name=self.config.environment,
            image=self.config.image_tag,
            replicas=self.config.replicas,
            labels={"version": "stable"}
        )

        # Clean up canary
        self.kubectl.delete(f"{self.config.environment}-canary")
        return True

    def _deploy_blue_green(self) -> bool:
        """Blue-Green deployment: zero-downtime switching"""
        current_color = self._get_current_color()
        new_color = "green" if current_color == "blue" else "blue"

        print(f"Current: {current_color}, Deploying: {new_color}")

        # Deploy new version
        self.kubectl.deploy(
            name=f"{self.config.environment}-{new_color}",
            image=self.config.image_tag,
            replicas=self.config.replicas,
            labels={"color": new_color}
        )

        # Wait for new version to be healthy
        if not self._wait_for_healthy(f"{self.config.environment}-{new_color}"):
            print(f"{new_color} deployment failed health check")
            self.kubectl.delete(f"{self.config.environment}-{new_color}")
            return False

        # Run smoke tests against new version
        if not self._run_smoke_tests(f"{self.config.environment}-{new_color}"):
            print("Smoke tests failed")
            self.kubectl.delete(f"{self.config.environment}-{new_color}")
            return False

        # Switch traffic to new version
        print(f"Switching traffic from {current_color} to {new_color}")
        self.kubectl.update_service(
            name=self.config.environment,
            selector={"color": new_color}
        )

        # Wait briefly and verify
        time.sleep(10)
        if not self._verify_traffic_switch(new_color):
            print("Traffic switch failed, reverting")
            self.kubectl.update_service(
                name=self.config.environment,
                selector={"color": current_color}
            )
            return False

        # Keep old version for quick rollback, delete after grace period
        print(f"Keeping {current_color} for 1 hour for quick rollback")
        time.sleep(3600)
        self.kubectl.delete(f"{self.config.environment}-{current_color}")
        return True

    def _deploy_rolling(self) -> bool:
        """Rolling deployment: gradual pod replacement"""
        self.kubectl.set_image(
            deployment=self.config.environment,
            image=self.config.image_tag
        )

        # Watch rollout progress
        return self.kubectl.wait_for_rollout(
            deployment=self.config.environment,
            timeout=self.config.health_check_timeout
        )

    def _wait_for_healthy(self, deployment_name: str) -> bool:
        """Wait for deployment to become healthy"""
        start_time = time.time()
        while time.time() - start_time < self.config.health_check_timeout:
            if self._check_health(deployment_name) == HealthCheckStatus.HEALTHY:
                return True
            time.sleep(10)
        return False

    def _check_health(self, deployment_name: str) -> HealthCheckStatus:
        """Check health of deployment"""
        try:
            # Check pod status
            pods = self.kubectl.get_pods(deployment_name)
            if not all(pod['ready'] for pod in pods):
                return HealthCheckStatus.UNHEALTHY

            # Check HTTP health endpoint
            response = requests.get(
                f"{self.config.health_check_url}/health",
                timeout=5
            )
            if response.status_code == 200:
                return HealthCheckStatus.HEALTHY
            return HealthCheckStatus.UNHEALTHY

        except Exception as e:
            print(f"Health check error: {e}")
            return HealthCheckStatus.UNKNOWN

    def _compare_metrics(self, baseline: dict, canary: dict) -> bool:
        """Compare canary metrics against baseline"""
        # Error rate must not increase by more than 50%
        if canary.get('error_rate', 0) > baseline.get('error_rate', 0) * 1.5:
            print(f"Error rate too high: {canary['error_rate']} vs {baseline['error_rate']}")
            return False

        # P95 latency must not increase by more than 20%
        if canary.get('p95_latency', 0) > baseline.get('p95_latency', 0) * 1.2:
            print(f"Latency too high: {canary['p95_latency']} vs {baseline['p95_latency']}")
            return False

        # CPU usage must not exceed 80%
        if canary.get('cpu_usage', 0) > 80:
            print(f"CPU usage too high: {canary['cpu_usage']}%")
            return False

        return True

    def _rollback_canary(self):
        """Rollback failed canary deployment"""
        print("Rolling back canary deployment")
        self.kubectl.delete(f"{self.config.environment}-canary")

# Usage
config = DeploymentConfig(
    environment="production",
    image_tag="myapp:v1.2.3",
    replicas=10,
    strategy=DeploymentStrategy.CANARY,
    health_check_url="https://api.example.com",
    canary_percentage=10,
    canary_duration=300
)

orchestrator = DeploymentOrchestrator(config)
success = orchestrator.deploy()
```

## Infrastructure as Code

### Terraform Example: Complete AWS Infrastructure

```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}

# VPC and Networking
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "${var.project_name}-${var.environment}"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = false
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# EKS Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "19.0.0"

  cluster_name    = "${var.project_name}-${var.environment}"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    general = {
      desired_size = 3
      min_size     = 2
      max_size     = 10

      instance_types = ["t3.large"]
      capacity_type  = "ON_DEMAND"

      labels = {
        role = "general"
      }

      tags = {
        NodeGroup = "general"
      }
    }

    spot = {
      desired_size = 2
      min_size     = 0
      max_size     = 5

      instance_types = ["t3.large", "t3a.large"]
      capacity_type  = "SPOT"

      labels = {
        role = "spot"
      }

      taints = [{
        key    = "spot"
        value  = "true"
        effect = "NoSchedule"
      }]
    }
  }

  # Cluster access
  manage_aws_auth_configmap = true

  aws_auth_roles = [
    {
      rolearn  = aws_iam_role.eks_admin.arn
      username = "admin"
      groups   = ["system:masters"]
    },
  ]
}

# RDS Database
module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "6.0.0"

  identifier = "${var.project_name}-${var.environment}"

  engine               = "postgres"
  engine_version       = "15.3"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = "db.t3.large"

  allocated_storage     = 100
  max_allocated_storage = 500
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  port     = 5432

  multi_az               = true
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [aws_security_group.rds.id]

  maintenance_window      = "Mon:00:00-Mon:03:00"
  backup_window           = "03:00-06:00"
  backup_retention_period = 30

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "${var.project_name}-${var.environment}-final-snapshot"

  parameters = [
    {
      name  = "shared_preload_libraries"
      value = "pg_stat_statements"
    }
  ]
}

# ElastiCache Redis
module "redis" {
  source  = "terraform-aws-modules/elasticache/aws"
  version = "1.0.0"

  cluster_id      = "${var.project_name}-${var.environment}"
  engine          = "redis"
  engine_version  = "7.0"
  node_type       = "cache.t3.medium"
  num_cache_nodes = 2

  subnet_group_name = module.vpc.elasticache_subnet_group_name
  security_group_ids = [aws_security_group.redis.id]

  parameter_group_family = "redis7"
  port                   = 6379

  snapshot_retention_limit = 5
  snapshot_window         = "03:00-05:00"

  automatic_failover_enabled = true
  multi_az_enabled          = true
}

# S3 Bucket for application assets
module "s3_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "3.15.0"

  bucket = "${var.project_name}-${var.environment}-assets"
  acl    = "private"

  versioning = {
    enabled = true
  }

  lifecycle_rule = [
    {
      id      = "archive-old-versions"
      enabled = true

      noncurrent_version_transition = [
        {
          days          = 30
          storage_class = "STANDARD_IA"
        },
        {
          days          = 90
          storage_class = "GLACIER"
        },
      ]

      noncurrent_version_expiration = {
        days = 365
      }
    }
  ]

  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "AES256"
      }
    }
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/eks/${var.project_name}-${var.environment}/app"
  retention_in_days = 30
}

# Outputs
output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "rds_endpoint" {
  value = module.rds.db_instance_endpoint
}

output "redis_endpoint" {
  value = module.redis.primary_endpoint_address
}
```

## Monitoring & Observability

### Complete Monitoring Stack

```yaml
# k8s/monitoring/prometheus-values.yml
prometheus:
  prometheusSpec:
    retention: 15d
    retentionSize: "50GB"

    storageSpec:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 100Gi

    additionalScrapeConfigs:
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__

    # Alert rules
    ruleFiles:
      - /etc/prometheus/rules/*.yml

# Alerting rules
---
# k8s/monitoring/alert-rules.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-alerts
  namespace: monitoring
data:
  alerts.yml: |
    groups:
      - name: application
        interval: 30s
        rules:
          - alert: HighErrorRate
            expr: |
              sum(rate(http_requests_total{status=~"5.."}[5m]))
              /
              sum(rate(http_requests_total[5m]))
              > 0.05
            for: 5m
            labels:
              severity: critical
            annotations:
              summary: "High error rate detected"
              description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"

          - alert: HighLatency
            expr: |
              histogram_quantile(0.95,
                sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
              ) > 1
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "High latency detected for {{ $labels.service }}"
              description: "P95 latency is {{ $value }}s (threshold: 1s)"

          - alert: PodCrashLooping
            expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
            for: 5m
            labels:
              severity: critical
            annotations:
              summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} is crash looping"
              description: "Pod has restarted {{ $value }} times in the last 15 minutes"

          - alert: DatabaseConnectionPoolExhausted
            expr: |
              db_connections_active / db_connections_max > 0.9
            for: 2m
            labels:
              severity: critical
            annotations:
              summary: "Database connection pool nearly exhausted"
              description: "{{ $value | humanizePercentage }} of connections in use"

# Grafana Dashboard
---
# k8s/monitoring/grafana-dashboard.json
{
  "dashboard": {
    "title": "Application Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (service)"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))"
          }
        ]
      },
      {
        "title": "Latency (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))"
          }
        ]
      },
      {
        "title": "Database Query Duration",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(db_query_duration_seconds_bucket[5m])) by (le, query_type))"
          }
        ]
      }
    ]
  }
}
```

### Python Application Instrumentation

```python
# app/monitoring.py
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from functools import wraps
import time
import logging
from typing import Callable

# Metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

db_query_duration_seconds = Histogram(
    'db_query_duration_seconds',
    'Database query duration',
    ['query_type', 'table']
)

active_connections = Gauge(
    'db_connections_active',
    'Active database connections'
)

cache_hits_total = Counter(
    'cache_hits_total',
    'Total cache hits',
    ['cache_type']
)

cache_misses_total = Counter(
    'cache_misses_total',
    'Total cache misses',
    ['cache_type']
)

# Decorators for automatic instrumentation
def track_request_metrics(func: Callable) -> Callable:
    """Decorator to automatically track request metrics"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        status = 500

        try:
            response = await func(*args, **kwargs)
            status = response.status_code
            return response
        except Exception as e:
            logging.error(f"Request failed: {e}")
            raise
        finally:
            duration = time.time() - start_time

            # Extract endpoint and method from request context
            endpoint = kwargs.get('endpoint', 'unknown')
            method = kwargs.get('method', 'unknown')

            http_requests_total.labels(
                method=method,
                endpoint=endpoint,
                status=status
            ).inc()

            http_request_duration_seconds.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)

    return wrapper

def track_db_query(query_type: str, table: str):
    """Decorator to track database query performance"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                return await func(*args, **kwargs)
            finally:
                duration = time.time() - start_time
                db_query_duration_seconds.labels(
                    query_type=query_type,
                    table=table
                ).observe(duration)
        return wrapper
    return decorator

# Usage in FastAPI
from fastapi import FastAPI, Response
from fastapi.responses import PlainTextResponse

app = FastAPI()

@app.get("/metrics")
async def metrics():
    """Expose metrics for Prometheus scraping"""
    return PlainTextResponse(
        generate_latest(),
        media_type="text/plain"
    )

@app.middleware("http")
async def track_requests(request, call_next):
    """Middleware to track all requests"""
    start_time = time.time()

    response = await call_next(request)

    duration = time.time() - start_time

    http_requests_total.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    http_request_duration_seconds.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)

    return response
```

## Best Practices Checklist

### CI/CD Pipeline Checklist
```
✅ Version Control:
  - Git flow or trunk-based development
  - Protected main/master branch
  - Required code reviews
  - Automated linting on PR

✅ Testing Gates:
  - Unit tests (>80% coverage)
  - Integration tests
  - E2E tests for critical paths
  - Security scanning (SAST, dependency check)
  - Performance tests

✅ Build Process:
  - Docker multi-stage builds
  - Layer caching optimization
  - Image vulnerability scanning
  - Semantic versioning
  - Build artifacts signing

✅ Deployment:
  - Environment parity (dev/staging/prod)
  - Secrets management (never in code)
  - Configuration as environment variables
  - Health checks before traffic routing
  - Automated rollback on failure
```

### Infrastructure Checklist
```
✅ High Availability:
  - Multi-AZ deployment
  - Auto-scaling configured
  - Load balancer health checks
  - Database replication
  - Disaster recovery plan

✅ Security:
  - Network segmentation (VPC, subnets)
  - Security groups (least privilege)
  - Encryption at rest and in transit
  - Secrets rotation
  - Regular security audits

✅ Monitoring:
  - Prometheus + Grafana setup
  - Application metrics exposed
  - Infrastructure metrics collected
  - Log aggregation (ELK, Loki)
  - Alerting configured
```

## Related Skills

- Testing & QA Skill - for comprehensive testing strategies
- Database Optimization Skill - for database performance
- Error Handling Skill - for resilience patterns
- Backend Architecture Skill - for system design

## When to Use This Skill

- Setting up new projects or infrastructure
- Improving existing CI/CD pipelines
- Implementing deployment strategies
- Troubleshooting deployment issues
- Optimizing cloud costs
- Improving observability
- Planning disaster recovery

## Continuous Improvement

After each deployment:
```
<deployment-retrospective>
What went well: [successful aspects]
What needs improvement: [pain points, manual steps]
Metrics: [deployment time, success rate, rollback count]
Action items: [automation opportunities, process improvements]
</deployment-retrospective>
```
