# Performance Optimization Patterns

Systematic approaches to identifying and fixing performance bottlenecks.

## Rule 0: Measure First, Optimize Later

**Never optimize without measuring.** Intuition about performance is often wrong.

```
<performance-workflow>
1. Profile to find actual bottleneck
2. Set performance target (e.g., "reduce by 50%")
3. Implement optimization
4. Measure improvement
5. If target not met, repeat
6. Document findings
</performance-workflow>
```

## Pattern 1: Database Query Optimization

### Problem: N+1 Query Problem

```python
# ❌ N+1 queries (1 + N where N = number of users)
def get_users_with_posts():
    users = User.query.all()  # 1 query
    result = []
    for user in users:  # N queries
        posts = Post.query.filter_by(user_id=user.id).all()  # Query per user!
        result.append({
            'user': user.name,
            'posts': [p.title for p in posts]
        })
    return result

# With 100 users: 101 queries!

# ✅ Solution: Eager loading (2 queries total)
def get_users_with_posts():
    users = User.query.options(joinedload(User.posts)).all()  # 1-2 queries
    result = []
    for user in users:
        result.append({
            'user': user.name,
            'posts': [p.title for p in user.posts]  # No query! Already loaded
        })
    return result

# With 100 users: 1-2 queries total
```

### Indexing Strategy

```sql
-- Problem: Slow query
SELECT * FROM orders WHERE user_id = 123 AND status = 'pending';

-- Check execution plan
EXPLAIN SELECT * FROM orders WHERE user_id = 123 AND status = 'pending';

-- If table scan detected, add index
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- Now query uses index
-- Before: 500ms (table scan of 1M rows)
-- After: 5ms (index lookup)
```

### Query Optimization Checklist

```sql
-- ❌ SELECT * (fetches unnecessary columns)
SELECT * FROM users WHERE id = 123;

-- ✅ Select only needed columns
SELECT id, name, email FROM users WHERE id = 123;

-- ❌ Using OR (often prevents index usage)
SELECT * FROM products WHERE category = 'electronics' OR category = 'computers';

-- ✅ Using IN (can use index)
SELECT * FROM products WHERE category IN ('electronics', 'computers');

-- ❌ Function on indexed column (prevents index usage)
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';

-- ✅ Store lowercase in separate column or use functional index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- ❌ Leading wildcard (prevents index usage)
SELECT * FROM users WHERE email LIKE '%@gmail.com';

-- ✅ Trailing wildcard (can use index)
SELECT * FROM users WHERE email LIKE 'john%';
```

## Pattern 2: Caching Strategies

### Cache Hierarchy

```
L1: In-memory cache (fastest, smallest)
     ↓ (miss)
L2: Redis/Memcached (fast, medium)
     ↓ (miss)
L3: Database (slower, largest)
```

### Implementation

```python
import redis
from functools import wraps
import hashlib
import json

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cache(ttl=300):  # TTL in seconds
    """Decorator for caching function results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            key_data = f"{func.__name__}:{args}:{kwargs}"
            cache_key = hashlib.md5(key_data.encode()).hexdigest()

            # Try to get from cache
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)

            # Cache miss: compute result
            result = func(*args, **kwargs)

            # Store in cache
            redis_client.setex(
                cache_key,
                ttl,
                json.dumps(result)
            )

            return result
        return wrapper
    return decorator

# Usage
@cache(ttl=3600)  # Cache for 1 hour
def get_expensive_data(user_id):
    # This function only runs on cache miss
    return database.complex_query(user_id)
```

### Cache Invalidation

```python
class UserCache:
    @staticmethod
    def get(user_id):
        key = f"user:{user_id}"
        cached = redis_client.get(key)
        if cached:
            return json.loads(cached)

        user = User.query.get(user_id)
        redis_client.setex(key, 3600, json.dumps(user.to_dict()))
        return user.to_dict()

    @staticmethod
    def invalidate(user_id):
        """Call this when user data changes"""
        key = f"user:{user_id}"
        redis_client.delete(key)

# Usage
def update_user(user_id, new_data):
    user = User.query.get(user_id)
    user.update(new_data)
    db.session.commit()

    # Invalidate cache
    UserCache.invalidate(user_id)
```

## Pattern 3: Lazy Loading

