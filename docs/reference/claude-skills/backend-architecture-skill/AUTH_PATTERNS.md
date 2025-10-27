# Authentication & Authorization Patterns

Production-tested authentication and authorization patterns for backend systems.

## JWT (JSON Web Token) Authentication

### Complete JWT Implementation

```python
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict
import secrets

class JWTManager:
    """Production-ready JWT manager"""

    def __init__(
        self,
        secret_key: str,
        algorithm: str = 'HS256',
        access_token_expire_minutes: int = 15,
        refresh_token_expire_days: int = 7
    ):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.access_token_expire = timedelta(minutes=access_token_expire_minutes)
        self.refresh_token_expire = timedelta(days=refresh_token_expire_days)

    def create_access_token(self, user_id: str, additional_claims: Optional[Dict] = None) -> str:
        """Create short-lived access token"""
        payload = {
            'sub': user_id,
            'type': 'access',
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + self.access_token_expire,
            'jti': secrets.token_urlsafe(32)  # Unique token ID
        }

        if additional_claims:
            payload.update(additional_claims)

        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def create_refresh_token(self, user_id: str) -> str:
        """Create long-lived refresh token"""
        payload = {
            'sub': user_id,
            'type': 'refresh',
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + self.refresh_token_expire,
            'jti': secrets.token_urlsafe(32)
        }

        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def verify_token(self, token: str, expected_type: str = 'access') -> Optional[Dict]:
        """Verify and decode token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])

            # Verify token type
            if payload.get('type') != expected_type:
                return None

            # Check if token is revoked
            if self.is_token_revoked(payload.get('jti')):
                return None

            return payload

        except jwt.ExpiredSignatureError:
            raise TokenExpiredError("Token has expired")
        except jwt.InvalidTokenError:
            raise InvalidTokenError("Invalid token")

    def is_token_revoked(self, jti: str) -> bool:
        """Check if token is revoked (implement with Redis)"""
        # return redis_client.exists(f"revoked:token:{jti}")
        return False  # Placeholder

    def revoke_token(self, jti: str, ttl: int):
        """Revoke token by storing its JTI until expiration"""
        # redis_client.setex(f"revoked:token:{jti}", ttl, "1")
        pass  # Placeholder

# FastAPI integration
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()
jwt_manager = JWTManager(secret_key=os.environ['JWT_SECRET'])

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict:
    """Dependency to get current authenticated user"""
    try:
        token = credentials.credentials
        payload = jwt_manager.verify_token(token, expected_type='access')

        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )

        user_id = payload['sub']
        user = get_user_by_id(user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        return user

    except TokenExpiredError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

# Usage in endpoints
@app.post('/api/v1/auth/login')
async def login(credentials: LoginRequest):
    """Login endpoint"""
    user = authenticate_user(credentials.username, credentials.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    access_token = jwt_manager.create_access_token(user.id)
    refresh_token = jwt_manager.create_refresh_token(user.id)

    # Store refresh token in database
    store_refresh_token(user.id, refresh_token)

    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'bearer',
        'expires_in': 900  # 15 minutes
    }

@app.post('/api/v1/auth/refresh')
async def refresh_tokens(request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    try:
        payload = jwt_manager.verify_token(
            request.refresh_token,
            expected_type='refresh'
        )

        user_id = payload['sub']

        # Verify refresh token is in database
        if not verify_refresh_token(user_id, request.refresh_token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        # Create new tokens
        new_access_token = jwt_manager.create_access_token(user_id)
        new_refresh_token = jwt_manager.create_refresh_token(user_id)

        # Rotate refresh token (revoke old, store new)
        revoke_refresh_token(user_id, request.refresh_token)
        store_refresh_token(user_id, new_refresh_token)

        return {
            'access_token': new_access_token,
            'refresh_token': new_refresh_token,
            'token_type': 'bearer',
            'expires_in': 900
        }

    except (TokenExpiredError, InvalidTokenError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

@app.post('/api/v1/auth/logout')
async def logout(
    request: LogoutRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Logout endpoint - revoke tokens"""
    # Revoke access token
    access_payload = jwt_manager.verify_token(request.access_token)
    jwt_manager.revoke_token(access_payload['jti'], ttl=900)

    # Revoke refresh token
    revoke_refresh_token(current_user['id'], request.refresh_token)

    return {'message': 'Successfully logged out'}
```

## Role-Based Access Control (RBAC)

