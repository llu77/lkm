# Advanced Error Handling & Recovery Skill

Expert Claude skill for comprehensive error handling, fault tolerance, and system recovery with systematic analysis and production-tested patterns.

## Core Mission

You are an error handling specialist with deep expertise in building resilient systems that gracefully handle failures, provide clear diagnostics, and recover automatically when possible.

## Error Handling Philosophy

```
<error-philosophy>
1. Errors WILL happen - design for failure, not just success
2. Fail fast, recover fast - detect early, handle gracefully
3. Never silence errors - log everything, surface appropriately
4. User-friendly outside, detailed inside - clear messages to users, detailed logs for developers
5. Errors are data - collect, analyze, learn from failures
</error-philosophy>
```

## Error Analysis Framework

Before implementing error handling for any system, analyze systematically:

### Phase 1: Error Taxonomy

```
<error-taxonomy>
Transient Errors (retry-able):
- Network timeouts
- Database connection failures
- Rate limiting (429)
- Service temporarily unavailable (503)
Strategy: Retry with exponential backoff

Permanent Errors (non-retry-able):
- Invalid input (400)
- Unauthorized (401)
- Forbidden (403)
- Not found (404)
- Conflict (409)
Strategy: Return clear error, don't retry

Infrastructure Errors:
- Database down
- Cache unavailable
- Message queue full
- Disk full
Strategy: Circuit breaker, fallback, graceful degradation

Business Logic Errors:
- Insufficient balance
- Item out of stock
- Invalid state transition
Strategy: Return domain-specific error, suggest remedy

Data Errors:
- Constraint violations
- Data corruption
- Inconsistent state
Strategy: Validate early, maintain invariants, transaction boundaries
</error-taxonomy>
```

### Phase 2: Error Handling Strategy

```
<error-strategy>
For each error type, decide:

Detection:
- How do we detect this error?
- What are the early warning signs?
- Can we prevent it before it happens?

Response:
- Retry? How many times? What backoff?
- Fallback? What's the degraded behavior?
- Fail? How do we fail safely?

Communication:
- What does user see?
- What gets logged?
- What alerts fire?

Recovery:
- Can we auto-recover?
- What manual intervention needed?
- How do we prevent recurrence?
</error-strategy>
```

### Phase 3: Fault Tolerance Design

```
<fault-tolerance>
Redundancy:
- Multiple instances for availability
- Data replication for durability
- Multiple regions for disaster recovery

Isolation:
- Failures contained to single component
- Circuit breakers prevent cascade
- Bulkheads limit blast radius

Monitoring:
- Health checks detect failures
- Metrics track error rates
- Alerts notify on anomalies

Graceful Degradation:
- Core features continue with reduced functionality
- Clear communication about limitations
- Automatic restoration when possible
</fault-tolerance>
```

## Error Handling Patterns

### Pattern 1: Structured Error Hierarchy

```python
from typing import Optional, Dict, Any
from datetime import datetime
import traceback

class AppError(Exception):
    """Base error for all application errors"""

    def __init__(
        self,
        message: str,
        error_code: str,
        details: Optional[Dict[str, Any]] = None,
        cause: Optional[Exception] = None
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        self.cause = cause
        self.timestamp = datetime.utcnow()
        self.traceback = traceback.format_exc()

    def to_dict(self) -> Dict[str, Any]:
        return {
            'error': self.error_code,
            'message': self.message,
            'details': self.details,
            'timestamp': self.timestamp.isoformat(),
            'request_id': get_request_id()  # From context
        }

# Domain-specific errors
class ValidationError(AppError):
    """Input validation failed"""
    def __init__(self, message: str, field: str, value: Any):
        super().__init__(
            message=message,
            error_code='VALIDATION_ERROR',
            details={'field': field, 'value': value}
        )

class ResourceNotFoundError(AppError):
    """Requested resource doesn't exist"""
    def __init__(self, resource_type: str, resource_id: Any):
        super().__init__(
            message=f"{resource_type} not found",
            error_code='RESOURCE_NOT_FOUND',
            details={'resource_type': resource_type, 'resource_id': resource_id}
        )

class BusinessRuleViolation(AppError):
    """Business rule violated"""
    def __init__(self, rule: str, message: str):
        super().__init__(
            message=message,
            error_code='BUSINESS_RULE_VIOLATION',
            details={'rule': rule}
        )

class ExternalServiceError(AppError):
    """External service call failed"""
    def __init__(self, service: str, operation: str, cause: Exception):
        super().__init__(
            message=f"{service} {operation} failed",
            error_code='EXTERNAL_SERVICE_ERROR',
            details={'service': service, 'operation': operation},
            cause=cause
        )
```

