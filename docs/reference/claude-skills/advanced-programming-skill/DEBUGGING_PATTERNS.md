# Advanced Debugging Patterns

Comprehensive debugging techniques and patterns for systematic problem-solving.

## Pattern 1: Binary Search Debugging

When facing a complex codebase with an unknown bug location:

```
<binary-search-debug>
1. Identify the input (good state) and output (bad state)
2. Find the midpoint in execution flow
3. Check state at midpoint
4. If state is good at midpoint:
   - Bug is in second half
   - Repeat with second half
5. If state is bad at midpoint:
   - Bug is in first half
   - Repeat with first half
6. Continue until bug location isolated
</binary-search-debug>
```

**Example:**
```python
# Bug: Function returns wrong result
# Known: input is correct, output is wrong
# Unknown: which of 10 steps causes the problem

def debug_binary_search(data):
    step1_result = step1(data)
    step2_result = step2(step1_result)
    step3_result = step3(step2_result)
    step4_result = step4(step3_result)
    step5_result = step5(step4_result)

    # Check midpoint (step 5)
    print(f"After step 5: {step5_result}")
    validate_state(step5_result)  # Is state still valid?

    # If valid: bug in steps 6-10
    # If invalid: bug in steps 1-5, repeat with step 2-3 as new midpoint
```

## Pattern 2: State Snapshot Comparison

For bugs that appear after a series of operations:

```
<state-snapshot-debug>
1. Take snapshot of state at known-good point
2. Execute operation that should work
3. Take snapshot of state after operation
4. Compare snapshots field by field
5. Identify unexpected changes
6. Trace backwards to find what caused unexpected change
</state-snapshot-debug>
```

**Example:**
```python
def debug_state_comparison(obj):
    # Snapshot before
    before = {
        'id': obj.id,
        'status': obj.status,
        'items': obj.items.copy(),
        'metadata': obj.metadata.copy()
    }

    # Operation that might corrupt state
    obj.process()

    # Snapshot after
    after = {
        'id': obj.id,
        'status': obj.status,
        'items': obj.items.copy(),
        'metadata': obj.metadata.copy()
    }

    # Compare
    for key in before:
        if before[key] != after[key]:
            print(f"Unexpected change in {key}:")
            print(f"  Before: {before[key]}")
            print(f"  After:  {after[key]}")
```

## Pattern 3: Minimal Reproduction

For complex bugs that only appear in specific scenarios:

```
<minimal-repro-pattern>
1. Start with full failing scenario
2. Remove one component/condition at a time
3. After each removal, test if bug still occurs
4. If bug disappears, that component is necessary
5. If bug persists, that component is irrelevant
6. Continue until you have minimal set that reproduces bug
7. Each necessary component provides a clue to root cause
</minimal-repro-pattern>
```

**Example:**
```python
# Original failing scenario (complex)
def test_complex_scenario():
    user = create_user(name="John", age=30, role="admin")
    product = create_product(name="Widget", price=100, category="tools")
    cart = create_cart(user)
    cart.add_item(product, quantity=2)
    order = checkout(cart, payment_method="credit_card", shipping="express")
    assert order.total == 200  # FAILS

# Minimal reproduction (after removing irrelevant parts)
def test_minimal_repro():
    user = create_user()  # defaults don't matter
    cart = create_cart(user)
    product = create_product(price=100)  # name, category irrelevant
    cart.add_item(product, quantity=2)  # bug happens here!
    # Discovered: cart.add_item doesn't multiply price by quantity
```

## Pattern 4: Time-Travel Debugging

For bugs that appeared after changes:

```
<time-travel-debug>
1. Use git bisect to find the commit that introduced bug
   $ git bisect start
   $ git bisect bad  # current version has bug
   $ git bisect good <last-known-good-commit>

2. Git will checkout commits in binary search pattern
3. At each commit, test if bug exists
   $ git bisect good  # if bug absent
   $ git bisect bad   # if bug present

4. Git will narrow down to exact commit
5. Examine that commit's diff to find the cause
6. Understand why that change caused the bug
</time-travel-debug>
```

**Process:**
```bash
# Example session
$ git bisect start
$ git bisect bad HEAD
$ git bisect good v2.1.0

# Git checks out commit in middle
$ npm test  # or your test command
# Test fails

$ git bisect bad
# Git checks out another commit
$ npm test
# Test passes

$ git bisect good
# Continues until finding exact commit

# Result:
# abc123 is the first bad commit
# commit abc123
# Author: Dev <dev@example.com>
# Date:   Mon Jan 15 10:30:00 2024
#
#     Refactor user validation logic
#
# Now examine diff of abc123 to find bug
```

## Pattern 5: Rubber Duck Debugging++

Enhanced version with structured explanation:

