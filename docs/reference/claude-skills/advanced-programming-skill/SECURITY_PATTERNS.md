# Security Patterns & Best Practices

Comprehensive security patterns for building secure applications.

## Principle 1: Defense in Depth

Never rely on a single security measure. Layer multiple defenses.

```
<security-layers>
1. Input Validation (first line)
2. Authentication (verify identity)
3. Authorization (verify permissions)
4. Encryption (protect data)
5. Logging & Monitoring (detect breaches)
6. Incident Response (handle breaches)
</security-layers>
```

**Example: Protecting an API Endpoint**
```python
@app.route('/api/user/<user_id>/data', methods=['GET'])
def get_user_data(user_id):
    # Layer 1: Input validation
    if not is_valid_uuid(user_id):
        return {'error': 'Invalid ID format'}, 400

    # Layer 2: Authentication
    token = request.headers.get('Authorization')
    current_user = verify_jwt_token(token)
    if not current_user:
        return {'error': 'Unauthorized'}, 401

    # Layer 3: Authorization
    if not current_user.can_access_user(user_id):
        return {'error': 'Forbidden'}, 403

    # Layer 4: Rate limiting (DoS protection)
    if not rate_limiter.allow(current_user.id):
        return {'error': 'Too many requests'}, 429

    # Layer 5: Data access (encrypted at rest)
    data = database.get_user_data(user_id)  # DB encryption

    # Layer 6: Audit logging
    audit_log.record('data_access', {
        'user': current_user.id,
        'resource': user_id,
        'timestamp': datetime.now()
    })

    # Layer 7: Response (encrypted in transit via HTTPS)
    return data, 200
```

## Pattern 1: Input Validation

**Never trust user input. Validate everything.**

### Allowlist > Denylist
```python
# ❌ Denylist (easily bypassed)
def is_safe_filename(filename):
    dangerous = ['..', '/', '\\', '<', '>', '|']
    for char in dangerous:
        if char in filename:
            return False
    return True

# ✅ Allowlist (explicit about what's allowed)
def is_safe_filename(filename):
    # Only alphanumeric, dash, underscore, and dot
    pattern = r'^[a-zA-Z0-9_\-\.]+$'
    if not re.match(pattern, filename):
        return False

    # Additional checks
    if filename.startswith('.'):
        return False  # No hidden files
    if '..' in filename:
        return False  # No path traversal

    return True
```

### Type Validation
```python
from pydantic import BaseModel, validator, Field
from typing import Optional

class UserInput(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    email: str
    age: Optional[int] = Field(None, ge=0, le=150)

    @validator('username')
    def validate_username(cls, v):
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v

    @validator('email')
    def validate_email(cls, v):
        if '@' not in v or '.' not in v:
            raise ValueError('Invalid email format')
        return v.lower()

# Usage
try:
    user_data = UserInput(**request.json)
    # Now user_data is guaranteed valid
except ValidationError as e:
    return {'error': str(e)}, 400
```

## Pattern 2: SQL Injection Prevention

**Always use parameterized queries. Never concatenate SQL.**

```python
# ❌ VULNERABLE to SQL injection
def get_user(username):
    query = f"SELECT * FROM users WHERE username = '{username}'"
    return db.execute(query)

# Attack: username = "admin' OR '1'='1"
# Results in: SELECT * FROM users WHERE username = 'admin' OR '1'='1'
# Returns all users!

# ✅ SAFE with parameters
def get_user(username):
    query = "SELECT * FROM users WHERE username = ?"
    return db.execute(query, (username,))

# ORM usage (also safe)
def get_user(username):
    return User.query.filter_by(username=username).first()
```

### Advanced: Dynamic Queries
```python
# When building dynamic queries, still use parameters
def search_users(filters):
    query = "SELECT * FROM users WHERE 1=1"
    params = []

    if filters.get('username'):
        query += " AND username = ?"
        params.append(filters['username'])

    if filters.get('age_min'):
        query += " AND age >= ?"
        params.append(filters['age_min'])

    if filters.get('active') is not None:
        query += " AND active = ?"
        params.append(filters['active'])

    return db.execute(query, params)
```

## Pattern 3: Authentication & Password Security

### Password Hashing
```python
import bcrypt

# ❌ NEVER store plain passwords
def store_password_bad(user, password):
    user.password = password  # EXTREMELY DANGEROUS

# ❌ NEVER use MD5 or SHA1 for passwords
def store_password_weak(user, password):
    user.password = hashlib.md5(password.encode()).hexdigest()

# ✅ Use bcrypt, argon2, or scrypt
def store_password_good(user, password):
    salt = bcrypt.gensalt(rounds=12)  # Cost factor
    hashed = bcrypt.hashpw(password.encode(), salt)
    user.password_hash = hashed

def verify_password(user, password):
    return bcrypt.checkpw(password.encode(), user.password_hash)
```

