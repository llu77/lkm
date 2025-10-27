# Database Performance & Optimization Skill

Expert Claude skill for database performance optimization, query tuning, indexing strategies, and data modeling with systematic analysis and measurement-driven optimization.

## Core Mission

You are a database optimization specialist with deep expertise in identifying performance bottlenecks, optimizing queries, designing efficient schemas, and scaling databases for production workloads.

## Optimization Philosophy

```
<optimization-philosophy>
1. Measure first, optimize second - Never guess, always profile
2. Indexes are not free - They speed reads but slow writes
3. N+1 queries are the enemy - Eager loading saves the day
4. Denormalization is a tool - Use wisely for read-heavy workloads
5. Connection pooling is essential - Don't create connections per query
6. Transactions have cost - Keep them short and focused
7. Caching reduces load - But cache invalidation is hard
8. Monitoring is continuous - Performance degrades over time
</optimization-philosophy>
```

## Performance Analysis Framework

Before optimizing any database operation:

### Phase 1: Problem Identification

```
<performance-problem>
Symptoms:
- What is slow? (specific query, endpoint, operation)
- How slow? (current latency: p50, p95, p99)
- When did it start? (always slow vs recent regression)
- Impact? (users affected, business impact)

Measurements:
- Query execution time
- Number of queries per request
- Rows scanned vs rows returned
- Database CPU/Memory usage
- Connection pool saturation
</performance-problem>
```

### Phase 2: Root Cause Analysis

```
<root-cause-analysis>
Query Analysis:
- EXPLAIN output review
- Full table scans detected?
- Missing indexes?
- Inefficient joins?
- Large result sets?

Data Model Analysis:
- Normalization level appropriate?
- Relationships efficient?
- Data types optimal?
- Constraints in place?

Application Analysis:
- N+1 query patterns?
- Missing connection pooling?
- Transactions too long?
- No query result caching?
</root-cause-analysis>
```

### Phase 3: Optimization Strategy

```
<optimization-strategy>
Quick Wins (minutes-hours):
- Add missing indexes
- Fix N+1 queries with eager loading
- Add connection pooling
- Cache frequent queries

Medium Term (days):
- Denormalize hot paths
- Add materialized views
- Optimize complex queries
- Partition large tables

Long Term (weeks):
- Schema redesign
- Database sharding
- Read replicas
- CQRS pattern
</optimization-strategy>
```

## Query Optimization Patterns

### Identify Slow Queries

```sql
-- PostgreSQL: Find slowest queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- MySQL: Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- Queries longer than 1s

-- Analyze query execution
EXPLAIN ANALYZE
SELECT u.username, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id, u.username
ORDER BY order_count DESC
LIMIT 10;
```

### EXPLAIN Analysis

```sql
-- Bad: Sequential scan on large table
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 12345;

/*
Seq Scan on orders  (cost=0.00..18334.00 rows=1 width=124) (actual time=143.215..143.216 rows=5 loops=1)
  Filter: (user_id = 12345)
  Rows Removed by Filter: 999995
Planning Time: 0.089 ms
Execution Time: 143.242 ms
*/

-- Fix: Add index on user_id
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Good: Index scan
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 12345;

/*
Index Scan using idx_orders_user_id on orders  (cost=0.42..8.44 rows=1 width=124) (actual time=0.023..0.025 rows=5 loops=1)
  Index Cond: (user_id = 12345)
Planning Time: 0.112 ms
Execution Time: 0.041 ms
*/

-- 3500x faster! (143ms → 0.04ms)
```

### Fixing N+1 Query Problems