### Pattern 2: Retry with Exponential Backoff

```python
import time
import random
from functools import wraps
from typing import Callable, Type, Tuple

def retry_with_backoff(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    jitter: bool = True,
    retry_on: Tuple[Type[Exception], ...] = (Exception,)
):
    """
    Retry decorator with exponential backoff

    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Initial delay in seconds
        max_delay: Maximum delay in seconds
        exponential_base: Base for exponential backoff
        jitter: Add randomness to prevent thundering herd
        retry_on: Tuple of exceptions to retry on
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)

                except retry_on as e:
                    last_exception = e

                    if attempt == max_retries:
                        # Last attempt failed, give up
                        raise

                    # Calculate delay
                    delay = min(
                        base_delay * (exponential_base ** attempt),
                        max_delay
                    )

                    # Add jitter to prevent thundering herd
                    if jitter:
                        delay = delay * (0.5 + random.random())

                    # Log retry attempt
                    logger.warning(
                        f"Attempt {attempt + 1}/{max_retries} failed for {func.__name__}: {e}. "
                        f"Retrying in {delay:.2f}s..."
                    )

                    time.sleep(delay)

            raise last_exception

        return wrapper
    return decorator

# Usage
@retry_with_backoff(
    max_retries=3,
    base_delay=1.0,
    retry_on=(ConnectionError, TimeoutError)
)
def call_external_api(url: str) -> dict:
    response = requests.get(url, timeout=5)
    response.raise_for_status()
    return response.json()
```

### Pattern 3: Circuit Breaker

```python
from enum import Enum
from datetime import datetime, timedelta
from threading import Lock
from typing import Callable

class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failure detected, blocking requests
    HALF_OPEN = "half_open"  # Testing if service recovered

class CircuitBreaker:
    """
    Circuit breaker pattern to prevent cascade failures
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        timeout: timedelta = timedelta(seconds=60),
        recovery_timeout: timedelta = timedelta(seconds=30)
    ):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.recovery_timeout = recovery_timeout

        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = None
        self.lock = Lock()

    def call(self, func: Callable, *args, **kwargs):
        """Execute function with circuit breaker protection"""

        with self.lock:
            if self.state == CircuitState.OPEN:
                # Check if enough time passed to try recovery
                if datetime.now() - self.last_failure_time > self.recovery_timeout:
                    self.state = CircuitState.HALF_OPEN
                    logger.info("Circuit breaker entering HALF_OPEN state")
                else:
                    raise CircuitBreakerOpenError("Circuit breaker is OPEN")

        try:
            result = func(*args, **kwargs)

            with self.lock:
                if self.state == CircuitState.HALF_OPEN:
                    # Success in half-open state, close circuit
                    self.state = CircuitState.CLOSED
                    self.failure_count = 0
                    logger.info("Circuit breaker CLOSED after recovery")

            return result

        except Exception as e:
            with self.lock:
                self.failure_count += 1
                self.last_failure_time = datetime.now()

                if self.failure_count >= self.failure_threshold:
                    self.state = CircuitState.OPEN
                    logger.error(
                        f"Circuit breaker OPEN after {self.failure_count} failures"
                    )

                if self.state == CircuitState.HALF_OPEN:
                    # Failed recovery attempt, back to open
                    self.state = CircuitState.OPEN
                    logger.error("Circuit breaker recovery failed, reopening")

            raise

# Usage
payment_service_breaker = CircuitBreaker(
    failure_threshold=5,
    timeout=timedelta(seconds=60),
    recovery_timeout=timedelta(seconds=30)
)

def process_payment(amount: float, card_token: str):
    try:
        return payment_service_breaker.call(
            payment_api.charge,
            amount,
            card_token
        )
    except CircuitBreakerOpenError:
        # Fallback: queue for later processing
        payment_queue.enqueue(amount, card_token)
        return {'status': 'queued', 'message': 'Payment will be processed shortly'}
```

### Pattern 4: Error Recovery Chain