### JWT Security
```python
import jwt
from datetime import datetime, timedelta

SECRET_KEY = os.environ['JWT_SECRET']  # From environment, not in code!

def create_jwt(user_id):
    payload = {
        'user_id': user_id,
        'iat': datetime.utcnow(),  # Issued at
        'exp': datetime.utcnow() + timedelta(hours=24),  # Expiration
        'jti': str(uuid.uuid4())  # JWT ID (for revocation)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_jwt(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])

        # Check if token is revoked
        if is_token_revoked(payload['jti']):
            return None

        return payload
    except jwt.ExpiredSignatureError:
        return None  # Token expired
    except jwt.InvalidTokenError:
        return None  # Invalid token
```

## Pattern 4: Authorization (Access Control)

### Role-Based Access Control (RBAC)
```python
from enum import Enum

class Role(Enum):
    ADMIN = 'admin'
    EDITOR = 'editor'
    VIEWER = 'viewer'

class Permission(Enum):
    READ = 'read'
    WRITE = 'write'
    DELETE = 'delete'
    ADMIN = 'admin'

ROLE_PERMISSIONS = {
    Role.ADMIN: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN],
    Role.EDITOR: [Permission.READ, Permission.WRITE],
    Role.VIEWER: [Permission.READ]
}

def has_permission(user, required_permission):
    user_permissions = ROLE_PERMISSIONS.get(user.role, [])
    return required_permission in user_permissions

# Usage
def delete_article(user, article_id):
    if not has_permission(user, Permission.DELETE):
        raise PermissionDeniedError("You don't have delete permission")

    article = Article.get(article_id)
    article.delete()
```

### Attribute-Based Access Control (ABAC)
```python
def can_access_resource(user, resource, action):
    """
    More flexible: consider user attributes, resource attributes, context
    """
    # Owner can do anything
    if resource.owner_id == user.id:
        return True

    # Admins can do anything
    if user.role == Role.ADMIN:
        return True

    # Editors can modify if resource is in draft
    if action == 'edit' and user.role == Role.EDITOR and resource.status == 'draft':
        return True

    # Anyone can read published resources
    if action == 'read' and resource.status == 'published':
        return True

    # Team members can access team resources
    if user.team_id == resource.team_id and action in ['read', 'comment']:
        return True

    return False
```

## Pattern 5: XSS (Cross-Site Scripting) Prevention

### Output Encoding
```python
from markupsafe import escape

# ❌ VULNERABLE to XSS
@app.route('/profile/<username>')
def profile(username):
    return f"<h1>Welcome {username}</h1>"

# Attack: username = "<script>alert('XSS')</script>"
# Executes JavaScript in victim's browser!

# ✅ SAFE with escaping
@app.route('/profile/<username>')
def profile(username):
    return f"<h1>Welcome {escape(username)}</h1>"

# Or use template engine (auto-escapes)
@app.route('/profile/<username>')
def profile(username):
    return render_template('profile.html', username=username)
```

### Content Security Policy (CSP)
```python
@app.after_request
def add_security_headers(response):
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.example.com; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' https://fonts.gstatic.com; "
        "frame-ancestors 'none';"
    )
    return response
```

## Pattern 6: CSRF (Cross-Site Request Forgery) Prevention

```python
from flask_wtf.csrf import CSRFProtect

csrf = CSRFProtect(app)

# Token automatically added to forms
@app.route('/transfer', methods=['POST'])
def transfer_money():
    # CSRF token automatically validated
    amount = request.form['amount']
    recipient = request.form['recipient']

    # Process transfer
    return {'success': True}

# For AJAX requests
@app.route('/api/transfer', methods=['POST'])
def api_transfer():
    token = request.headers.get('X-CSRF-Token')
    if not verify_csrf_token(token):
        return {'error': 'Invalid CSRF token'}, 403

    # Process transfer
    return {'success': True}
```

## Pattern 7: Secure File Upload

```python
import os
import hashlib
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return {'error': 'No file provided'}, 400

    file = request.files['file']

    # Check if file selected
    if file.filename == '':
        return {'error': 'No file selected'}, 400

    # Validate extension
    if not allowed_file(file.filename):
        return {'error': 'File type not allowed'}, 400

    # Validate size
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > MAX_FILE_SIZE:
        return {'error': 'File too large'}, 400

    # Sanitize filename
    filename = secure_filename(file.filename)

    # Generate unique filename (prevent overwriting)
    file_hash = hashlib.sha256(file.read()).hexdigest()
    file.seek(0)
    ext = filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{file_hash}.{ext}"

    # Save to secure location (not web-accessible)
    upload_folder = os.path.join(app.config['UPLOAD_FOLDER'], 'uploads')
    os.makedirs(upload_folder, exist_ok=True)
    filepath = os.path.join(upload_folder, unique_filename)

    file.save(filepath)

    # Scan for malware (if critical)
    # scan_file_for_malware(filepath)

    return {'success': True, 'file_id': file_hash}
```

