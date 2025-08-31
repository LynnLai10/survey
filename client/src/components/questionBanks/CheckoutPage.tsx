import React, { useState } from 'react';
import { useShoppingCart } from '../../contexts/ShoppingCartContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useTranslation } from 'react-i18next';
import api from '../../utils/axiosConfig';

const CheckoutPage: React.FC = () => {
	const { items, clearCart, totalItems } = useShoppingCart();
	const { navigate } = useAdmin();
	const { t } = useTranslation('admin');
	const [loading, setLoading] = useState(false);

	const handleBackToMarketplace = () => {
		navigate('/admin/question-banks?tab=marketplace');
	};

	const handleConfirmPurchase = async () => {
		setLoading(true);
		try {
			const orderResults = [];
			let lastOrderId = null;
			const successfulOrderIds = [];

			// Process each item in the cart
			for (const item of items) {
				if (item.type.toLowerCase() === 'free') {
					// For free items, call the free access API
					try {
						const response = await api.post(`/public-banks/${item._id}/claim-free`);
						if (response.data.success) {
							orderResults.push({
								item: item.title,
								status: 'success',
								type: 'free',
								orderId: response.data.order?.orderId,
							});
							// Keep track of the last successful order ID
							if (response.data.order?.orderId) {
								lastOrderId = response.data.order.orderId;
								successfulOrderIds.push(response.data.order.orderId);
							}
						}
					} catch (error: any) {
						console.error(`Failed to claim free item ${item.title}:`, error);
						orderResults.push({
							item: item.title,
							status: 'error',
							type: 'free',
							error: error.response?.data?.error || 'Failed to claim free item',
						});
					}
				} else {
					// For paid items, call the purchase API
					try {
						const response = await api.post(`/public-banks/${item._id}/buy-once`);
						if (response.data.success) {
							if (response.data.checkoutUrl) {
								// Redirect to Stripe Checkout for actual payment
								window.location.href = response.data.checkoutUrl;
								return; // Don't continue processing if redirecting to payment
							} else {
								// Simulated purchase (Stripe not configured)
								orderResults.push({
									item: item.title,
									status: 'success',
									type: 'paid',
									orderId: response.data.order?.orderId,
								});
								// Keep track of the last successful order ID
								if (response.data.order?.orderId) {
									lastOrderId = response.data.order.orderId;
									successfulOrderIds.push(response.data.order.orderId);
								}
							}
						}
					} catch (error: any) {
						console.error(`Failed to purchase item ${item.title}:`, error);
						orderResults.push({
							item: item.title,
							status: 'error',
							type: 'paid',
							error: error.response?.data?.error || 'Failed to purchase item',
						});
					}
				}
			}

			// Check if any items failed
			const failedItems = orderResults.filter(result => result.status === 'error');
			const successItems = orderResults.filter(result => result.status === 'success');

			if (failedItems.length > 0) {
				const errorMessage = failedItems
					.map(item => `${item.item}: ${item.error}`)
					.join('\n');
				alert(`Some items failed to process:\n${errorMessage}`);

				// If some succeeded, show partial success message
				if (successItems.length > 0) {
					alert(
						`Successfully processed: ${successItems.map(item => item.item).join(', ')}`
					);
				}
			} else {
				// All items processed successfully
				// Clear the cart after successful processing
				clearCart();

				// Navigate to success page with orderId if available
				if (lastOrderId) {
					navigate(`/checkout/success?orderId=${lastOrderId}`);
				} else {
					// Fallback to simple success page if no orderId
					navigate('/checkout/success');
				}
			}
		} catch (error) {
			console.error('Checkout failed:', error);
			alert('Checkout failed. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const calculateTotal = () => {
		return items.reduce((total, item) => {
			if (item.type.toLowerCase() === 'free') {
				return total;
			}
			return total + (item.price || 0);
		}, 0);
	};

	const freeItems = items.filter(item => item.type.toLowerCase() === 'free');
	const paidItems = items.filter(item => item.type.toLowerCase() !== 'free');
	const totalAmount = calculateTotal();

	return (
		<div className='min-h-screen bg-gray-50 py-8'>
			<div className='max-w-4xl mx-auto px-4'>
				{/* Header */}
				<div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
					<div className='flex items-center justify-between'>
						<h1 className='text-2xl font-bold text-gray-900'>
							{t('questionBanks.marketplace.checkout', 'Checkout')}
						</h1>
						<button
							onClick={handleBackToMarketplace}
							className='text-blue-600 hover:text-blue-700 font-medium'
						>
							←{' '}
							{t(
								'questionBanks.marketplace.backToMarketplace',
								'Back to Marketplace'
							)}
						</button>
					</div>
					<p className='text-gray-600 mt-2'>
						{t(
							'questionBanks.marketplace.checkoutDescription',
							'Review your order and complete your purchase'
						)}
					</p>
				</div>

				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					{/* Order Summary */}
					<div className='lg:col-span-2'>
						<div className='bg-white rounded-lg shadow-sm p-6'>
							<h2 className='text-lg font-semibold text-gray-900 mb-4'>
								{t('questionBanks.marketplace.orderSummary', 'Order Summary')}
							</h2>

							{/* Free Items */}
							{freeItems.length > 0 && (
								<div className='mb-6'>
									<h3 className='text-md font-medium text-gray-700 mb-3'>
										{t('questionBanks.marketplace.freeItems', 'Free Items')}
									</h3>
									<div className='space-y-3'>
										{freeItems.map(item => (
											<div
												key={item._id}
												className='flex items-center justify-between p-3 bg-green-50 rounded-lg'
											>
												<div>
													<h4 className='font-medium text-gray-900'>
														{item.title}
													</h4>
													<p className='text-sm text-gray-600'>
														{item.questionCount} questions
													</p>
												</div>
												<span className='text-green-600 font-medium'>
													Free
												</span>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Paid Items */}
							{paidItems.length > 0 && (
								<div className='mb-6'>
									<h3 className='text-md font-medium text-gray-700 mb-3'>
										{t('questionBanks.marketplace.paidItems', 'Paid Items')}
									</h3>
									<div className='space-y-3'>
										{paidItems.map(item => (
											<div
												key={item._id}
												className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
											>
												<div>
													<h4 className='font-medium text-gray-900'>
														{item.title}
													</h4>
													<p className='text-sm text-gray-600'>
														{item.questionCount} questions
													</p>
												</div>
												<span className='font-medium text-gray-900'>
													${item.price?.toFixed(2)}
												</span>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Total */}
							<div className='border-t border-gray-200 pt-4'>
								<div className='flex justify-between items-center'>
									<span className='text-lg font-medium text-gray-900'>
										{t('questionBanks.marketplace.total', 'Total')}
									</span>
									<span className='text-2xl font-bold text-gray-900'>
										${totalAmount.toFixed(2)}
									</span>
								</div>
								{freeItems.length > 0 && (
									<p className='text-sm text-green-600 mt-1'>
										{freeItems.length} free item
										{freeItems.length !== 1 ? 's' : ''} included
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Checkout Actions */}
					<div className='lg:col-span-1'>
						<div className='bg-white rounded-lg shadow-sm p-6 sticky top-6'>
							<h3 className='text-lg font-semibold text-gray-900 mb-4'>
								{t('questionBanks.marketplace.completeOrder', 'Complete Order')}
							</h3>

							<div className='space-y-4'>
								<div className='text-sm text-gray-600'>
									<p>
										• {totalItems} item{totalItems !== 1 ? 's' : ''} in your
										order
									</p>
									{freeItems.length > 0 && (
										<p>
											• {freeItems.length} free item
											{freeItems.length !== 1 ? 's' : ''} will be added
											immediately
										</p>
									)}
									{paidItems.length > 0 && (
										<p>
											• {paidItems.length} paid item
											{paidItems.length !== 1 ? 's' : ''} will be processed
										</p>
									)}
								</div>

								<button
									onClick={handleConfirmPurchase}
									disabled={loading || totalItems === 0}
									className='w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
								>
									{loading
										? t('questionBanks.marketplace.processing', 'Processing...')
										: totalAmount === 0
											? t(
												'questionBanks.marketplace.claimFree',
												'Claim Free Items'
											)
											: t(
												'questionBanks.marketplace.completePurchase',
												'Complete Purchase'
											)}
								</button>

								<button
									onClick={handleBackToMarketplace}
									className='w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors'
								>
									{t(
										'questionBanks.marketplace.continueShopping',
										'Continue Shopping'
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CheckoutPage;