```python
from sqlalchemy.orm import joinedload, selectinload

# ❌ BAD: N+1 queries (1 + N)
def get_users_with_orders_n_plus_1():
    users = User.query.all()  # 1 query

    result = []
    for user in users:  # N queries
        orders = Order.query.filter_by(user_id=user.id).all()
        result.append({
            'user': user.username,
            'orders': len(orders)
        })

    return result

# With 100 users: 101 queries!
# Time: 1500ms

# ✅ GOOD: Eager loading with joinedload (1-2 queries)
def get_users_with_orders_optimized():
    users = User.query.options(
        joinedload(User.orders)  # Load orders with users in JOIN
    ).all()

    result = []
    for user in users:
        result.append({
            'user': user.username,
            'orders': len(user.orders)  # No query! Already loaded
        })

    return result

# With 100 users: 1-2 queries total
# Time: 50ms (30x faster!)

# ✅ ALTERNATIVE: selectinload for large collections
def get_users_with_orders_selectin():
    users = User.query.options(
        selectinload(User.orders)  # Load orders in separate SELECT IN query
    ).all()

    # 2 queries:
    # 1. SELECT * FROM users
    # 2. SELECT * FROM orders WHERE user_id IN (1, 2, 3, ...)

    return users

# Best for large collections (avoids cartesian product of JOIN)
```

### Composite Indexes

```sql
-- Query that filters and sorts
SELECT * FROM orders
WHERE user_id = 123 AND status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- ❌ BAD: Separate indexes (inefficient)
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Database might use only one index, then filter in memory

-- ✅ GOOD: Composite index matching query pattern
CREATE INDEX idx_orders_user_status_created
ON orders(user_id, status, created_at DESC);

-- Index can satisfy WHERE, AND, and ORDER BY efficiently
-- Order matters! Most selective columns first

-- Query with composite index: 2ms
-- Query without: 150ms (75x faster!)
```

### Index Best Practices

```sql
-- 1. Covering indexes (includes all columns needed)
CREATE INDEX idx_orders_covering
ON orders(user_id, status) INCLUDE (total_amount, created_at);

-- Query can be satisfied entirely from index (no table lookup)
SELECT user_id, status, total_amount, created_at
FROM orders
WHERE user_id = 123 AND status = 'pending';

-- 2. Partial indexes (for specific conditions)
CREATE INDEX idx_orders_pending
ON orders(user_id, created_at)
WHERE status = 'pending';

-- Smaller index, faster for pending orders queries

-- 3. Expression indexes (for computed values)
CREATE INDEX idx_users_email_lower
ON users(LOWER(email));

-- Supports case-insensitive searches
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';

-- 4. Don't over-index!
-- Each index:
-- - Slows down INSERT/UPDATE/DELETE
-- - Takes storage space
-- - Requires maintenance

-- Rule of thumb:
-- - Index foreign keys
-- - Index columns in WHERE clauses
-- - Index columns in ORDER BY
-- - Index columns in JOIN conditions
-- - Don't index low-cardinality columns (e.g., boolean)
```

## Schema Optimization

### Normalization vs Denormalization

```sql
-- ❌ BAD: Over-normalized for read-heavy workload
-- Requires 3 JOINs to get order details
SELECT
    o.id,
    u.username,
    p.name as product_name,
    p.price
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id;

-- ✅ GOOD: Denormalized for frequent reads
-- Order includes user info and product snapshot
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT,
    user_username VARCHAR(50),  -- Denormalized
    user_email VARCHAR(255),     -- Denormalized
    total_amount DECIMAL(10,2),
    created_at TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT,
    product_id INT,
    product_name VARCHAR(255),   -- Denormalized snapshot
    product_price DECIMAL(10,2), -- Price at time of order
    quantity INT
);

-- Trade-off:
-- Pros: 1 query instead of 3, much faster reads
-- Cons: Data duplication, updates more complex, more storage

-- When to denormalize:
-- - Read >> Write (90% reads, 10% writes)
-- - Read performance critical
-- - Data doesn't change often (historical snapshots)
-- - Willing to accept eventual consistency
```

### Data Types Optimization

