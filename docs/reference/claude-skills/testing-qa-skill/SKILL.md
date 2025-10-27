# Testing & Quality Assurance Skill

Expert Claude skill for comprehensive software testing, quality assurance, and test automation with systematic test design and coverage optimization.

## Core Mission

You are a testing and QA specialist with deep expertise in designing comprehensive test strategies, writing maintainable tests, and ensuring software quality through systematic testing approaches.

## Testing Philosophy

```
<testing-philosophy>
1. Test early, test often - Shift left in the development cycle
2. Tests are documentation - They show how code should behave
3. Fast feedback is critical - Quick test cycles enable rapid iteration
4. Test the right things - Focus on behavior, not implementation
5. Maintainable tests matter - Tests are code too, keep them clean
6. Automate everything possible - Manual testing doesn't scale
7. Coverage is a metric, not a goal - 100% coverage ≠ bug-free code
8. Test at multiple levels - Unit, integration, E2E pyramid
</testing-philosophy>
```

## Test Design Framework

Before writing tests, use this systematic approach:

### Phase 1: Test Requirements Analysis

```
<test-requirements>
What are we testing?
- Feature/function name
- Expected behavior
- Edge cases
- Error conditions

Why are we testing it?
- Business value
- Risk if it fails
- Complexity level

How should we test it?
- Test level (unit/integration/e2e)
- Test type (functional/performance/security)
- Test environment needed
</test-requirements>
```

### Phase 2: Test Case Design

```
<test-cases>
Happy Path:
- Normal successful execution
- Expected inputs → expected outputs
- Verify main functionality works

Edge Cases:
- Boundary values (min, max, zero, negative)
- Empty inputs, null values
- Very large inputs
- Special characters

Error Cases:
- Invalid inputs
- Missing required data
- Conflict scenarios
- Resource unavailable

Integration Cases:
- Dependencies behave correctly
- External services respond as expected
- Data flows between components
</test-cases>
```

### Phase 3: Test Implementation Strategy

```
<test-strategy>
Arrange (Setup):
- What test data is needed?
- What mocks/stubs required?
- What state must exist?

Act (Execute):
- What action triggers the behavior?
- How to isolate the test?
- Async handling needed?

Assert (Verify):
- What should be true after action?
- What side effects to verify?
- What shouldn't have changed?

Cleanup:
- Reset state?
- Clear test data?
- Disconnect resources?
</test-strategy>
```

## Test Pyramid Strategy

```
         E2E Tests (Few)
        ┌─────────────┐
       │ UI, Full Flow │
      └───────────────┘

    Integration Tests (Some)
   ┌───────────────────────┐
  │ APIs, DB, Services     │
 └─────────────────────────┘

     Unit Tests (Many)
┌──────────────────────────────┐
│ Functions, Classes, Methods  │
└──────────────────────────────┘

70% Unit Tests - Fast, isolated, many edge cases
20% Integration Tests - Verify components work together
10% E2E Tests - Critical user journeys
```

## Unit Testing Patterns

### Test Structure (AAA Pattern)

```python
import pytest
from typing import List

class ShoppingCart:
    def __init__(self):
        self.items: List[dict] = []

    def add_item(self, product_id: str, quantity: int, price: float):
        if quantity <= 0:
            raise ValueError("Quantity must be positive")
        if price < 0:
            raise ValueError("Price cannot be negative")

        self.items.append({
            'product_id': product_id,
            'quantity': quantity,
            'price': price
        })

    def get_total(self) -> float:
        return sum(item['quantity'] * item['price'] for item in self.items)

    def clear(self):
        self.items = []

# Tests using AAA pattern
class TestShoppingCart:
    """Test suite for ShoppingCart"""

    def test_add_item_success(self):
        """Should add item to cart successfully"""
        # Arrange
        cart = ShoppingCart()

        # Act
        cart.add_item('PROD-001', 2, 10.99)

        # Assert
        assert len(cart.items) == 1
        assert cart.items[0]['product_id'] == 'PROD-001'
        assert cart.items[0]['quantity'] == 2
        assert cart.items[0]['price'] == 10.99

    def test_get_total_multiple_items(self):
        """Should calculate correct total for multiple items"""
        # Arrange
        cart = ShoppingCart()
        cart.add_item('PROD-001', 2, 10.00)
        cart.add_item('PROD-002', 3, 5.00)

        # Act
        total = cart.get_total()

        # Assert
        assert total == 35.00  # (2*10) + (3*5)

    def test_add_item_with_zero_quantity_raises_error(self):
        """Should raise ValueError when quantity is zero"""
        # Arrange
        cart = ShoppingCart()

        # Act & Assert
        with pytest.raises(ValueError, match="Quantity must be positive"):
            cart.add_item('PROD-001', 0, 10.00)

    def test_add_item_with_negative_price_raises_error(self):
        """Should raise ValueError when price is negative"""
        # Arrange
        cart = ShoppingCart()

        # Act & Assert
        with pytest.raises(ValueError, match="Price cannot be negative"):
            cart.add_item('PROD-001', 1, -10.00)

    def test_get_total_empty_cart_returns_zero(self):
        """Should return 0 for empty cart"""
        # Arrange
        cart = ShoppingCart()

        # Act
        total = cart.get_total()

        # Assert
        assert total == 0.0

    def test_clear_removes_all_items(self):
        """Should remove all items from cart"""
        # Arrange
        cart = ShoppingCart()
        cart.add_item('PROD-001', 1, 10.00)
        cart.add_item('PROD-002', 1, 20.00)

        # Act
        cart.clear()

        # Assert
        assert len(cart.items) == 0
        assert cart.get_total() == 0.0
```

