# Graceful Degradation & Fallback Strategies

Patterns for building systems that continue operating with reduced functionality during failures.

## Core Principles

```
1. Identify critical vs non-critical features
2. Define degraded modes for each feature
3. Implement fallback chains (primary → secondary → tertiary)
4. Communicate degradation status to users
5. Auto-recover when upstream services restore
```

## Feature Flags for Degradation

```python
from enum import Enum
from typing import Optional, Callable, Any
import redis

class FeatureState(Enum):
    ENABLED = 'enabled'
    DEGRADED = 'degraded'
    DISABLED = 'disabled'

class FeatureFlag:
    """Feature flag system with degradation support"""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    def get_feature_state(self, feature_name: str) -> FeatureState:
        """Get current state of a feature"""
        state = self.redis.get(f"feature:{feature_name}")

        if not state:
            return FeatureState.ENABLED  # Default to enabled

        return FeatureState(state.decode())

    def set_feature_state(self, feature_name: str, state: FeatureState, ttl: Optional[int] = None):
        """Set feature state"""
        key = f"feature:{feature_name}"

        if ttl:
            self.redis.setex(key, ttl, state.value)
        else:
            self.redis.set(key, state.value)

    def is_enabled(self, feature_name: str) -> bool:
        """Check if feature is fully enabled"""
        return self.get_feature_state(feature_name) == FeatureState.ENABLED

    def is_degraded(self, feature_name: str) -> bool:
        """Check if feature is in degraded mode"""
        return self.get_feature_state(feature_name) == FeatureState.DEGRADED

    def auto_degrade_on_error(
        self,
        feature_name: str,
        error_threshold: int = 5,
        time_window: int = 60,
        degradation_ttl: int = 300
    ):
        """Automatically degrade feature after threshold errors"""
        error_key = f"feature:{feature_name}:errors"

        # Increment error count
        pipe = self.redis.pipeline()
        pipe.incr(error_key)
        pipe.expire(error_key, time_window)
        error_count = pipe.execute()[0]

        # Check threshold
        if error_count >= error_threshold:
            self.set_feature_state(
                feature_name,
                FeatureState.DEGRADED,
                ttl=degradation_ttl
            )
            logger.warning(
                f"Feature {feature_name} auto-degraded after {error_count} errors"
            )

# Usage
feature_flags = FeatureFlag(redis_client)

def get_recommendations(user_id: str) -> List[dict]:
    """Get personalized recommendations with graceful degradation"""

    if feature_flags.is_enabled('ml_recommendations'):
        try:
            # Primary: ML-powered recommendations
            return ml_service.get_recommendations(user_id)

        except Exception as e:
            logger.error(f"ML recommendations failed: {e}")
            feature_flags.auto_degrade_on_error('ml_recommendations')

            # Fall through to degraded mode

    if feature_flags.is_degraded('ml_recommendations') or feature_flags.is_enabled('basic_recommendations'):
        try:
            # Secondary: Rule-based recommendations
            return rule_based_recommendations(user_id)

        except Exception as e:
            logger.error(f"Rule-based recommendations failed: {e}")
            # Fall through to final fallback

    # Tertiary: Popular items (always works)
    return get_popular_items()
```

## Cascading Fallbacks

```python
from typing import Callable, List, Any, Optional
from dataclasses import dataclass

@dataclass
class FallbackStrategy:
    """Single fallback strategy"""
    name: str
    handler: Callable
    timeout: Optional[float] = None

class FallbackChain:
    """Chain of fallback strategies"""

    def __init__(self, strategies: List[FallbackStrategy]):
        self.strategies = strategies

    def execute(self, *args, **kwargs) -> Any:
        """Execute with fallback chain"""
        last_error = None

        for strategy in self.strategies:
            try:
                logger.info(f"Trying strategy: {strategy.name}")

                if strategy.timeout:
                    # Execute with timeout
                    with timeout_context(strategy.timeout):
                        result = strategy.handler(*args, **kwargs)
                else:
                    result = strategy.handler(*args, **kwargs)

                logger.info(f"Strategy {strategy.name} succeeded")
                return result

            except Exception as e:
                last_error = e
                logger.warning(f"Strategy {strategy.name} failed: {e}")
                continue

        # All strategies failed
        logger.error(f"All fallback strategies exhausted. Last error: {last_error}")
        raise AllFallbacksFailedError("All fallback strategies failed") from last_error

# Example: User profile service with fallbacks
def get_profile_from_api(user_id: str) -> dict:
    """Primary: Get from external API"""
    response = requests.get(f"https://api.service.com/users/{user_id}", timeout=2)
    response.raise_for_status()
    return response.json()

def get_profile_from_cache(user_id: str) -> dict:
    """Secondary: Get from Redis cache"""
    cached = redis_client.get(f"profile:{user_id}")
    if not cached:
        raise CacheEmptyError("No cached profile")
    return json.loads(cached)

def get_profile_from_db(user_id: str) -> dict:
    """Tertiary: Get from database"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UserNotFoundError(f"User {user_id} not found")
    return user.to_dict()

def get_minimal_profile(user_id: str) -> dict:
    """Final fallback: Minimal profile"""
    return {
        'id': user_id,
        'name': 'Unknown User',
        'status': 'Profile temporarily unavailable'
    }

# Setup fallback chain
profile_fallback_chain = FallbackChain([
    FallbackStrategy('api', get_profile_from_api, timeout=2.0),
    FallbackStrategy('cache', get_profile_from_cache, timeout=0.5),
    FallbackStrategy('database', get_profile_from_db, timeout=5.0),
    FallbackStrategy('minimal', get_minimal_profile),
])

@app.get('/api/v1/users/{user_id}/profile')
async def get_user_profile(user_id: str):
    """Get user profile with graceful degradation"""
    return profile_fallback_chain.execute(user_id)
```

