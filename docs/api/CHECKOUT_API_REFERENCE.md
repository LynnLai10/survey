# Checkout System API Reference

## Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## Base URL
```
http://localhost:5050/api
```

## Endpoints

### Orders API

#### GET /orders/history
Get purchase history for current user's company.

**Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "_id": "order_id",
      "companyId": "company_id",
      "bankId": {
        "_id": "bank_id",
        "title": "Bank Title",
        "description": "Bank Description",
        "questionCount": 50
      },
      "amount": 0,
      "currency": "USD",
      "status": "paid",
      "type": "free",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 100,
    "pageSize": 20
  }
}
```

**Security:** Returns only orders belonging to the current user's company.

#### GET /orders/:orderId
Get specific order details.

**Parameters:**
- `orderId`: Order ID (required)

**Response:**
```json
{
  "order": {
    "_id": "order_id",
    "companyId": "company_id",
    "bankId": "bank_id",
    "amount": 0,
    "currency": "USD",
    "status": "paid",
    "type": "free",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "bank": {
    "_id": "bank_id",
    "title": "Question Bank Title",
    "description": "Question Bank Description",
    "priceOneTime": 29.99,
    "type": "free",
    "tags": ["javascript", "react"],
    "questionCount": 50
  }
}
```

**Security:** Validates order belongs to current user's company.

**Error Responses:**
- `404`: Order not found or not accessible
- `403`: Company not found

### Entitlements API

#### GET /entitlements/my-access
Get current user's question bank access rights.

**Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `status` (optional): Filter by status ('active', 'expired', 'all')

**Response:**
```json
{
  "success": true,
  "entitlements": [
    {
      "_id": "entitlement_id",
      "companyId": "company_id",
      "bankId": {
        "_id": "bank_id",
        "title": "Question Bank Title",
        "description": "Description",
        "questionCount": 50
      },
      "userId": "user_id",
      "accessType": "free",
      "status": "active",
      "grantedAt": "2024-01-01T00:00:00Z",
      "expiresAt": null
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalCount": 50,
    "pageSize": 20
  }
}
```

**Security:** Returns only entitlements for the current user's company.

### Public Banks API

#### POST /public-banks/:id/claim-free
Claim access to a free question bank.

**Parameters:**
- `id`: Question bank ID (required)

**Response:**
```json
{
  "success": true,
  "message": "Free access granted successfully",
  "entitlement": {
    "_id": "entitlement_id",
    "companyId": "company_id",
    "bankId": "bank_id",
    "accessType": "free",
    "status": "active",
    "grantedAt": "2024-01-01T00:00:00Z"
  },
  "order": {
    "_id": "order_id",
    "orderId": "order_id",
    "amount": 0,
    "status": "paid",
    "type": "free"
  }
}
```

**Process:**
1. Validates question bank exists and is published
2. Checks if bank is free type
3. Verifies user doesn't already have access
4. Creates entitlement record
5. Creates order record for tracking
6. Updates usage statistics

**Error Responses:**
- `404`: Question bank not found
- `400`: Bank is not free or user already has access
- `403`: Company not found

#### POST /public-banks/:id/buy-once
Purchase a paid question bank (creates Stripe session).

**Parameters:**
- `id`: Question bank ID (required)

**Request Body:**
```json
{
  "successUrl": "https://yoursite.com/success",
  "cancelUrl": "https://yoursite.com/cancel"
}
```

**Response:**
```json
{
  "sessionId": "stripe_session_id",
  "url": "https://checkout.stripe.com/pay/..."
}
```

**Process:**
1. Validates question bank exists and is paid
2. Checks if user already has access
3. Creates Stripe checkout session
4. Returns session URL for redirect

**Error Responses:**
- `404`: Question bank not found
- `400`: Bank is free or user already has access
- `403`: Company not found
- `500`: Stripe session creation failed

#### GET /public-banks/my-access
Get question bank entitlements for survey creation.

**Response:**
```json
{
  "entitlements": [
    {
      "bankId": "bank_id",
      "bankTitle": "Question Bank Title",
      "accessType": "free",
      "grantedAt": "2024-01-01T00:00:00Z",
      "expiresAt": null
    }
  ]
}
```

**Security:** Filtered by current user's company and active status.

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

#### 403 Forbidden
```json
{
  "error": "Company not found"
}
```

#### 404 Not Found
```json
{
  "error": "Order not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Failed to fetch order history",
  "details": "Error message details"
}
```

## Security Considerations

### Data Isolation
- All endpoints filter data by `companyId`
- Users cannot access other companies' data
- Order validation includes company ownership

### Authentication
- JWT tokens required for all endpoints
- User resolution validates token payload
- Company membership validated per request

### Input Validation
- ObjectId format validation
- Required parameter checking
- Type validation for query parameters

## Rate Limiting
Consider implementing rate limiting for:
- Purchase attempts: 10 requests per minute
- History queries: 100 requests per minute
- Free claims: 20 requests per minute

## Webhook Endpoints (Stripe)

#### POST /webhooks/stripe
Handle Stripe payment completion webhooks.

**Headers:**
- `stripe-signature`: Webhook signature for verification

**Process:**
1. Verify webhook signature
2. Handle `checkout.session.completed` events
3. Create entitlement for successful payments
4. Update order status

## Usage Examples

### JavaScript/TypeScript Client

```javascript
// Get purchase history
const response = await fetch('/api/orders/history?page=1&pageSize=10', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// Claim free question bank
const claimResponse = await fetch(`/api/public-banks/${bankId}/claim-free`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Get specific order
const orderResponse = await fetch(`/api/orders/${orderId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### cURL Examples

```bash
# Get purchase history
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:5050/api/orders/history"

# Claim free bank
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     "http://localhost:5050/api/public-banks/BANK_ID/claim-free"

# Get order details
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:5050/api/orders/ORDER_ID"
```