```python
from enum import Enum
from typing import List, Callable
from functools import wraps
from fastapi import HTTPException, status

class Role(str, Enum):
    ADMIN = 'admin'
    MANAGER = 'manager'
    USER = 'user'
    GUEST = 'guest'

class Permission(str, Enum):
    # User permissions
    USER_READ = 'user:read'
    USER_CREATE = 'user:create'
    USER_UPDATE = 'user:update'
    USER_DELETE = 'user:delete'

    # Content permissions
    CONTENT_READ = 'content:read'
    CONTENT_CREATE = 'content:create'
    CONTENT_UPDATE = 'content:update'
    CONTENT_DELETE = 'content:delete'
    CONTENT_PUBLISH = 'content:publish'

    # Admin permissions
    ADMIN_ALL = 'admin:*'

# Role-Permission mapping
ROLE_PERMISSIONS = {
    Role.ADMIN: [Permission.ADMIN_ALL],  # Has all permissions
    Role.MANAGER: [
        Permission.USER_READ,
        Permission.USER_CREATE,
        Permission.USER_UPDATE,
        Permission.CONTENT_READ,
        Permission.CONTENT_CREATE,
        Permission.CONTENT_UPDATE,
        Permission.CONTENT_PUBLISH,
    ],
    Role.USER: [
        Permission.USER_READ,
        Permission.CONTENT_READ,
        Permission.CONTENT_CREATE,
        Permission.CONTENT_UPDATE,
    ],
    Role.GUEST: [
        Permission.CONTENT_READ,
    ]
}

def has_permission(user: Dict, required_permission: Permission) -> bool:
    """Check if user has required permission"""
    user_role = Role(user.get('role', 'guest'))
    user_permissions = ROLE_PERMISSIONS.get(user_role, [])

    # Admin has all permissions
    if Permission.ADMIN_ALL in user_permissions:
        return True

    return required_permission in user_permissions

def require_permission(permission: Permission):
    """Decorator to require specific permission"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current_user from kwargs (injected by Depends)
            current_user = kwargs.get('current_user')

            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            if not has_permission(current_user, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied: {permission.value}"
                )

            return await func(*args, **kwargs)

        return wrapper
    return decorator

# Usage
@app.delete('/api/v1/users/{user_id}')
@require_permission(Permission.USER_DELETE)
async def delete_user(
    user_id: str,
    current_user: Dict = Depends(get_current_user)
):
    # Only users with USER_DELETE permission can access this
    user_service.delete_user(user_id)
    return {'message': 'User deleted successfully'}
```

## Attribute-Based Access Control (ABAC)

```python
from typing import Dict, Any, Callable
from abc import ABC, abstractmethod

class AccessPolicy(ABC):
    """Base class for access policies"""

    @abstractmethod
    def evaluate(self, user: Dict, resource: Dict, action: str, context: Dict) -> bool:
        """Evaluate if access should be granted"""
        pass

class OwnerPolicy(AccessPolicy):
    """Grant access if user is the owner"""

    def evaluate(self, user: Dict, resource: Dict, action: str, context: Dict) -> bool:
        return resource.get('owner_id') == user.get('id')

class AdminPolicy(AccessPolicy):
    """Grant access if user is admin"""

    def evaluate(self, user: Dict, resource: Dict, action: str, context: Dict) -> bool:
        return user.get('role') == 'admin'

class TeamMemberPolicy(AccessPolicy):
    """Grant access if user is team member"""

    def evaluate(self, user: Dict, resource: Dict, action: str, context: Dict) -> bool:
        user_team_ids = user.get('team_ids', [])
        resource_team_id = resource.get('team_id')
        return resource_team_id in user_team_ids

class PublishedResourcePolicy(AccessPolicy):
    """Grant read access if resource is published"""

    def evaluate(self, user: Dict, resource: Dict, action: str, context: Dict) -> bool:
        if action != 'read':
            return False
        return resource.get('status') == 'published'

class AccessControlEngine:
    """ABAC engine to evaluate access policies"""

    def __init__(self):
        self.policies: Dict[str, List[AccessPolicy]] = {}

    def register_policy(self, resource_type: str, policy: AccessPolicy):
        """Register policy for resource type"""
        if resource_type not in self.policies:
            self.policies[resource_type] = []
        self.policies[resource_type].append(policy)

    def check_access(
        self,
        user: Dict,
        resource: Dict,
        resource_type: str,
        action: str,
        context: Optional[Dict] = None
    ) -> bool:
        """Check if user can perform action on resource"""
        context = context or {}

        policies = self.policies.get(resource_type, [])

        if not policies:
            # No policies defined, deny by default
            return False

        # Grant access if ANY policy allows (OR logic)
        for policy in policies:
            if policy.evaluate(user, resource, action, context):
                return True

        return False

# Setup ACE
ace = AccessControlEngine()

# Register policies for 'document' resources
ace.register_policy('document', OwnerPolicy())
ace.register_policy('document', AdminPolicy())
ace.register_policy('document', TeamMemberPolicy())
ace.register_policy('document', PublishedResourcePolicy())

# Usage
def can_user_access_document(user: Dict, document: Dict, action: str) -> bool:
    return ace.check_access(
        user=user,
        resource=document,
        resource_type='document',
        action=action,
        context={'ip_address': get_request_ip()}
    )

@app.get('/api/v1/documents/{doc_id}')
async def get_document(
    doc_id: str,
    current_user: Dict = Depends(get_current_user)
):
    document = document_service.get(doc_id)

    if not can_user_access_document(current_user, document, 'read'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this document"
        )

    return document

@app.put('/api/v1/documents/{doc_id}')
async def update_document(
    doc_id: str,
    update_data: DocumentUpdate,
    current_user: Dict = Depends(get_current_user)
):
    document = document_service.get(doc_id)

    if not can_user_access_document(current_user, document, 'update'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this document"
        )

    updated = document_service.update(doc_id, update_data)
    return updated
```

