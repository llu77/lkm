# Architecture Patterns & Trade-offs

Architectural patterns with comprehensive trade-off analysis for informed decision-making.

## Pattern 1: Layered Architecture

```
Presentation Layer (UI/API)
         ↓
Business Logic Layer (Services)
         ↓
Data Access Layer (Repositories)
         ↓
Database
```

**When to use:**
- Traditional CRUD applications
- Clear separation of concerns needed
- Team members specialized by layer
- Gradual system evolution

**Trade-offs:**

✅ **Pros:**
- Easy to understand and explain
- Clear separation of concerns
- Each layer can be tested independently
- Easy to replace implementations within a layer
- Natural fit for traditional n-tier deployments

❌ **Cons:**
- Can lead to anemic domain models (logic scattered)
- Changes often cascade through all layers
- Can become bloated with "pass-through" code
- Horizontal scaling can be tricky
- Over-engineering for simple applications

**Decision criteria:**
```
Use if:
  - Application complexity is moderate
  - Clear layer boundaries exist
  - Team understands layered architecture well

Avoid if:
  - Domain logic is very complex (consider DDD instead)
  - Need microservices-style deployment
  - Application is very simple (too much overhead)
```

## Pattern 2: Hexagonal Architecture (Ports & Adapters)

```
         Adapters
            ↓
    ← Ports (Interfaces)
           ↓
    Application Core
    (Business Logic)
           ↓
    Ports (Interfaces) →
           ↓
        Adapters
```

**When to use:**
- Need to swap infrastructure easily (databases, APIs, etc.)
- Heavy emphasis on testability
- Domain logic is complex
- External dependencies numerous

**Trade-offs:**

✅ **Pros:**
- Infrastructure independence (swap databases, frameworks)
- Highly testable (mock all external dependencies)
- Business logic isolated and protected
- Adapters can evolve independently
- Easy to test business logic without infrastructure

❌ **Cons:**
- More initial setup (interfaces, adapters)
- Can feel over-engineered for simple apps
- Team must understand the pattern well
- More files and indirection
- Ceremony around port/adapter creation

**Implementation example:**
```python
# Port (Interface)
class PaymentGateway(ABC):
    @abstractmethod
    def charge(self, amount: Decimal, source: str) -> PaymentResult:
        pass

# Application Core (uses port)
class CheckoutService:
    def __init__(self, payment_gateway: PaymentGateway):
        self.payment = payment_gateway

    def checkout(self, cart: Cart, payment_source: str):
        total = cart.calculate_total()
        result = self.payment.charge(total, payment_source)
        if result.success:
            # ... complete order
            pass

# Adapter (implements port)
class StripeAdapter(PaymentGateway):
    def charge(self, amount: Decimal, source: str) -> PaymentResult:
        # Stripe-specific implementation
        return stripe.Charge.create(amount=amount, source=source)

# Easy to swap for testing or different gateway
class MockPaymentAdapter(PaymentGateway):
    def charge(self, amount: Decimal, source: str) -> PaymentResult:
        return PaymentResult(success=True, transaction_id="mock-123")
```

## Pattern 3: Event-Driven Architecture

```
Service A → Event Bus → Service B
    ↓                      ↓
  Publishes           Subscribes
  Events               to Events
```

**When to use:**
- Loose coupling between services needed
- Asynchronous processing acceptable
- Multiple consumers for same events
- Audit trail/event sourcing valuable

**Trade-offs:**