```
<rubber-duck-plus>
Explain to imaginary colleague:

1. System Context:
   "We have a system that does X using Y technology..."

2. Expected Behavior:
   "When user does A, the system should respond with B because..."

3. Actual Behavior:
   "Instead, the system responds with C, which manifests as..."

4. Investigation So Far:
   "I've checked X and found Y. I've ruled out Z because..."

5. Current Hypothesis:
   "I think the problem might be in Q because R..."

6. Remaining Questions:
   "But I'm not sure why S happens when T occurs..."

Often, the act of structuring this explanation reveals the bug.
</rubber-duck-plus>
```

## Pattern 6: Assertion Injection

For tracking down state corruption:

```python
class DebugAssertions:
    """Temporary debugging assertions to catch state corruption early"""

    @staticmethod
    def validate_user(user):
        assert user.id > 0, f"Invalid user ID: {user.id}"
        assert user.email, "User email is empty"
        assert '@' in user.email, f"Invalid email format: {user.email}"
        assert user.created_at <= datetime.now(), "User creation date is in future"

    @staticmethod
    def validate_cart(cart):
        assert cart.items is not None, "Cart items is None"
        assert len(cart.items) >= 0, "Cart items length is negative"
        for item in cart.items:
            assert item.quantity > 0, f"Invalid quantity: {item.quantity}"
            assert item.price >= 0, f"Invalid price: {item.price}"

# Inject assertions at strategic points
def process_order(user, cart):
    DebugAssertions.validate_user(user)  # Catch bad input early
    DebugAssertions.validate_cart(cart)

    # ... rest of function ...

    DebugAssertions.validate_cart(cart)  # Catch corruption during processing
```

## Pattern 7: Differential Debugging

Comparing behavior between working and broken versions:

```
<differential-debug>
1. Set up working version in parallel (separate branch/environment)
2. Instrument both versions with identical logging
3. Run same operation in both
4. Compare logs side-by-side
5. First point of divergence indicates where bug is introduced
6. Examine code at divergence point
</differential-debug>
```

**Example:**
```python
# Instrument both versions identically
import logging

def process_data(data):
    logging.info(f"[TRACE] Input: {data}")

    result = step1(data)
    logging.info(f"[TRACE] After step1: {result}")

    result = step2(result)
    logging.info(f"[TRACE] After step2: {result}")

    result = step3(result)
    logging.info(f"[TRACE] After step3: {result}")

    return result

# Working version output:
# [TRACE] Input: [1, 2, 3]
# [TRACE] After step1: [2, 4, 6]
# [TRACE] After step2: [2, 4, 6]  ← same
# [TRACE] After step3: 12

# Broken version output:
# [TRACE] Input: [1, 2, 3]
# [TRACE] After step1: [2, 4, 6]
# [TRACE] After step2: [4, 6]     ← DIVERGENCE! Check step2
# [TRACE] After step3: 10
```

## Pattern 8: Heisenbug Trapping

For bugs that disappear when you try to debug them:

```
<heisenbug-trap>
1. Add passive monitoring (doesn't change timing)
   - Lightweight logging
   - Metrics collection
   - Trace flags

2. Capture state snapshots at key points
   - Before/after suspected areas
   - Store in circular buffer

3. Add invariant checks (run always, log violations)
   - Check assumptions at entry/exit of functions
   - Validate data structure integrity

4. When bug occurs:
   - Dump captured state
   - Analyze offline
   - Look for violated invariants

5. Gradually add more detailed monitoring near violation points
</heisenbug-trap>
```

**Example:**
```python
from collections import deque
import threading
import time

class HeisenbugTrap:
    def __init__(self, max_snapshots=1000):
        self.snapshots = deque(maxlen=max_snapshots)
        self.lock = threading.Lock()

    def snapshot(self, label, data):
        """Non-blocking state capture"""
        with self.lock:
            self.snapshots.append({
                'time': time.time(),
                'label': label,
                'data': str(data)[:1000],  # Limit size
                'thread': threading.current_thread().name
            })

    def dump_on_violation(self, condition, message):
        """Check invariant, dump if violated"""
        if not condition:
            with self.lock:
                with open('heisenbug_dump.json', 'w') as f:
                    json.dump({
                        'violation': message,
                        'time': time.time(),
                        'snapshots': list(self.snapshots)
                    }, f, indent=2)
            print(f"INVARIANT VIOLATION: {message}")
            print("State dumped to heisenbug_dump.json")

# Usage
trap = HeisenbugTrap()

def suspicious_function(data):
    trap.snapshot('entry', data)

    result = process(data)
    trap.snapshot('after_process', result)

    trap.dump_on_violation(
        len(result) > 0,
        "Result is empty when it shouldn't be"
    )

    return result
```

## Pattern 9: Statistical Debugging

For intermittent bugs with patterns:

