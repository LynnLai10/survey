# Question Bank Checkout System Documentation

## Overview
The Question Bank Checkout System allows users to purchase and claim question banks from the marketplace. It includes shopping cart functionality, order processing, purchase history, and entitlement management.

## Architecture

### Frontend Components

#### 1. Shopping Cart System
- **Location**: `client/src/contexts/ShoppingCartContext.tsx`
- **Storage**: localStorage (per-user basis)
- **Features**:
  - Add/remove items from cart
  - Persistent cart across sessions
  - Real-time cart count updates
  - Cart modal display

#### 2. UI Components

##### ShoppingCartIcon
- **Location**: `client/src/components/questionBanks/ShoppingCartIcon.tsx`
- **Features**: Badge showing item count, click to open cart modal

##### ShoppingCartModal
- **Location**: `client/src/components/questionBanks/ShoppingCartModal.tsx`
- **Features**: Display cart items, remove items, proceed to checkout

##### PublicQuestionBankCard
- **Location**: `client/src/components/questionBanks/PublicQuestionBankCard.tsx`
- **Features**: 
  - Shows "Add to Cart" for non-owned items
  - Shows "Use Now" for owned items
  - Handles entitlement status display

##### CheckoutPage
- **Location**: `client/src/components/questionBanks/CheckoutPage.tsx`
- **Features**:
  - Process free item claims
  - Handle paid purchases (Stripe integration)
  - Order completion tracking

##### PurchaseHistoryPage
- **Location**: `client/src/components/questionBanks/PurchaseHistoryPage.tsx`
- **Features**:
  - Two tabs: Orders and Entitlements
  - Paginated order history
  - Entitlement status tracking

##### QuestionBankConfirmationPage
- **Location**: `client/src/components/questionBanks/QuestionBankConfirmationPage.tsx`
- **Features**:
  - Success confirmation after purchase
  - Quick actions (Use Now, Go to My Banks)
  - Related recommendations

### Backend APIs

#### 1. Orders API (`/api/orders`)

##### GET /api/orders/history
- **Purpose**: Get purchase history for current user's company
- **Authentication**: JWT required
- **Security**: Filtered by `companyId`
- **Response**: Paginated order list with bank details

##### GET /api/orders/:orderId
- **Purpose**: Get specific order details
- **Authentication**: JWT required
- **Security**: Validates order belongs to user's company
- **Response**: Order details with bank information

#### 2. Entitlements API (`/api/entitlements`)

##### GET /api/entitlements/my-access
- **Purpose**: Get current user's question bank access rights
- **Authentication**: JWT required
- **Security**: Filtered by `companyId`
- **Response**: Paginated entitlements list

#### 3. Public Banks API (`/api/public-banks`)

##### POST /api/public-banks/:id/claim-free
- **Purpose**: Claim free question bank access
- **Authentication**: JWT required
- **Security**: Validates user company, prevents duplicate claims
- **Process**:
  1. Validate bank is free and published
  2. Check if user already has access
  3. Grant entitlement
  4. Create order record
  5. Update usage statistics

##### POST /api/public-banks/:id/buy-once
- **Purpose**: Purchase paid question bank (Stripe integration)
- **Authentication**: JWT required
- **Security**: Validates user company
- **Process**: Creates Stripe checkout session

##### GET /api/public-banks/my-access
- **Purpose**: Get user's current question bank entitlements
- **Authentication**: JWT required
- **Security**: Filtered by `companyId`

## Data Models

### Order Model
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,        // Company isolation
  bankId: ObjectId,           // Reference to PublicBank
  amount: Number,             // Purchase amount (0 for free)
  currency: String,           // Currency code
  status: String,             // 'paid', 'pending', 'failed'
  type: String,               // 'free', 'one-time', 'subscription'
  stripeSessionId: String,    // For paid orders
  createdAt: Date,
  updatedAt: Date
}
```

### Entitlement Model
```javascript
{
  _id: ObjectId,
  companyId: ObjectId,        // Company isolation
  bankId: ObjectId,           // Reference to PublicBank
  userId: ObjectId,           // User who initiated
  accessType: String,         // 'free', 'paid'
  status: String,             // 'active', 'expired', 'revoked'
  grantedAt: Date,
  expiresAt: Date,            // null for permanent access
  createdAt: Date,
  updatedAt: Date
}
```

## Security Architecture

### Multi-tenant Data Isolation
- All data queries include `companyId` filter
- Users can only access their company's data
- No cross-tenant data leakage

### Authentication & Authorization
- JWT-based authentication on all endpoints
- User resolution via `resolveUser` helper
- Company validation before data access

### Data Validation
- Order ownership verification
- Entitlement scope validation
- Duplicate purchase prevention

## User Flows

### 1. Free Question Bank Claim Flow
```
1. User browses marketplace
2. Clicks "Add to Cart" on free bank
3. Opens cart modal, reviews items
4. Clicks "Claim Free Items"
5. Backend validates and creates:
   - Entitlement record
   - Order record (amount: 0)