```python
from typing import Callable, List, Any, Optional

class RecoveryStrategy:
    """Base class for recovery strategies"""

    def can_handle(self, error: Exception) -> bool:
        """Check if this strategy can handle the error"""
        raise NotImplementedError

    def recover(self, error: Exception, context: dict) -> Any:
        """Attempt to recover from error"""
        raise NotImplementedError

class RetryStrategy(RecoveryStrategy):
    """Retry the operation"""

    def can_handle(self, error: Exception) -> bool:
        return isinstance(error, (ConnectionError, TimeoutError))

    def recover(self, error: Exception, context: dict) -> Any:
        logger.info(f"Retrying operation after {error}")
        return context['operation'](*context['args'], **context['kwargs'])

class FallbackStrategy(RecoveryStrategy):
    """Use fallback value or operation"""

    def __init__(self, fallback: Callable):
        self.fallback = fallback

    def can_handle(self, error: Exception) -> bool:
        return isinstance(error, ExternalServiceError)

    def recover(self, error: Exception, context: dict) -> Any:
        logger.warning(f"Using fallback for {error}")
        return self.fallback(context)

class CacheStrategy(RecoveryStrategy):
    """Return cached value if available"""

    def __init__(self, cache):
        self.cache = cache

    def can_handle(self, error: Exception) -> bool:
        return isinstance(error, ExternalServiceError)

    def recover(self, error: Exception, context: dict) -> Any:
        cache_key = context.get('cache_key')
        if cache_key:
            cached = self.cache.get(cache_key)
            if cached:
                logger.info(f"Returning cached value for {cache_key}")
                return cached
        raise error  # No cached value available

class ErrorRecoveryChain:
    """Chain of recovery strategies"""

    def __init__(self, strategies: List[RecoveryStrategy]):
        self.strategies = strategies

    def execute_with_recovery(
        self,
        operation: Callable,
        *args,
        **kwargs
    ) -> Any:
        """Execute operation with recovery strategies"""

        context = {
            'operation': operation,
            'args': args,
            'kwargs': kwargs
        }

        try:
            return operation(*args, **kwargs)

        except Exception as error:
            logger.error(f"Operation failed: {error}")

            # Try each recovery strategy
            for strategy in self.strategies:
                if strategy.can_handle(error):
                    try:
                        return strategy.recover(error, context)
                    except Exception as recovery_error:
                        logger.error(
                            f"Recovery strategy {strategy.__class__.__name__} failed: {recovery_error}"
                        )
                        continue

            # No recovery strategy worked
            raise

# Usage
recovery_chain = ErrorRecoveryChain([
    RetryStrategy(),
    CacheStrategy(redis_client),
    FallbackStrategy(lambda ctx: {'status': 'degraded'})
])

def get_user_profile(user_id: str):
    return recovery_chain.execute_with_recovery(
        external_api.get_profile,
        user_id,
        cache_key=f"profile:{user_id}"
    )
```

## For More Patterns

See reference files for additional error handling patterns:

- `GRACEFUL_DEGRADATION.md` - Fallback strategies, feature flags
- `ERROR_MONITORING.md` - Error tracking, alerting, analysis
- `TRANSACTION_MANAGEMENT.md` - Distributed transactions, saga pattern
- `CHAOS_ENGINEERING.md` - Testing failure scenarios

## Error Handling Checklist

```
<error-handling-checklist>
✅ Error Detection
  - All error types identified
  - Early detection mechanisms in place
  - Health checks monitor system state

✅ Error Classification
  - Transient vs permanent errors distinguished
  - Retry strategy per error type
  - Circuit breaker for failing services

✅ Error Response
  - User-friendly error messages
  - Detailed error logs for debugging
  - Proper HTTP status codes
  - Request ID for tracing

✅ Error Recovery
  - Retry with exponential backoff
  - Fallback strategies defined
  - Graceful degradation implemented
  - Auto-recovery where possible

✅ Error Monitoring
  - All errors logged
  - Error metrics tracked
  - Alerts on error rate spikes
  - Error analysis dashboard

✅ Error Prevention
  - Input validation
  - Defensive programming
  - Contract testing
  - Chaos engineering
</error-handling-checklist>
```

## Communication Guidelines

When handling errors:

1. **Be specific** - "Database connection timeout after 5s" not "Error occurred"
2. **Be actionable** - Tell users what they can do: "Please try again" or "Contact support"
3. **Log everything** - Capture full context for debugging
4. **Never expose internals** - Hide stack traces, db errors from end users
5. **Track patterns** - Aggregate and analyze error trends

Remember: **The best error handling is error prevention. The second best is graceful recovery.**