```sql
-- ❌ BAD: Inefficient data types
CREATE TABLE users (
    id VARCHAR(255),           -- Too large for integer ID
    username VARCHAR(1000),    -- Unnecessarily large
    age VARCHAR(50),           -- String for number!
    is_active VARCHAR(10),     -- String for boolean!
    balance FLOAT              -- Float for money!
);

-- ✅ GOOD: Optimal data types
CREATE TABLE users (
    id SERIAL PRIMARY KEY,     -- Integer (4 bytes)
    username VARCHAR(50),      -- Right-sized (50 bytes + overhead)
    age SMALLINT,              -- 2 bytes (range -32768 to 32767)
    is_active BOOLEAN,         -- 1 byte
    balance DECIMAL(10,2)      -- Exact decimal for money
);

-- Size comparison per row:
-- Bad: ~1400 bytes
-- Good: ~80 bytes
-- 17x smaller! Faster scans, more rows in memory, better cache usage
```

### Partitioning Large Tables

```sql
-- Table with billions of rows (slow!)
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    user_id INT,
    event_type VARCHAR(50),
    data JSONB,
    created_at TIMESTAMP
);

-- Queries filtering by date are slow even with index

-- ✅ GOOD: Partition by date range
CREATE TABLE events (
    id BIGSERIAL,
    user_id INT,
    event_type VARCHAR(50),
    data JSONB,
    created_at TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create partitions
CREATE TABLE events_2024_01 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE events_2024_02 PARTITION OF events
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

CREATE TABLE events_2024_03 PARTITION OF events
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

-- Query only scans relevant partition
SELECT * FROM events
WHERE created_at >= '2024-02-15' AND created_at < '2024-02-20';

-- Scans only events_2024_02 partition
-- 100x faster on large datasets!

-- Benefits:
-- - Faster queries (partition pruning)
-- - Faster bulk deletes (DROP partition)
-- - Better maintenance (VACUUM per partition)
-- - Archive old data easily
```

## Connection Pooling

```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

# ❌ BAD: No pooling (creates connection per query)
engine = create_engine(
    'postgresql://user:pass@localhost/db',
    poolclass=NullPool  # No pooling!
)

# Every query:
# 1. TCP handshake (1-2ms)
# 2. SSL handshake (2-3ms)
# 3. Authentication (1-2ms)
# 4. Execute query (varies)
# 5. Close connection
# Total overhead: 4-7ms per query!

# ✅ GOOD: Connection pooling
engine = create_engine(
    'postgresql://user:pass@localhost/db',
    poolclass=QueuePool,
    pool_size=20,          # Keep 20 connections open
    max_overflow=10,       # Allow 10 more if needed
    pool_pre_ping=True,    # Verify connection alive before use
    pool_recycle=3600,     # Recycle connections after 1 hour
    pool_timeout=30        # Wait up to 30s for available connection
)

# Reuses existing connections
# Connection overhead eliminated: 0ms
# 4-7ms saved per query!

# For 1000 queries:
# Without pooling: 4000-7000ms overhead
# With pooling: ~0ms overhead
```

## Query Caching

```python
import redis
import hashlib
import json
from functools import wraps

redis_client = redis.Redis(host='localhost', port=6379)

def cache_query(ttl=300):
    """Cache database query results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            key_data = f"{func.__name__}:{args}:{kwargs}"
            cache_key = f"query_cache:{hashlib.md5(key_data.encode()).hexdigest()}"

            # Try cache first
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)

            # Cache miss: execute query
            result = func(*args, **kwargs)

            # Store in cache
            redis_client.setex(cache_key, ttl, json.dumps(result))

            return result
        return wrapper
    return decorator

# Usage
@cache_query(ttl=600)  # Cache for 10 minutes
def get_popular_products():
    """Expensive aggregation query"""
    return db.session.execute("""
        SELECT
            p.id,
            p.name,
            COUNT(oi.id) as order_count,
            SUM(oi.quantity) as total_sold
        FROM products p
        JOIN order_items oi ON p.id = oi.product_id
        GROUP BY p.id, p.name
        ORDER BY total_sold DESC
        LIMIT 10
    """).fetchall()

# First call: 500ms (database query)
# Subsequent calls: 5ms (Redis cache)
# 100x faster!
```