6. Redirects to confirmation page
7. Shows success message with options:
   - Use Question Bank Now
   - Go to My Question Banks
```

### 2. Paid Question Bank Purchase Flow
```
1. User browses marketplace
2. Adds paid bank to cart
3. Proceeds to checkout
4. Backend creates Stripe session
5. User completes payment on Stripe
6. Webhook processes successful payment:
   - Creates entitlement
   - Updates order status
7. Redirects to confirmation page
```

### 3. Survey Creation with Purchased Bank
```
1. User clicks "Use Question Bank Now" 
2. Redirects to admin with preselectedBank parameter
3. Opens Create Survey Modal automatically
4. Pre-fills:
   - Type: Assessment
   - Source: Question Bank
   - Bank: Selected bank
5. User completes survey creation
```

## Navigation & Routing

### Key Routes
- `/admin` - Main dashboard
- `/admin/question-banks` - Question bank management
- `/checkout` - Checkout page
- `/checkout/success?orderId=xxx` - Purchase confirmation
- `/admin/purchase-history` - Purchase history

### URL Parameters
- `?preselectedBank=bankId` - Auto-open survey creation with bank
- `?orderId=xxx` - Display order confirmation
- `?tab=my-banks` - Navigate to specific tab

## Integration Points

### 1. Survey Creation Integration
- Direct integration from confirmation page
- Pre-filled survey modal with purchased bank
- Seamless user experience from purchase to usage

### 2. Navigation Menu Integration
- Shopping cart icon in admin navbar
- Purchase history accessible from admin menu
- Question banks tab integration

### 3. Admin Dashboard Integration
- Automatic modal opening for preselected banks
- URL parameter handling
- State management integration

## Error Handling

### Frontend Error Handling
- Network error fallbacks
- Loading states during API calls
- User-friendly error messages
- Graceful degradation

### Backend Error Handling
- Detailed error logging
- Appropriate HTTP status codes
- Security-conscious error messages
- Database transaction handling

## Performance Considerations

### Frontend Optimizations
- localStorage for cart persistence
- Lazy loading of purchase history
- Optimistic UI updates
- Component memoization where appropriate

### Backend Optimizations
- Database indexing on companyId and bankId
- Pagination for large datasets
- Lean queries for better performance
- Connection pooling

## Testing Recommendations

### Unit Tests
- Shopping cart functionality
- Order validation logic
- Entitlement creation
- Security isolation

### Integration Tests
- End-to-end purchase flows
- API endpoint security
- Cross-component communication
- Database transaction integrity

### Security Tests
- Cross-tenant data access prevention
- Authentication bypass attempts
- Order manipulation prevention
- Entitlement privilege escalation

## Monitoring & Analytics

### Key Metrics
- Purchase completion rates
- Cart abandonment rates
- Free vs paid conversion
- Question bank usage after purchase

### Logging Points
- Purchase attempts and completions
- Error occurrences
- Security violations
- Performance bottlenecks

## Future Enhancements

### Potential Features
- Bulk purchase discounts
- Subscription-based access
- Gift purchases
- Advanced analytics
- Refund processing
- Question bank ratings and reviews

### Technical Improvements
- Real-time cart synchronization
- Advanced caching strategies
- Webhook retry mechanisms
- Enhanced error recovery
- Performance monitoring integration

## Configuration

### Environment Variables
- `STRIPE_SECRET_KEY` - Stripe payment processing
- `STRIPE_PUBLISHABLE_KEY` - Frontend Stripe integration
- `JWT_SECRET` - Authentication token signing

### Feature Flags
- Payment processing enabled/disabled
- Free tier restrictions
- Purchase limits per company
- Beta features access