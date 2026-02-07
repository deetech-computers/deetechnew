import { useCallback } from 'react';

export const useCart = () => {
  const addToCart = useCallback((product, quantity = 1, imageUrl = '') => {
    const cart = JSON.parse(localStorage.getItem('deetech-cart')) || [];
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image_url: imageUrl,
        quantity: quantity
      });
    }
    
    localStorage.setItem('deetech-cart', JSON.stringify(cart));
    
    // Dispatch events
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    window.dispatchEvent(new Event('storage'));
  }, []);

  return { addToCart };
};