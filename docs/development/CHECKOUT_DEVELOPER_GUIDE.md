# Checkout System Developer Guide

## Quick Start

### Key Files to Know

```
Frontend:
- client/src/contexts/ShoppingCartContext.tsx - Cart state management
- client/src/components/questionBanks/CheckoutPage.tsx - Main checkout logic
- client/src/components/questionBanks/PurchaseHistoryPage.tsx - Order history UI
- client/src/components/questionBanks/PublicQuestionBankCard.tsx - Add to cart logic

Backend:
- routes/orders.js - Order management API
- routes/entitlements.js - Access rights API
- routes/publicBanks.js - Purchase processing
- models/Order.js - Order data model
- models/Entitlement.js - Access rights model
```

### Common Development Tasks

#### 1. Adding New Payment Method

1. Update `CheckoutPage.tsx` to handle new payment flow
2. Add new order type in `Order.js` model
3. Create new API endpoint in `publicBanks.js`
4. Update security validation logic

#### 2. Modifying Order Data Structure

1. Update `Order.js` model schema
2. Update API responses in `routes/orders.js`
3. Update frontend types in components
4. Run database migration if needed

#### 3. Adding New Entitlement Features

1. Extend `Entitlement.js` model
2. Update `routes/entitlements.js` API
3. Modify frontend access checking logic
4. Update UI components for new features

## Code Patterns

### Security Pattern (Multi-tenant Isolation)

```javascript
// Always include companyId filter
const user = await resolveUser(req, 'companyId');
if (!user || !user.companyId) {
	return res.status(403).json({ error: 'Company not found' });
}

// Filter queries by company
const orders = await Order.find({ companyId: user.companyId });
```

### Error Handling Pattern

```javascript
try {
	// Business logic
	const result = await someOperation();
	res.json({ success: true, data: result });
} catch (error) {
	console.error('Operation failed:', error);
	res.status(500).json({
		error: 'Operation failed',
		details: error.message,
	});
}
```

### Frontend State Management Pattern

```typescript
// Using context for cart management
const { items, addItem, removeItem, clearCart } = useShoppingCart();

// Adding error handling
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleOperation = async () => {
	setLoading(true);
	setError(null);
	try {
		await apiCall();
	} catch (err) {
		setError(err.message);
	} finally {
		setLoading(false);
	}
};
```

## Database Operations

### Creating Orders

```javascript
// Always include companyId for security
const order = new Order({
	companyId: user.companyId,
	bankId: bank._id,
	amount: 0, // or actual amount for paid
	currency: 'USD',
	status: 'paid',
	type: 'free', // or 'one-time', 'subscription'
});
await order.save();
```

### Creating Entitlements

```javascript
// Use helper method for consistency
const entitlement = await Entitlement.grantFreeAccess(user.companyId, bank._id, user._id);
```

### Querying with Security

```javascript
// Always filter by companyId
const orders = await Order.find({
	companyId: user.companyId,
	status: 'paid',
})
	.populate('bankId', 'title description questionCount')
	.sort({ createdAt: -1 });
```

## Testing Strategies

### Unit Test Examples

```javascript
describe('Order API', () => {
	it('should only return user company orders', async () => {
		const response = await request(app)
			.get('/api/orders/history')
			.set('Authorization', `Bearer ${userToken}`)
			.expect(200);

		// Verify all orders belong to user's company
		response.body.orders.forEach(order => {
			expect(order.companyId).toBe(user.companyId);
		});
	});
});
```

### Security Test Examples

```javascript
it('should not allow access to other company orders', async () => {
	const otherCompanyOrder = await Order.create({
		companyId: otherCompany._id,
		// ... other fields
	});

	await request(app)
		.get(`/api/orders/${otherCompanyOrder._id}`)
		.set('Authorization', `Bearer ${userToken}`)
		.expect(404); // Should not be found
});
```

## Common Issues & Solutions

### 1. Cart Items Persisting After Logout

**Problem**: Cart items remain when user logs out
**Solution**: Clear localStorage on logout

```javascript
const handleLogout = () => {
	localStorage.removeItem('shoppingCart');
	// other logout logic
};
```

### 2. Duplicate Entitlements

**Problem**: User gets multiple entitlements for same bank
**Solution**: Check existing entitlement before creating

```javascript
const hasAccess = await Entitlement.hasAccess(companyId, bankId);
if (hasAccess) {
	return res.status(400).json({ error: 'Already has access' });
}
```

### 3. Order Not Found After Purchase

**Problem**: Order lookup fails on confirmation page
**Solution**: Ensure orderId is properly passed in URL

```javascript
const orderId = response.data.order?.orderId;
if (orderId) {
	navigate(`/checkout/success?orderId=${orderId}`);
}
```

### 4. Security Bypass Attempts

**Problem**: Users try to access other companies' data
**Solution**: Always validate company ownership

```javascript
const order = await Order.findOne({
	_id: orderId,
	companyId: user.companyId, // Critical security check
});
```

## Performance Tips

### 1. Database Indexing

```javascript
// Add indexes for common queries
Order.index({ companyId: 1, createdAt: -1 });
Entitlement.index({ companyId: 1, bankId: 1 });
```

### 2. Populate Optimization

```javascript
// Use select to limit populated fields
.populate('bankId', 'title description questionCount')
```

### 3. Pagination Implementation

```javascript
const skip = (page - 1) * pageSize;
const orders = await Order.find(filter).skip(skip).limit(parseInt(pageSize));
```

## Debugging Tips

### 1. Enable Debug Logging

```javascript
console.log('Processing order for company:', user.companyId);
console.log('Cart items:', cartItems);
```

### 2. Check Network Requests

```javascript
// In browser dev tools, monitor:
// - API request/response
// - Authentication headers
// - Error responses
```

### 3. Validate Data Flow

```javascript
// Frontend to Backend flow:
// 1. Cart Context → CheckoutPage
// 2. API Call → Backend Route
// 3. Database Operation → Response
// 4. State Update → UI Refresh
```

## Deployment Considerations

### 1. Environment Variables

```bash
# Required for Stripe integration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# JWT for authentication
JWT_SECRET=your_jwt_secret
```

### 2. Database Migrations

```javascript
// When adding new fields to Order model
db.orders.updateMany({ newField: { $exists: false } }, { $set: { newField: defaultValue } });
```

### 3. Webhook Configuration

```javascript
// Stripe webhook endpoint must be accessible
// Configure in Stripe Dashboard:
// URL: https://yoursite.com/api/webhooks/stripe
// Events: checkout.session.completed
```

## Monitoring & Logging

### 1. Key Metrics to Track

- Order completion rate
- Cart abandonment rate
- API response times
- Error frequencies

### 2. Important Log Points

```javascript
// Log purchases
console.log(`Purchase completed: ${orderId} by ${user.email}`);

// Log security events
console.log(`Unauthorized access attempt: ${userId} → ${orderId}`);

// Log errors
console.error(`Purchase failed: ${error.message}`, { userId, bankId });
```

### 3. Error Alerting

- Set up alerts for 4xx/5xx error rates
- Monitor failed payment webhooks
- Track unusual access patterns

## Future Enhancement Ideas

### 1. Advanced Features

- Bulk purchase discounts
- Subscription management
- Refund processing
- Gift purchases

### 2. Technical Improvements

- Real-time cart synchronization
- Advanced caching
- Background job processing
- Audit trail enhancement

### 3. Analytics Integration

- Purchase funnel analysis
- User behavior tracking
- Revenue reporting
- A/B testing framework
