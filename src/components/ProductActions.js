import React from 'react';
import { ShoppingCart } from 'lucide-react';

const QuantitySelector = ({ quantity, onIncrease, onDecrease, onChange, maxQuantity }) => (
  <div className="quantity-selector">
    <label>Quantity:</label>
    <div className="quantity-controls">
      <button onClick={onDecrease} className="quantity-btn" disabled={quantity <= 1}>-</button>
      <input 
        type="number" 
        value={quantity}
        onChange={(e) => onChange(parseInt(e.target.value) || 1)}
        min="1"
        max={maxQuantity}
        className="quantity-input"
      />
      <button onClick={onIncrease} className="quantity-btn" disabled={quantity >= maxQuantity}>+</button>
    </div>
  </div>
);

const ProductActions = ({ product, quantity, onAddToCart, onQuantityChange }) => (
  <div className="product-actions-section">
    <QuantitySelector 
      quantity={quantity}
      onIncrease={() => onQuantityChange(quantity + 1)}
      onDecrease={() => onQuantityChange(quantity - 1)}
      onChange={onQuantityChange}
      maxQuantity={product.stock_quantity}
    />
    
    <button 
      onClick={onAddToCart} 
      className="btn btn-large btn-primary"
      disabled={product.stock_quantity === 0}
    >
      <ShoppingCart size={20} />
      {product.stock_quantity === 0 
        ? 'Out of Stock' 
        : `Add to Cart - GH₵ ${(parseFloat(product.price) * quantity).toLocaleString()}`
      }
    </button>
  </div>
);

export default React.memo(ProductActions);