## Circuit Breaker with Fallback

```python
from enum import Enum
from datetime import datetime, timedelta
from typing import Callable, Optional, Any

class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreakerWithFallback:
    """Circuit breaker that triggers fallback when open"""

    def __init__(
        self,
        failure_threshold: int = 5,
        success_threshold: int = 2,
        timeout: timedelta = timedelta(seconds=60),
        fallback: Optional[Callable] = None
    ):
        self.failure_threshold = failure_threshold
        self.success_threshold = success_threshold
        self.timeout = timeout
        self.fallback = fallback

        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection"""

        if self.state == CircuitState.OPEN:
            # Check if timeout elapsed
            if datetime.now() - self.last_failure_time > self.timeout:
                self.state = CircuitState.HALF_OPEN
                logger.info("Circuit breaker entering HALF_OPEN state")
            else:
                # Circuit still open, use fallback
                if self.fallback:
                    logger.info("Circuit OPEN, using fallback")
                    return self.fallback(*args, **kwargs)
                else:
                    raise CircuitBreakerOpenError("Circuit breaker is OPEN and no fallback provided")

        try:
            # Try the operation
            result = func(*args, **kwargs)

            # Success
            if self.state == CircuitState.HALF_OPEN:
                self.success_count += 1

                if self.success_count >= self.success_threshold:
                    # Recovered, close circuit
                    self.state = CircuitState.CLOSED
                    self.failure_count = 0
                    self.success_count = 0
                    logger.info("Circuit breaker CLOSED after recovery")

            return result

        except Exception as e:
            # Failure
            self.failure_count += 1
            self.last_failure_time = datetime.now()

            if self.state == CircuitState.HALF_OPEN:
                # Failed during recovery, reopen circuit
                self.state = CircuitState.OPEN
                self.success_count = 0
                logger.error("Circuit breaker reopened after failed recovery attempt")

            elif self.failure_count >= self.failure_threshold:
                # Too many failures, open circuit
                self.state = CircuitState.OPEN
                logger.error(f"Circuit breaker OPEN after {self.failure_count} failures")

            # Use fallback if available
            if self.fallback:
                logger.info("Primary function failed, using fallback")
                return self.fallback(*args, **kwargs)
            else:
                raise

# Example: Payment processing with fallback
def process_payment_primary(amount: float, card_token: str) -> dict:
    """Primary payment processor"""
    return payment_api.charge(amount, card_token)

def process_payment_fallback(amount: float, card_token: str) -> dict:
    """Fallback: Queue for later processing"""
    job_id = payment_queue.enqueue({
        'amount': amount,
        'card_token': card_token,
        'timestamp': datetime.now().isoformat()
    })

    return {
        'status': 'queued',
        'job_id': job_id,
        'message': 'Payment will be processed shortly'
    }

payment_breaker = CircuitBreakerWithFallback(
    failure_threshold=5,
    success_threshold=2,
    timeout=timedelta(seconds=60),
    fallback=process_payment_fallback
)

@app.post('/api/v1/payments')
async def create_payment(payment: PaymentRequest):
    """Process payment with fallback"""
    result = payment_breaker.call(
        process_payment_primary,
        payment.amount,
        payment.card_token
    )

    return result
```

## Partial Response Pattern