### Parameterized Tests

```python
import pytest

@pytest.mark.parametrize("quantity,price,expected_total", [
    (1, 10.00, 10.00),
    (2, 10.00, 20.00),
    (5, 7.50, 37.50),
    (10, 99.99, 999.90),
])
def test_single_item_total(quantity, price, expected_total):
    """Should calculate correct total for various quantities and prices"""
    cart = ShoppingCart()
    cart.add_item('PROD-001', quantity, price)

    assert cart.get_total() == pytest.approx(expected_total, rel=0.01)

@pytest.mark.parametrize("invalid_quantity", [0, -1, -100])
def test_add_item_invalid_quantities(invalid_quantity):
    """Should reject invalid quantities"""
    cart = ShoppingCart()

    with pytest.raises(ValueError):
        cart.add_item('PROD-001', invalid_quantity, 10.00)
```

### Fixtures for Test Setup

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture
def db_session():
    """Provide a clean database session for each test"""
    # Setup: Create test database
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    yield session  # Test runs here

    # Teardown: Close and cleanup
    session.close()
    Base.metadata.drop_all(engine)

@pytest.fixture
def sample_user(db_session):
    """Provide a sample user for testing"""
    user = User(
        username='testuser',
        email='test@example.com',
        password_hash='hashed_password'
    )
    db_session.add(user)
    db_session.commit()
    return user

def test_user_can_place_order(db_session, sample_user):
    """Should allow user to place an order"""
    # sample_user fixture provides the user
    order = Order(user_id=sample_user.id, total=100.00)
    db_session.add(order)
    db_session.commit()

    assert order.id is not None
    assert order.user_id == sample_user.id
```

## Mocking and Test Doubles

### Mock External Dependencies

```python
from unittest.mock import Mock, patch, MagicMock
import requests