```
<statistical-debug>
1. Instrument code to collect data points:
   - When bug occurs: capture full context
   - When bug doesn't occur: capture same context

2. Collect sufficient samples (50+ of each)

3. Analyze differences:
   - What's present in failures but not successes?
   - What's different between the two sets?
   - Are there thresholds or patterns?

4. Form hypothesis based on statistical difference

5. Test hypothesis with targeted experiments
</statistical-debug>
```

**Example:**
```python
import json
from datetime import datetime

class BugStatistics:
    def __init__(self):
        self.success_samples = []
        self.failure_samples = []

    def record_execution(self, is_success, context):
        sample = {
            'timestamp': datetime.now().isoformat(),
            'context': context
        }

        if is_success:
            self.success_samples.append(sample)
        else:
            self.failure_samples.append(sample)

    def analyze(self):
        """Find statistical differences between success and failure"""
        if len(self.success_samples) < 10 or len(self.failure_samples) < 10:
            return "Need more samples"

        # Analyze numeric fields
        for key in self.success_samples[0]['context']:
            success_values = [s['context'][key] for s in self.success_samples
                            if isinstance(s['context'].get(key), (int, float))]
            failure_values = [f['context'][key] for f in self.failure_samples
                            if isinstance(f['context'].get(key), (int, float))]

            if success_values and failure_values:
                success_avg = sum(success_values) / len(success_values)
                failure_avg = sum(failure_values) / len(failure_values)

                if abs(success_avg - failure_avg) > 0.2 * success_avg:
                    print(f"Significant difference in {key}:")
                    print(f"  Success average: {success_avg}")
                    print(f"  Failure average: {failure_avg}")

# Usage
stats = BugStatistics()

def flaky_function(request):
    context = {
        'user_count': len(request.users),
        'data_size': len(request.data),
        'load_factor': get_current_load(),
        'time_of_day': datetime.now().hour
    }

    try:
        result = process_request(request)
        stats.record_execution(True, context)
        return result
    except Exception as e:
        stats.record_execution(False, context)
        raise

# After collecting samples
stats.analyze()
# Output might reveal: "Failures always happen when load_factor > 0.8"
```

## Pattern 10: Dependency Isolation

For bugs involving external dependencies:

```
<dependency-isolation>
1. Replace real dependency with mock/stub
2. If bug disappears:
   - Bug is in dependency or integration layer
   - Test with different mock behaviors

3. If bug persists:
   - Bug is in your code, not dependency
   - Dependency just triggers it

4. Gradually restore real dependency components
   - Replace mocks one at a time
   - Identify which component causes bug
</dependency-isolation>
```

**Example:**
```python
# Original code with bug
def process_payment(amount, user_id):
    user = database.get_user(user_id)  # External dependency
    if user.balance >= amount:
        payment_service.charge(user, amount)  # External dependency
        database.update_balance(user_id, user.balance - amount)
        return True
    return False

# Step 1: Mock all dependencies
class MockDatabase:
    def get_user(self, user_id):
        return User(id=user_id, balance=1000)

    def update_balance(self, user_id, new_balance):
        print(f"Would update {user_id} balance to {new_balance}")

class MockPaymentService:
    def charge(self, user, amount):
        print(f"Would charge ${amount} to user {user.id}")
        return True

# Test with mocks
database = MockDatabase()
payment_service = MockPaymentService()
result = process_payment(100, 1)  # Bug still happens!
# Conclusion: Bug is in our logic, not dependencies

# Step 2: Examine our logic more carefully
# Discovery: Race condition in balance check vs update
# Two concurrent calls can both pass balance check before update
```

## Quick Reference: When to Use Each Pattern

| Pattern | Best For | Time Required |
|---------|----------|---------------|
| Binary Search | Unknown bug location in large code | Medium |
| State Snapshot | State corruption bugs | Low |
| Minimal Reproduction | Complex scenarios | High |
| Time-Travel (git bisect) | Regression bugs | Low-Medium |
| Rubber Duck++ | Mental blocks, unclear thinking | Low |
| Assertion Injection | Data integrity bugs | Low |
| Differential | Comparing versions | Medium |
| Heisenbug Trapping | Race conditions, timing bugs | High |
| Statistical | Intermittent bugs with patterns | High |
| Dependency Isolation | Integration bugs | Medium |

## Debugging Workflow

Recommended workflow for systematic debugging:

```
1. Reproduce Reliably (or understand randomness)
   ↓
2. Minimize Reproduction (remove irrelevant parts)
   ↓
3. Form Hypothesis (what could cause this?)
   ↓
4. Select Debugging Pattern (based on bug type)
   ↓
5. Gather Evidence (using chosen pattern)
   ↓
6. Refine Hypothesis (based on evidence)
   ↓
7. Repeat 4-6 until root cause found
   ↓
8. Implement Fix
   ↓
9. Add Test (to prevent regression)
   ↓
10. Document Learning (for future reference)
```