## Pattern 8: Secrets Management

```python
import os
from cryptography.fernet import Fernet

# ❌ NEVER hardcode secrets
API_KEY = "sk_live_abc123xyz789"  # DANGEROUS!

# ✅ Use environment variables
API_KEY = os.environ.get('STRIPE_API_KEY')
if not API_KEY:
    raise ValueError("STRIPE_API_KEY environment variable not set")

# ✅ Use secrets management service
from google.cloud import secretmanager

def get_secret(secret_id):
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{PROJECT_ID}/secrets/{secret_id}/versions/latest"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode('UTF-8')

# ✅ Encrypt secrets at rest
def encrypt_secret(plaintext):
    key = os.environ['ENCRYPTION_KEY'].encode()
    f = Fernet(key)
    return f.encrypt(plaintext.encode())

def decrypt_secret(ciphertext):
    key = os.environ['ENCRYPTION_KEY'].encode()
    f = Fernet(key)
    return f.decrypt(ciphertext).decode()
```

## Pattern 9: Rate Limiting

```python
from functools import wraps
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Global rate limit
@app.route("/api/resource")
@limiter.limit("10 per minute")
def resource():
    return {'data': 'value'}

# Per-user rate limit
def user_rate_limit():
    user = get_current_user()
    if user.is_premium:
        return "1000 per hour"
    return "100 per hour"

@app.route("/api/expensive_operation")
@limiter.limit(user_rate_limit)
def expensive_operation():
    return {'result': 'computed'}
```

## Pattern 10: Security Headers

```python
@app.after_request
def add_security_headers(response):
    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'DENY'

    # Prevent MIME sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'

    # XSS Protection (legacy browsers)
    response.headers['X-XSS-Protection'] = '1; mode=block'

    # HTTPS only
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

    # Content Security Policy
    response.headers['Content-Security-Policy'] = "default-src 'self'"

    # Referrer Policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

    # Permissions Policy
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'

    return response
```

## Security Checklist

```
<security-checklist>
✅ Input Validation
  - All user input validated
  - Allowlist approach used
  - Type checking enforced

✅ Authentication
  - Passwords hashed with bcrypt/argon2
  - Multi-factor authentication available
  - Account lockout after failed attempts
  - Password reset secure (tokens expire)

✅ Authorization
  - Principle of least privilege
  - Authorization checked on every request
  - No direct object reference vulnerabilities

✅ Data Protection
  - Sensitive data encrypted at rest
  - HTTPS enforced (no HTTP)
  - Secure session management
  - Secrets in environment/vault, not code

✅ SQL Injection
  - Parameterized queries always
  - ORM used correctly
  - No raw SQL concatenation

✅ XSS Prevention
  - Output encoded/escaped
  - Content Security Policy set
  - Templates auto-escape by default

✅ CSRF Prevention
  - CSRF tokens on all state-changing requests
  - SameSite cookie attribute set

✅ Logging & Monitoring
  - Security events logged
  - Sensitive data not logged
  - Log anomalies detected
  - Incident response plan exists

✅ Dependencies
  - Dependencies regularly updated
  - Security advisories monitored
  - Dependency scanning in CI/CD

✅ Error Handling
  - Errors don't leak sensitive info
  - Generic error messages to users
  - Detailed errors only in logs
</security-checklist>
```

## Security Testing

```python
# Example: Testing for SQL injection
def test_sql_injection_username():
    malicious_input = "admin' OR '1'='1"
    response = client.get(f'/user/{malicious_input}')

    # Should return 400 (bad request) or 404 (not found)
    # Should NOT return user data
    assert response.status_code in [400, 404]
    assert 'admin' not in response.data.decode()

# Example: Testing for XSS
def test_xss_in_profile():
    xss_payload = "<script>alert('XSS')</script>"
    response = client.post('/profile/update', data={'bio': xss_payload})

    # Verify script is escaped in HTML
    html = response.data.decode()
    assert '<script>' not in html
    assert '&lt;script&gt;' in html or 'script' not in html

# Example: Testing authorization
def test_unauthorized_access():
    # Login as user1
    login('user1', 'password1')

    # Try to access user2's data
    response = client.get('/api/user/2/private')

    # Should be forbidden
    assert response.status_code == 403
```

Remember: **Security is a process, not a product. Stay updated, test regularly, assume breach.**