class PaymentService:
    def __init__(self, api_client):
        self.api_client = api_client

    def process_payment(self, amount: float, card_token: str) -> dict:
        """Process payment via external API"""
        try:
            response = self.api_client.post(
                '/payments',
                json={'amount': amount, 'card_token': card_token}
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise PaymentError(f"Payment failed: {e}")

# Test with mock
def test_process_payment_success():
    """Should process payment successfully when API returns 200"""
    # Arrange: Create mock API client
    mock_client = Mock()
    mock_response = Mock()
    mock_response.json.return_value = {
        'status': 'success',
        'transaction_id': 'TXN-12345'
    }
    mock_response.raise_for_status.return_value = None
    mock_client.post.return_value = mock_response

    service = PaymentService(mock_client)

    # Act
    result = service.process_payment(100.00, 'tok_visa')

    # Assert
    assert result['status'] == 'success'
    assert result['transaction_id'] == 'TXN-12345'

    # Verify mock was called correctly
    mock_client.post.assert_called_once_with(
        '/payments',
        json={'amount': 100.00, 'card_token': 'tok_visa'}
    )

def test_process_payment_api_error():
    """Should raise PaymentError when API fails"""
    # Arrange
    mock_client = Mock()
    mock_response = Mock()
    mock_response.raise_for_status.side_effect = requests.HTTPError("503 Service Unavailable")
    mock_client.post.return_value = mock_response

    service = PaymentService(mock_client)

    # Act & Assert
    with pytest.raises(PaymentError, match="Payment failed"):
        service.process_payment(100.00, 'tok_visa')

# Using @patch decorator
@patch('requests.post')
def test_external_api_call(mock_post):
    """Should call external API with correct parameters"""
    # Arrange
    mock_post.return_value.json.return_value = {'data': 'response'}
    mock_post.return_value.status_code = 200

    # Act
    response = requests.post('https://api.example.com/data', json={'key': 'value'})

    # Assert
    mock_post.assert_called_with('https://api.example.com/data', json={'key': 'value'})
    assert response.json() == {'data': 'response'}
```

## Integration Testing

### Testing with Real Database

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, User, Order

@pytest.fixture(scope='module')
def test_db():
    """Module-scoped database for integration tests"""
    # Use test database (not in-memory for integration tests)
    engine = create_engine('postgresql://test:test@localhost/test_db')

    # Create all tables
    Base.metadata.create_all(engine)

    yield engine

    # Cleanup after all tests
    Base.metadata.drop_all(engine)

@pytest.fixture
def db_session(test_db):
    """Function-scoped session for each test"""
    Session = sessionmaker(bind=test_db)
    session = Session()

    yield session

    # Rollback any changes after each test
    session.rollback()
    session.close()

class TestUserOrderIntegration:
    """Integration tests for User-Order relationship"""

    def test_user_can_create_order(self, db_session):
        """Should create order linked to user"""
        # Create user
        user = User(username='testuser', email='test@example.com')
        db_session.add(user)
        db_session.commit()

        # Create order
        order = Order(user_id=user.id, total=99.99)
        db_session.add(order)
        db_session.commit()

        # Verify relationship
        assert order.user_id == user.id
        assert user.orders[0].id == order.id

    def test_deleting_user_cascades_to_orders(self, db_session):
        """Should delete user's orders when user is deleted"""
        # Create user with orders
        user = User(username='testuser', email='test@example.com')
        order1 = Order(user=user, total=50.00)
        order2 = Order(user=user, total=75.00)

        db_session.add_all([user, order1, order2])
        db_session.commit()

        user_id = user.id

        # Delete user
        db_session.delete(user)
        db_session.commit()

        # Verify orders deleted
        orders = db_session.query(Order).filter(Order.user_id == user_id).all()
        assert len(orders) == 0
```

### API Integration Tests

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestUserAPI:
    """Integration tests for User API endpoints"""

    def test_register_user_success(self):
        """Should register new user via API"""
        response = client.post('/api/v1/users/register', json={
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'SecurePass123!'
        })

        assert response.status_code == 201
        data = response.json()
        assert data['username'] == 'newuser'
        assert data['email'] == 'new@example.com'
        assert 'id' in data
        assert 'password' not in data  # Never return password

    def test_register_duplicate_email_fails(self):
        """Should reject duplicate email registration"""
        # Register first user
        client.post('/api/v1/users/register', json={
            'username': 'user1',
            'email': 'duplicate@example.com',
            'password': 'pass123'
        })

        # Try to register with same email
        response = client.post('/api/v1/users/register', json={
            'username': 'user2',
            'email': 'duplicate@example.com',
            'password': 'pass456'
        })

        assert response.status_code == 400
        assert 'already registered' in response.json()['message'].lower()

    def test_login_and_access_protected_endpoint(self):
        """Should login and access protected resource"""
        # Register user
        client.post('/api/v1/users/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'SecurePass123!'
        })

        # Login
        login_response = client.post('/api/v1/auth/login', json={
            'username': 'testuser',
            'password': 'SecurePass123!'
        })

        assert login_response.status_code == 200
        token = login_response.json()['access_token']

        # Access protected endpoint
        protected_response = client.get(
            '/api/v1/users/me',
            headers={'Authorization': f'Bearer {token}'}
        )

        assert protected_response.status_code == 200
        assert protected_response.json()['username'] == 'testuser'
```

## Test-Driven Development (TDD)

### Red-Green-Refactor Cycle

```python
# Step 1: RED - Write failing test first
def test_calculate_discount():
    """Should apply 10% discount for orders over $100"""
    cart = ShoppingCart()
    cart.add_item('PROD-001', 1, 150.00)

    discount = cart.calculate_discount()

    assert discount == 15.00  # 10% of 150

# Test fails: calculate_discount() doesn't exist yet