```python
class ExpensiveResource:
    def __init__(self, resource_id):
        self.resource_id = resource_id
        self._data = None  # Not loaded yet
        self._metadata = None

    @property
    def data(self):
        """Lazy load data only when accessed"""
        if self._data is None:
            print(f"Loading data for {self.resource_id}")
            self._data = self._load_data()
        return self._data

    @property
    def metadata(self):
        """Lazy load metadata only when accessed"""
        if self._metadata is None:
            print(f"Loading metadata for {self.resource_id}")
            self._metadata = self._load_metadata()
        return self._metadata

    def _load_data(self):
        # Expensive operation
        return database.load_large_data(self.resource_id)

    def _load_metadata(self):
        # Another expensive operation
        return database.load_metadata(self.resource_id)

# Usage
resource = ExpensiveResource(123)  # Fast: no loading yet

# Only load when actually needed
if user.wants_data:
    print(resource.data)  # Loads data now

# Metadata never loaded if not accessed
```

## Pattern 4: Batch Operations

```python
# ❌ Individual operations (slow)
def update_users_individually(user_ids, new_status):
    for user_id in user_ids:  # 1000 iterations
        user = User.query.get(user_id)  # Query per iteration
        user.status = new_status
        db.session.commit()  # Commit per iteration!

# Time: 5 seconds for 1000 users

# ✅ Batch operation (fast)
def update_users_batch(user_ids, new_status):
    User.query.filter(User.id.in_(user_ids)).update(
        {'status': new_status},
        synchronize_session=False
    )
    db.session.commit()  # Single commit

# Time: 50ms for 1000 users (100x faster!)
```

### Bulk Insert

```python
# ❌ Individual inserts
def import_products_slow(products_data):
    for data in products_data:  # 10,000 iterations
        product = Product(**data)
        db.session.add(product)
        db.session.commit()  # Commit per insert!

# Time: 30 seconds

# ✅ Bulk insert
def import_products_fast(products_data):
    products = [Product(**data) for data in products_data]
    db.session.bulk_save_objects(products)
    db.session.commit()  # Single commit

# Time: 1 second (30x faster!)
```

## Pattern 5: Pagination

```python
# ❌ Loading all results (memory intensive)
def get_all_users():
    users = User.query.all()  # Loads all users into memory!
    return [u.to_dict() for u in users]

# With 1M users: 500MB memory, 30 seconds

# ✅ Pagination (efficient)
def get_users_paginated(page=1, per_page=100):
    pagination = User.query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
    return {
        'users': [u.to_dict() for u in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }

# First page: 5MB memory, 50ms
```

### Cursor-Based Pagination (for large datasets)

```python
def get_users_cursor(cursor=None, limit=100):
    """
    Better for large datasets and real-time data
    """
    query = User.query.order_by(User.id)

    if cursor:
        # Start after cursor
        query = query.filter(User.id > cursor)

    users = query.limit(limit).all()

    next_cursor = users[-1].id if users else None

    return {
        'users': [u.to_dict() for u in users],
        'next_cursor': next_cursor
    }

# Usage:
# Page 1: get_users_cursor()
# Page 2: get_users_cursor(cursor=last_id_from_page_1)
# More stable than offset-based pagination
```

## Pattern 6: Async I/O

```python
import asyncio
import aiohttp

# ❌ Synchronous API calls (slow)
def fetch_all_sync(urls):
    results = []
    for url in urls:  # 10 URLs
        response = requests.get(url)  # 200ms each
        results.append(response.json())
    return results

# Time: 10 * 200ms = 2 seconds

# ✅ Async API calls (fast)
async def fetch_one(session, url):
    async with session.get(url) as response:
        return await response.json()

async def fetch_all_async(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_one(session, url) for url in urls]
        return await asyncio.gather(*tasks)

# Usage
results = asyncio.run(fetch_all_async(urls))

# Time: ~200ms (all in parallel, 10x faster!)
```

## Pattern 7: Connection Pooling

```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

# ❌ No connection pooling (slow)
engine = create_engine(
    'postgresql://user:pass@localhost/db',
    poolclass=None  # New connection per query!
)

# ✅ Connection pooling (fast)
engine = create_engine(
    'postgresql://user:pass@localhost/db',
    poolclass=QueuePool,
    pool_size=20,  # Keep 20 connections open
    max_overflow=10,  # Allow 10 more if needed
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=3600  # Recycle connections after 1 hour
)

# Connection overhead eliminated:
# Without pool: 50ms connection setup per query
# With pool: 0ms connection reuse
```

## Pattern 8: Compression

