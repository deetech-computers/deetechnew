import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/supabase';

import '../styles/wishlist.css';

import { Heart, ShoppingCart, Trash2 } from 'lucide-react';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWishlistItems(data || []);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
      
      // Remove from local state
      setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const addToCartFromWishlist = (product) => {
    const cart = JSON.parse(localStorage.getItem('deetech-cart')) || [];
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image_url: product.image_url,
        quantity: 1
      });
    }
    
    localStorage.setItem('deetech-cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    
    // Optional: Remove from wishlist after adding to cart
    // removeFromWishlist(product.id);
  };

  const formatPrice = (price) => {
    return `GH₵ ${parseFloat(price).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="wishlist-section">
      <div className="wishlist-header">
        <h2>
          <Heart size={24} />
          My Wishlist
        </h2>
        <p>Save your favorite products for later</p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="empty-wishlist">
          <Heart size={48} />
          <h3>Your wishlist is empty</h3>
          <p>Start adding products you love to your wishlist!</p>
          <Link to="/products" className="btn">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlistItems.map((item) => (
            <div key={item.id} className="wishlist-item">
              <div className="wishlist-item-image">
                <img 
                  src={item.products.image_url || '/api/placeholder/200/200'} 
                  alt={item.products.name}
                />
                <button
                  className="remove-wishlist-btn"
                  onClick={() => removeFromWishlist(item.product_id)}
                  title="Remove from wishlist"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="wishlist-item-info">
                <h4>{item.products.name}</h4>
                <p className="wishlist-item-category">{item.products.category}</p>
                <p className="wishlist-item-price">{formatPrice(item.products.price)}</p>
                
                <div className="wishlist-item-stock">
                  {item.products.stock_quantity > 0 ? (
                    <span className="in-stock">In Stock</span>
                  ) : (
                    <span className="out-of-stock">Out of Stock</span>
                  )}
                </div>
                
                <div className="wishlist-item-actions">
                  <button
                    className="btn btn-small"
                    onClick={() => addToCartFromWishlist(item.products)}
                    disabled={item.products.stock_quantity === 0}
                  >
                    <ShoppingCart size={16} />
                    Add to Cart
                  </button>
                  <Link
                    to={`/product/${item.products.id}`}
                    className="btn btn-small btn-secondary"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;