✅ **Pros:**
- Loose coupling (services don't know about each other)
- Easy to add new consumers without changing producers
- Natural audit trail (events as log)
- Supports eventual consistency
- Can replay events for recovery or testing

❌ **Cons:**
- Eventual consistency complexity
- Debugging harder (distributed traces needed)
- Event schema evolution challenges
- Duplicate event handling must be considered
- Requires event bus infrastructure

**Decision matrix:**
```
Choose Event-Driven if:
  ✓ Need to add consumers without changing producers
  ✓ Asynchronous processing is acceptable
  ✓ Audit/replay capabilities valuable
  ✗ Need immediate consistency
  ✗ Simple request-response sufficient
  ✗ Team unfamiliar with async patterns
```

## Pattern 4: CQRS (Command Query Responsibility Segregation)

```
Commands (Write)    Queries (Read)
      ↓                   ↓
  Write Model        Read Model
      ↓                   ↓
  Write Store  →  Sync  → Read Store
```

**When to use:**
- Read and write patterns very different
- Read scaling needs differ from writes
- Complex queries on normalized data slow
- Event sourcing being used

**Trade-offs:**

✅ **Pros:**
- Optimize read and write independently
- Scale reads and writes independently
- Read models tailored to UI needs
- Can use different storage for reads vs writes
- Simplified read queries (denormalized)

❌ **Cons:**
- Data synchronization complexity
- Eventual consistency between models
- More infrastructure to manage
- Code duplication between models
- Deployment coordination needed

**Example scenarios:**

**Good fit:**
```
E-commerce site:
- Writes: 100 orders/minute (needs ACID)
- Reads: 10,000 product views/minute (needs speed)
- Solution: Write to PostgreSQL, sync to Elasticsearch for reads
```

**Bad fit:**
```
Simple blog:
- Writes: 10 posts/day
- Reads: 100 views/day
- Solution: Just use normal CRUD, CQRS is overkill
```

## Pattern 5: Microservices

```
API Gateway
     ↓
┌────┴────┬────────┬────────┐
│         │        │        │
User     Order   Payment  Inventory
Service  Service Service  Service
│         │        │        │
DB       DB       DB       DB
```

**When to use:**
- Large teams (>20 developers)
- Different parts need different scaling
- Independent deployment critical
- Polyglot technology needs

**Trade-offs:**

✅ **Pros:**
- Independent deployment and scaling
- Technology heterogeneity (different languages/DBs)
- Fault isolation (one service failure doesn't kill all)
- Team autonomy (owns service end-to-end)
- Can rewrite services independently

❌ **Cons:**
- Distributed system complexity (network, latency)
- Data consistency challenges
- Testing harder (need all services running)
- Deployment orchestration complex
- Monitoring and debugging distributed traces needed
- Inter-service communication overhead

**When NOT to use:**
```
❌ Small team (<10 people)
❌ Unclear domain boundaries
❌ Strong data consistency required
❌ Limited DevOps capability
❌ Starting a new product (too early)
```

**Migration path:**
```
1. Start with Modular Monolith
   - Clear module boundaries
   - Use interfaces between modules
   - Separate databases per module (even in monolith)

2. Extract services when:
   - Module boundary proven stable
   - Independent scaling needed
   - Team size justifies split
   - Deployment independence valuable
```

## Pattern 6: Domain-Driven Design (DDD)

```
Application Layer
       ↓
Domain Layer (Entities, Value Objects, Aggregates)
       ↓
Infrastructure Layer
```

**When to use:**
- Complex business rules
- Domain experts available
- Long-lived project
- Core domain competitive advantage

**Trade-offs:**

✅ **Pros:**
- Rich domain models (behavior + data)
- Ubiquitous language (business & dev speak same)
- Aggregates protect invariants
- Bounded contexts manage complexity
- Business logic clearly expressed in code

❌ **Cons:**
- Learning curve (entities, value objects, aggregates, etc.)
- Can be overkill for CRUD apps
- Requires domain expert collaboration
- More ceremony than simple CRUD
- Team must buy into the approach

**Core concepts:**

**Entity:**
```python
class Order:
    """Entity: has identity, mutable"""
    def __init__(self, order_id: OrderId):
        self.id = order_id
        self.items: List[OrderItem] = []
        self.status = OrderStatus.PENDING

    def add_item(self, product: Product, quantity: int):
        # Business rule: can't modify shipped orders
        if self.status == OrderStatus.SHIPPED:
            raise OrderAlreadyShippedException()

        # Business rule: quantity must be positive
        if quantity <= 0:
            raise InvalidQuantityException()

        self.items.append(OrderItem(product, quantity))
```

**Value Object:**
```python
@dataclass(frozen=True)
class Money:
    """Value Object: no identity, immutable, defined by attributes"""
    amount: Decimal
    currency: str

    def add(self, other: 'Money') -> 'Money':
        if self.currency != other.currency:
            raise CurrencyMismatchException()
        return Money(self.amount + other.amount, self.currency)
```

**Aggregate:**
```python
class Order:
    """Aggregate Root: controls access to OrderItems"""
    def add_item(self, product, quantity):
        # Aggregate maintains invariant: total < credit limit
        new_total = self.calculate_total() + product.price * quantity
        if new_total > self.customer.credit_limit:
            raise CreditLimitExceededException()

        self.items.append(OrderItem(product, quantity))

    # External code can't directly modify items
    # Must go through aggregate root methods
```

## Decision Framework

### Questions to ask:

1. **Team Size & Experience:**
   - Small team (<5): Modular Monolith
   - Medium team (5-20): Layered or Hexagonal
   - Large team (>20): Microservices

2. **Domain Complexity:**
   - Simple CRUD: Layered Architecture
   - Complex business rules: DDD + Hexagonal
   - Mixed: Separate core (DDD) from CRUD (layered)

3. **Scaling Needs:**
   - Uniform scaling: Monolith
   - Different scaling per function: Microservices
   - Read-heavy: Consider CQRS

4. **Consistency Requirements:**
   - Strong consistency: Monolith or shared DB
   - Eventual consistency OK: Event-Driven or Microservices

5. **Deployment Independence:**
   - Not needed: Monolith
   - Critical: Microservices

### Architecture Evolution Path

```
Phase 1: MVP (0-6 months)
  → Simple Layered Monolith
  → Focus: Ship features fast
  → Keep modules cleanly separated

Phase 2: Product-Market Fit (6-24 months)
  → Introduce Hexagonal for core domain
  → Add events for audit/async processing
  → Consider CQRS for read-heavy parts
  → Focus: Maintainability + features

Phase 3: Scale (24+ months)
  → Extract microservices for:
    - Different scaling needs
    - Different teams
    - Independent deployment
  → Keep simpler parts in monolith
  → Focus: Scale + velocity

Remember: You can (and should) mix patterns!
- Core domain: DDD + Hexagonal
- CRUD admin: Simple layered
- Async processing: Event-driven
- Read-heavy API: CQRS
```

## Anti-Patterns to Avoid

### 1. Resume-Driven Development
```
❌ Choosing microservices because "it looks good on resume"
✅ Choose based on actual requirements

❌ Using Kubernetes for 2-service system
✅ Use appropriate tooling for scale
```

### 2. Big Bang Rewrites
```
❌ "Let's rewrite everything in microservices"
✅ Migrate gradually, service by service

❌ "Let's adopt DDD for entire codebase at once"
✅ Start with one bounded context, learn, expand
```

### 3. Architecture Astronauts
```
❌ Over-engineering before understanding problem
✅ Start simple, evolve architecture as needs emerge

❌ 10 abstraction layers "for future flexibility"
✅ YAGNI: You Aren't Gonna Need It
```

### 4. Technology Mismatches
```
❌ Using microservices with 3-person team
✅ Use modular monolith, extract services later if needed

❌ Using DDD for simple CRUD app
✅ Use simple layered architecture
```

## Trade-off Summary Table

| Pattern | Complexity | Testability | Scalability | Learning Curve | Team Size |
|---------|-----------|-------------|-------------|----------------|-----------|
| Layered | Low | Good | Moderate | Low | Any |
| Hexagonal | Medium | Excellent | Moderate | Medium | Small-Medium |
| Event-Driven | High | Good | Excellent | High | Medium-Large |
| CQRS | High | Good | Excellent | High | Medium-Large |
| Microservices | Very High | Complex | Excellent | Very High | Large |
| DDD | High | Excellent | Moderate | Very High | Medium-Large |

Remember: **Start simple, evolve based on actual needs, not hypothetical futures.**