```python
from typing import Dict, List, Optional, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass

@dataclass
class ServiceResult:
    """Result from a service call"""
    service_name: str
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    execution_time: float = 0.0

class AggregateService:
    """Aggregate data from multiple services with partial failure tolerance"""

    def __init__(self, max_workers: int = 5, timeout: float = 5.0):
        self.max_workers = max_workers
        self.timeout = timeout

    def call_service(self, service_name: str, service_func: Callable, *args, **kwargs) -> ServiceResult:
        """Call single service and capture result"""
        import time
        start = time.time()

        try:
            result = service_func(*args, **kwargs)
            execution_time = time.time() - start

            return ServiceResult(
                service_name=service_name,
                success=True,
                data=result,
                execution_time=execution_time
            )

        except Exception as e:
            execution_time = time.time() - start
            logger.error(f"Service {service_name} failed: {e}")

            return ServiceResult(
                service_name=service_name,
                success=False,
                error=str(e),
                execution_time=execution_time
            )

    def aggregate(self, services: Dict[str, tuple[Callable, tuple, dict]]) -> Dict[str, ServiceResult]:
        """
        Call multiple services in parallel and aggregate results

        Args:
            services: Dict of {service_name: (function, args, kwargs)}

        Returns:
            Dict of {service_name: ServiceResult}
        """
        results = {}

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all service calls
            futures = {
                executor.submit(
                    self.call_service,
                    service_name,
                    func,
                    *args,
                    **kwargs
                ): service_name
                for service_name, (func, args, kwargs) in services.items()
            }

            # Collect results as they complete
            for future in as_completed(futures, timeout=self.timeout):
                try:
                    result = future.result()
                    results[result.service_name] = result
                except Exception as e:
                    service_name = futures[future]
                    results[service_name] = ServiceResult(
                        service_name=service_name,
                        success=False,
                        error=f"Timeout or error: {e}"
                    )

        return results

# Example: Dashboard aggregating data from multiple services
aggregator = AggregateService(max_workers=5, timeout=3.0)

@app.get('/api/v1/dashboard')
async def get_dashboard(user_id: str):
    """Get dashboard data with partial failures tolerated"""

    # Define service calls
    services = {
        'profile': (user_service.get_profile, (user_id,), {}),
        'orders': (order_service.get_recent_orders, (user_id, 10), {}),
        'recommendations': (recommendation_service.get_recommendations, (user_id,), {}),
        'notifications': (notification_service.get_unread, (user_id,), {}),
        'balance': (wallet_service.get_balance, (user_id,), {}),
    }

    # Aggregate results
    results = aggregator.aggregate(services)

    # Build response with partial data
    response = {
        'user_id': user_id,
        'data': {},
        'partial_failure': False,
        'failed_services': []
    }

    for service_name, result in results.items():
        if result.success:
            response['data'][service_name] = result.data
        else:
            response['partial_failure'] = True
            response['failed_services'].append({
                'service': service_name,
                'error': result.error
            })

            # Provide fallback data
            response['data'][service_name] = get_fallback_data(service_name, user_id)

    return response

def get_fallback_data(service_name: str, user_id: str) -> dict:
    """Provide sensible defaults when service fails"""
    fallbacks = {
        'profile': {'name': 'User', 'status': 'Profile unavailable'},
        'orders': [],
        'recommendations': [],
        'notifications': {'count': 0, 'items': []},
        'balance': {'amount': 0, 'status': 'Balance unavailable'}
    }

    return fallbacks.get(service_name, {'status': 'unavailable'})
```

## Degraded Mode Communication

```python
from enum import Enum
from typing import Optional

class SystemHealth(Enum):
    HEALTHY = 'healthy'
    DEGRADED = 'degraded'
    CRITICAL = 'critical'

class HealthStatus:
    """Track and communicate system health"""

    def __init__(self, redis_client):
        self.redis = redis_client

    def set_health(self, component: str, status: SystemHealth, message: Optional[str] = None):
        """Set health status for component"""
        health_data = {
            'status': status.value,
            'message': message or '',
            'timestamp': datetime.now().isoformat()
        }

        self.redis.setex(
            f"health:{component}",
            300,  # 5 minutes TTL
            json.dumps(health_data)
        )

    def get_overall_health(self) -> dict:
        """Get overall system health"""
        components = ['database', 'cache', 'queue', 'external_api']
        health = {}

        for component in components:
            data = self.redis.get(f"health:{component}")

            if data:
                health[component] = json.loads(data)
            else:
                health[component] = {
                    'status': SystemHealth.HEALTHY.value,
                    'message': 'OK'
                }

        # Determine overall status
        statuses = [h['status'] for h in health.values()]

        if SystemHealth.CRITICAL.value in statuses:
            overall = SystemHealth.CRITICAL
        elif SystemHealth.DEGRADED.value in statuses:
            overall = SystemHealth.DEGRADED
        else:
            overall = SystemHealth.HEALTHY

        return {
            'overall': overall.value,
            'components': health,
            'timestamp': datetime.now().isoformat()
        }

health_status = HealthStatus(redis_client)

@app.get('/health')
async def health_check():
    """Public health check endpoint"""
    health = health_status.get_overall_health()

    # Return appropriate HTTP status
    if health['overall'] == SystemHealth.CRITICAL.value:
        status_code = 503  # Service Unavailable
    elif health['overall'] == SystemHealth.DEGRADED.value:
        status_code = 200  # OK but indicate degradation
    else:
        status_code = 200  # OK

    return JSONResponse(content=health, status_code=status_code)
```

## Best Practices

1. **Always have a fallback** - Even if it's just an error message
2. **Communicate degradation** - Tell users what's limited
3. **Log everything** - Track which fallbacks are being used
4. **Monitor fallback usage** - High fallback usage indicates problems
5. **Auto-recover** - Switch back to primary when available
6. **Test degradation** - Regularly test your fallback chains
7. **Prioritize features** - Know what's critical vs nice-to-have
8. **Set clear timeouts** - Don't wait forever for failing services
9. **Use circuit breakers** - Prevent cascading failures
10. **Cache aggressively** - Stale data often better than no data