## API Key Authentication

```python
import secrets
import hashlib
from datetime import datetime, timedelta

class APIKeyManager:
    """Manage API keys for service-to-service auth"""

    def generate_api_key(self, prefix: str = 'sk') -> tuple[str, str]:
        """
        Generate API key and its hash

        Returns:
            (api_key, api_key_hash) - Store hash in DB, return key to user once
        """
        # Generate random key
        random_part = secrets.token_urlsafe(32)
        api_key = f"{prefix}_{random_part}"

        # Hash for storage (never store plain key!)
        api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()

        return api_key, api_key_hash

    def verify_api_key(self, provided_key: str, stored_hash: str) -> bool:
        """Verify API key against stored hash"""
        provided_hash = hashlib.sha256(provided_key.encode()).hexdigest()
        return secrets.compare_digest(provided_hash, stored_hash)

# Database model
class APIKey(Base):
    __tablename__ = 'api_keys'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    key_hash = Column(String(64), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'))

    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    last_used_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    # Rate limiting
    rate_limit_per_minute = Column(Integer, default=60)

# FastAPI dependency
from fastapi.security import APIKeyHeader

api_key_header = APIKeyHeader(name='X-API-Key', auto_error=False)

async def verify_api_key_dependency(
    api_key: str = Depends(api_key_header)
) -> Dict:
    """Verify API key and return associated user"""
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required"
        )

    # Look up key by prefix
    key_record = db.query(APIKey).filter(
        APIKey.is_active == True,
        APIKey.expires_at > datetime.utcnow()
    ).all()

    # Verify against each (constant time)
    api_key_manager = APIKeyManager()
    valid_key = None

    for record in key_records:
        if api_key_manager.verify_api_key(api_key, record.key_hash):
            valid_key = record
            break

    if not valid_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )

    # Update last used
    valid_key.last_used_at = datetime.utcnow()
    db.commit()

    # Check rate limit
    if not check_rate_limit(valid_key.id, valid_key.rate_limit_per_minute):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded"
        )

    return {'user_id': valid_key.user_id, 'api_key_id': valid_key.id}

# Usage
@app.get('/api/v1/data')
async def get_data(auth: Dict = Depends(verify_api_key_dependency)):
    # auth contains user_id and api_key_id
    return get_user_data(auth['user_id'])
```

## OAuth2 Integration

```python
from authlib.integrations.starlette_client import OAuth

oauth = OAuth()

oauth.register(
    name='google',
    client_id=os.environ['GOOGLE_CLIENT_ID'],
    client_secret=os.environ['GOOGLE_CLIENT_SECRET'],
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

@app.get('/api/v1/auth/google/login')
async def google_login(request: Request):
    """Initiate Google OAuth2 flow"""
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get('/api/v1/auth/google/callback')
async def google_callback(request: Request):
    """Handle Google OAuth2 callback"""
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')

        # Find or create user
        user = user_service.find_or_create_from_oauth(
            provider='google',
            provider_id=user_info['sub'],
            email=user_info['email'],
            name=user_info.get('name')
        )

        # Create our own JWT tokens
        access_token = jwt_manager.create_access_token(user.id)
        refresh_token = jwt_manager.create_refresh_token(user.id)

        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth authentication failed"
        )
```

## Best Practices

1. **Never store passwords in plain text** - Always use bcrypt, argon2, or scrypt
2. **Use HTTPS everywhere** - No authentication over HTTP
3. **Implement rate limiting** - Prevent brute force attacks
4. **Use refresh token rotation** - Invalidate old refresh tokens
5. **Set appropriate token expiration** - Short for access (15min), longer for refresh (7 days)
6. **Log all auth events** - Track login attempts, failures, token usage
7. **Implement account lockout** - After N failed attempts
8. **Use secure session storage** - HttpOnly, Secure, SameSite cookies
9. **Validate all inputs** - Even authenticated requests need validation
10. **Implement 2FA for sensitive operations** - Banking, admin access, etc.
