import React from 'react';
import { useShoppingCart } from '../../contexts/ShoppingCartContext';

const ShoppingCartIcon: React.FC = () => {
  const { totalItems, setShowCart } = useShoppingCart();

  const handleClick = () => {
    setShowCart(true);
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
        title="Shopping Cart"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 16a2 2 0 11-4 0 2 2 0 014 0zM8 16a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>

        {/* Badge showing number of items */}
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium min-w-[20px] z-10">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </button>
    </div>
  );
};

export default ShoppingCartIcon;