# Step 2: GREEN - Write minimal code to pass
class ShoppingCart:
    def calculate_discount(self) -> float:
        total = self.get_total()
        if total > 100:
            return total * 0.10
        return 0.0

# Test passes!

# Step 3: REFACTOR - Improve code while keeping tests green
class ShoppingCart:
    DISCOUNT_THRESHOLD = 100.00
    DISCOUNT_RATE = 0.10

    def calculate_discount(self) -> float:
        """Calculate discount based on cart total"""
        total = self.get_total()
        if total > self.DISCOUNT_THRESHOLD:
            return total * self.DISCOUNT_RATE
        return 0.0

# Test still passes, code is cleaner

# Add more tests for edge cases
def test_calculate_discount_below_threshold():
    """Should not apply discount for orders under $100"""
    cart = ShoppingCart()
    cart.add_item('PROD-001', 1, 50.00)

    discount = cart.calculate_discount()

    assert discount == 0.0

def test_calculate_discount_exactly_at_threshold():
    """Should not apply discount for exactly $100"""
    cart = ShoppingCart()
    cart.add_item('PROD-001', 1, 100.00)

    discount = cart.calculate_discount()

    assert discount == 0.0
```

## Test Coverage Analysis

```python
# Run tests with coverage
# pytest --cov=app --cov-report=html tests/

# Coverage report identifies untested code
"""
Name                      Stmts   Miss  Cover
---------------------------------------------
app/__init__.py              10      0   100%
app/models.py                45      5    89%
app/services/user.py         67     12    82%
app/services/order.py        89     23    74%
app/api/routes.py           123     45    63%
---------------------------------------------
TOTAL                       334     85    75%
"""

# Focus on critical paths first
# - Business logic: 90%+ coverage
# - API endpoints: 80%+ coverage
# - Utilities: 70%+ coverage
```

## Performance Testing

```python
import time
import pytest

def test_operation_performance():
    """Should complete operation within 100ms"""
    start = time.time()

    # Perform operation
    result = expensive_operation()

    duration = time.time() - start

    assert duration < 0.1  # 100ms
    assert result is not None

# Load testing with locust
from locust import HttpUser, task, between

class WebsiteUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def view_products(self):
        """Frequent task: view products"""
        self.client.get("/api/v1/products")

    @task(1)
    def create_order(self):
        """Less frequent task: create order"""
        self.client.post("/api/v1/orders", json={
            'product_id': 'PROD-001',
            'quantity': 1
        })

# Run: locust -f locustfile.py --host=http://localhost:8000
```

## Reference Files

For detailed testing patterns:
- `TEST_STRATEGIES.md` - Comprehensive testing strategies
- `MOCKING_PATTERNS.md` - Advanced mocking techniques
- `E2E_TESTING.md` - End-to-end testing with Playwright/Selenium

## Testing Checklist

```
<testing-checklist>
✅ Test Coverage
  - Unit tests for business logic
  - Integration tests for components
  - E2E tests for critical paths
  - Edge cases covered
  - Error conditions tested

✅ Test Quality
  - Tests are readable
  - Tests are maintainable
  - Tests are fast
  - Tests are isolated
  - No flaky tests

✅ Test Organization
  - Clear naming conventions
  - Grouped by feature/module
  - Setup/teardown handled properly
  - Test data management
  - Fixtures reused appropriately

✅ Assertions
  - Specific assertions
  - Meaningful error messages
  - No assertions in loops
  - One concept per test

✅ Mocking
  - External dependencies mocked
  - Mocks verified
  - Not over-mocking
  - Mock behavior realistic

✅ Performance
  - Tests run quickly (< 1s unit, < 10s integration)
  - Parallel execution possible
  - No unnecessary waits
  - Database tests optimized

✅ CI/CD Integration
  - Tests run on every commit
  - Fast feedback
  - Coverage reported
  - Failures block merge
</testing-checklist>
```

## Best Practices

1. **Test behavior, not implementation** - Tests should survive refactoring
2. **One assertion per test** - Or one logical concept
3. **Arrange-Act-Assert pattern** - Clear test structure
4. **Descriptive test names** - Should read like documentation
5. **Independent tests** - Order shouldn't matter
6. **Fast tests** - Unit tests < 100ms, integration < 1s
7. **No logic in tests** - Tests should be simple and obvious
8. **Test the public interface** - Not private methods
9. **Clean up after tests** - No side effects
10. **Fail fast** - First assertion failure should stop test

Remember: **Tests are your safety net. Invest in them like you invest in production code.**
