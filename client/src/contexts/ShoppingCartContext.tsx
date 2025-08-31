import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  _id: string;
  title: string;
  description: string;
  type: string;
  price?: number;
  questionCount?: number;
  tags?: string[];
}

interface ShoppingCartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  isInCart: (itemId: string) => boolean;
  totalItems: number;
  showCart: boolean;
  setShowCart: (show: boolean) => void;
}

const ShoppingCartContext = createContext<ShoppingCartContextType | undefined>(undefined);

export const useShoppingCart = () => {
  const context = useContext(ShoppingCartContext);
  if (!context) {
    throw new Error('useShoppingCart must be used within a ShoppingCartProvider');
  }
  return context;
};

export const ShoppingCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('shoppingCart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse saved cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('shoppingCart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems(prev => {
      if (prev.find(existing => existing._id === item._id)) {
        return prev; // Item already in cart
      }
      return [...prev, item];
    });
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item._id !== itemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const isInCart = (itemId: string) => {
    return items.some(item => item._id === itemId);
  };

  const totalItems = items.length;

  return (
    <ShoppingCartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        isInCart,
        totalItems,
        showCart,
        setShowCart,
      }}
    >
      {children}
    </ShoppingCartContext.Provider>
  );
};