```python
import gzip
import json

@app.route('/api/large_dataset')
def large_dataset():
    data = get_large_dataset()  # 5MB JSON

    # Without compression: 5MB over network
    # return jsonify(data)

    # With compression: 500KB over network (10x smaller!)
    json_str = json.dumps(data)
    compressed = gzip.compress(json_str.encode())

    response = make_response(compressed)
    response.headers['Content-Encoding'] = 'gzip'
    response.headers['Content-Type'] = 'application/json'
    return response
```

## Pattern 9: Memoization

```python
from functools import lru_cache

# ❌ Recomputing expensive calculation
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# fibonacci(40) takes 30 seconds (millions of redundant calculations)

# ✅ Memoization (cache results)
@lru_cache(maxsize=None)
def fibonacci_fast(n):
    if n < 2:
        return n
    return fibonacci_fast(n-1) + fibonacci_fast(n-2)

# fibonacci_fast(40) takes 0.001 seconds (each value computed once)
```

## Pattern 10: Database Connection Reduction

```python
# ❌ Multiple queries in a loop
def get_order_details(order_ids):
    results = []
    for order_id in order_ids:  # 100 orders
        order = Order.query.get(order_id)  # Query 1
        customer = Customer.query.get(order.customer_id)  # Query 2
        products = Product.query.filter(  # Query 3
            Product.id.in_(order.product_ids)
        ).all()
        results.append({
            'order': order,
            'customer': customer,
            'products': products
        })
    return results

# Total queries: 300 (3 * 100)

# ✅ Minimize queries with joins
def get_order_details_optimized(order_ids):
    orders = Order.query.filter(Order.id.in_(order_ids)).options(
        joinedload(Order.customer),
        joinedload(Order.products)
    ).all()

    return [{
        'order': order,
        'customer': order.customer,
        'products': order.products
    } for order in orders]

# Total queries: 1-2
```

## Profiling Tools

### Python Profiling

```python
import cProfile
import pstats

def profile_function(func):
    profiler = cProfile.Profile()
    profiler.enable()

    result = func()

    profiler.disable()
    stats = pstats.Stats(profiler)
    stats.sort_stats('cumulative')
    stats.print_stats(20)  # Top 20 functions

    return result

# Usage
profile_function(lambda: slow_function())
```

### Memory Profiling

```python
from memory_profiler import profile

@profile
def memory_intensive_function():
    # This decorator shows memory usage line by line
    data = [i for i in range(1000000)]
    processed = [x * 2 for x in data]
    return sum(processed)
```

### Database Query Profiling

```python
from sqlalchemy import event
from sqlalchemy.engine import Engine
import time

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    context._query_start_time = time.time()

@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total = time.time() - context._query_start_time
    if total > 0.1:  # Log slow queries (> 100ms)
        print(f"SLOW QUERY ({total:.3f}s): {statement}")
```

## Performance Testing

```python
import time
from contextlib import contextmanager

@contextmanager
def timer(label):
    """Context manager for timing code blocks"""
    start = time.time()
    try:
        yield
    finally:
        end = time.time()
        print(f"{label}: {end - start:.3f}s")

# Usage
with timer("Database query"):
    users = User.query.all()

with timer("Processing"):
    results = process_users(users)
```

## Optimization Checklist

```
<performance-checklist>
✅ Database
  - N+1 queries fixed (use eager loading)
  - Indexes on frequently queried columns
  - Only select needed columns
  - Batch operations instead of loops
  - Connection pooling configured

✅ Caching
  - Expensive computations cached
  - Cache invalidation strategy
  - Appropriate TTL set
  - Cache hit rate monitored

✅ API/Network
  - Pagination for large datasets
  - Compression enabled
  - Async I/O for external calls
  - Request/response size minimized

✅ Code
  - Algorithms analyzed (time complexity)
  - Lazy loading for expensive resources
  - Memoization for repeated calculations
  - Avoid premature optimization

✅ Monitoring
  - Slow queries logged
  - Memory usage tracked
  - Response times measured
  - Bottlenecks profiled

✅ Frontend (if applicable)
  - Minimize bundle size
  - Code splitting
  - Lazy load images
  - Use CDN for static assets
</performance-checklist>
```

## Remember

1. **Profile first** - Don't guess where the bottleneck is
2. **Set targets** - "Reduce load time by 50%" not "make it faster"
3. **Measure improvement** - Did the optimization work?
4. **Consider trade-offs** - Complexity vs performance gain
5. **Document findings** - What worked, what didn't, why

**Premature optimization is the root of all evil** - Donald Knuth

Optimize when you have evidence of a performance problem, not before.
