import React from 'react';
import { useShoppingCart } from '../../contexts/ShoppingCartContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useTranslation } from 'react-i18next';

const ShoppingCartModal: React.FC = () => {
	const { items, removeItem, clearCart, showCart, setShowCart, totalItems } = useShoppingCart();
	const { navigate } = useAdmin();
	const { t } = useTranslation('admin');

	if (!showCart) return null;

	const handleClose = () => {
		setShowCart(false);
	};

	const handleRemoveItem = (itemId: string) => {
		removeItem(itemId);
	};

	const handleClearCart = () => {
		clearCart();
	};

	const handleCheckout = () => {
		setShowCart(false);
		navigate('/checkout');
	};

	return (
		<div className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center'>
			<div className='bg-white w-full h-full flex flex-col'>
				{/* Header */}
				<div className='flex items-center justify-between p-6 border-b border-gray-200'>
					<div className='flex items-center space-x-3'>
						<svg
							className='w-8 h-8 text-blue-600'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13'
							/>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M16 16a2 2 0 11-4 0 2 2 0 014 0zM8 16a2 2 0 11-4 0 2 2 0 014 0z'
							/>
						</svg>
						<h2 className='text-2xl font-bold text-gray-900'>
							{t('questionBanks.marketplace.shoppingCart', 'Shopping Cart')} (
							{totalItems})
						</h2>
					</div>
					<button
						onClick={handleClose}
						className='p-2 hover:bg-gray-100 rounded-full transition-colors'
					>
						<svg
							className='w-6 h-6 text-gray-500'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M6 18L18 6M6 6l12 12'
							/>
						</svg>
					</button>
				</div>

				{/* Content */}
				<div className='flex-1 overflow-y-auto p-6'>
					{items.length === 0 ? (
						<div className='text-center py-12'>
							<svg
								className='w-16 h-16 text-gray-300 mx-auto mb-4'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13'
								/>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M16 16a2 2 0 11-4 0 2 2 0 014 0zM8 16a2 2 0 11-4 0 2 2 0 014 0z'
								/>
							</svg>
							<h3 className='text-lg font-medium text-gray-900 mb-2'>
								{t('questionBanks.marketplace.cartEmpty', 'Your cart is empty')}
							</h3>
							<p className='text-gray-500'>
								{t(
									'questionBanks.marketplace.cartEmptyDescription',
									'Add some question banks to get started'
								)}
							</p>
						</div>
					) : (
						<div className='space-y-4'>
							{items.map(item => (
								<div
									key={item._id}
									className='flex items-center space-x-4 p-4 border border-gray-200 rounded-lg'
								>
									<div className='flex-1'>
										<h3 className='font-medium text-gray-900'>{item.title}</h3>
										<p className='text-sm text-gray-500 line-clamp-2'>
											{item.description}
										</p>
										<div className='flex items-center space-x-2 mt-2'>
											<span
												className={`px-2 py-1 text-xs font-semibold rounded-full ${
													item.type.toLowerCase() === 'free'
														? 'bg-green-100 text-green-700'
														: 'bg-purple-100 text-purple-700'
												}`}
											>
												{item.type.toLowerCase() === 'free'
													? 'Free'
													: `$${item.price?.toFixed(2)}`}
											</span>
											{item.questionCount && (
												<span className='text-xs text-gray-500'>
													{item.questionCount} questions
												</span>
											)}
										</div>
									</div>
									<button
										onClick={() => handleRemoveItem(item._id)}
										className='p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors'
									>
										<svg
											className='w-5 h-5'
											fill='none'
											stroke='currentColor'
											viewBox='0 0 24 24'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
											/>
										</svg>
									</button>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				{items.length > 0 && (
					<div className='border-t border-gray-200 p-6'>
						<div className='flex items-center justify-between mb-4'>
							<button
								onClick={handleClearCart}
								className='text-sm text-red-600 hover:text-red-700 font-medium'
							>
								{t('questionBanks.marketplace.clearCart', 'Clear Cart')}
							</button>
							<div className='text-right'>
								<p className='text-sm text-gray-500'>
									{t('questionBanks.marketplace.totalItems', 'Total Items')}:{' '}
									{totalItems}
								</p>
							</div>
						</div>
						<button
							onClick={handleCheckout}
							className='w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors'
						>
							{t(
								'questionBanks.marketplace.proceedToCheckout',
								'Proceed to Checkout'
							)}
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default ShoppingCartModal;