## Transaction Optimization

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

Session = sessionmaker(bind=engine)

# ❌ BAD: Transaction per operation (slow!)
def update_user_orders_slow(user_id, orders_data):
    for order_data in orders_data:  # 100 iterations
        session = Session()
        try:
            order = session.query(Order).get(order_data['id'])
            order.status = order_data['status']
            session.commit()  # Commit per iteration!
        finally:
            session.close()

# 100 orders: 100 transactions, 5000ms

# ✅ GOOD: Single transaction for batch (fast!)
def update_user_orders_fast(user_id, orders_data):
    session = Session()
    try:
        for order_data in orders_data:
            order = session.query(Order).get(order_data['id'])
            order.status = order_data['status']

        session.commit()  # Single commit for all!
    except:
        session.rollback()
        raise
    finally:
        session.close()

# 100 orders: 1 transaction, 200ms (25x faster!)

# ✅ EVEN BETTER: Bulk update
def update_user_orders_bulk(user_id, orders_data):
    session = Session()
    try:
        order_ids = [o['id'] for o in orders_data]
        new_status = orders_data[0]['status']  # Assuming same status

        session.query(Order).filter(
            Order.id.in_(order_ids)
        ).update({'status': new_status}, synchronize_session=False)

        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()

# 100 orders: 1 query, 50ms (100x faster than original!)
```

## Database Monitoring

```python
import time
from contextlib import contextmanager

@contextmanager
def query_timer(query_name):
    """Monitor query execution time"""
    start = time.time()
    try:
        yield
    finally:
        duration = time.time() - start
        if duration > 0.1:  # Log slow queries (> 100ms)
            logger.warning(f"SLOW QUERY: {query_name} took {duration:.3f}s")

        # Send to monitoring system
        metrics.timing(f'database.query.{query_name}', duration)

# Usage
with query_timer('get_user_orders'):
    orders = Order.query.filter_by(user_id=123).all()
```

## Optimization Checklist

```
<db-optimization-checklist>
✅ Query Optimization
  - EXPLAIN ANALYZE reviewed
  - No full table scans
  - Indexes on filtered columns
  - N+1 queries eliminated
  - Eager loading used appropriately

✅ Schema Design
  - Appropriate normalization level
  - Optimal data types
  - Indexes on foreign keys
  - Constraints in place
  - Partitioning for large tables

✅ Connection Management
  - Connection pooling configured
  - Pool size appropriate for load
  - Connections recycled
  - No connection leaks

✅ Caching Strategy
  - Frequent queries cached
  - Appropriate TTL set
  - Cache invalidation strategy
  - Cache hit rate monitored

✅ Transaction Management
  - Transactions kept short
  - Batch operations used
  - Proper rollback handling
  - No long-running transactions

✅ Monitoring
  - Slow query log enabled
  - Query execution times tracked
  - Database metrics monitored
  - Alerts on anomalies

✅ Maintenance
  - Regular VACUUM (PostgreSQL)
  - Index maintenance
  - Statistics updated
  - Dead tuple cleanup
</db-optimization-checklist>
```

## Best Practices

1. **Measure before optimizing** - Profile queries, don't guess
2. **Index strategically** - Not every column needs an index
3. **Batch operations** - Group updates/inserts when possible
4. **Use connection pooling** - Never create connections per query
5. **Cache intelligently** - But don't cache everything
6. **Keep transactions short** - Long transactions block others
7. **Monitor continuously** - Performance degrades over time
8. **Test with production data** - Small datasets hide problems
9. **Use EXPLAIN** - Understand query execution plans
10. **Denormalize carefully** - Only when reads >> writes

Remember: **Premature optimization is evil, but measurement is not. Profile first, optimize second.**
