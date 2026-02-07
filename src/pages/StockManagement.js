// StockManagement.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import '../styles/StockManagement.css';


// Simple toast component for stock management
const StockToast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`stock-toast stock-toast-${type}`}>
      <span>{message}</span>
      <button onClick={onClose} className="stock-toast-close" aria-label="Close notification">
        ×
      </button>
    </div>
  );
};

const StockManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, low, out, active, inactive
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockChange, setStockChange] = useState({
    type: 'restock', // restock, adjustment, return
    amount: 0,
    notes: ''
  });
  const [stockHistory, setStockHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [updatingThresholds, setUpdatingThresholds] = useState(new Set());
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadProducts();
    
    // Set up real-time subscription for stock changes
    const subscription = supabase
      .channel('stock-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'products' 
        }, 
        (payload) => {
          console.log('Stock change detected:', payload);
          loadProducts(); // Reload products when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStockHistory = async (productId) => {
    try {
      const { data, error } = await supabase
        .from('stock_history')
        .select(`
          *,
          users:admin_id (email, first_name, last_name)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setStockHistory(data || []);
    } catch (error) {
      console.error('Error loading stock history:', error);
    }
  };

  const updateStock = async (productId, changeType, amount, notes = '') => {
    try {
      // Get current product
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity, low_stock_threshold')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      const oldQuantity = product.stock_quantity;
      let newQuantity = oldQuantity;

      if (changeType === 'adjustment') {
        if (amount < 0) {
          setToast({ message: 'Stock quantity cannot be negative', type: 'error' });
          return;
        }
        newQuantity = amount;
      } else if (changeType === 'purchase') {
        if (amount > oldQuantity) {
          setToast({ message: `Cannot sell ${amount} items when only ${oldQuantity} are in stock`, type: 'error' });
          return;
        }
        newQuantity = oldQuantity - amount;
      } else if (changeType === 'restock' || changeType === 'return') {
        newQuantity = oldQuantity + amount;
      } else {
        throw new Error('Invalid change type');
      }

      if (newQuantity < 0) {
        setToast({ message: 'Cannot set stock to negative quantity', type: 'error' });
        return;
      }

      // Get fresh product data for threshold
      const { data: freshProduct } = await supabase
        .from('products')
        .select('low_stock_threshold')
        .eq('id', productId)
        .single();

      const threshold = freshProduct?.low_stock_threshold || 5;

      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          stock_quantity: newQuantity,
          updated_at: new Date().toISOString(),
          is_active: newQuantity > 0 // Auto-activate if stock > 0
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Record in stock history
      const { error: historyError } = await supabase
        .from('stock_history')
        .insert([{
          product_id: productId,
          old_quantity: oldQuantity,
          new_quantity: newQuantity,
          change_amount: Math.abs(newQuantity - oldQuantity),
          change_type: changeType,
          notes: notes,
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          created_at: new Date().toISOString()
        }]);

      if (historyError) throw historyError;

      // Check and update stock alerts
      await checkStockAlerts(productId, newQuantity, threshold);

      setToast({ message: `Stock updated successfully! New quantity: ${newQuantity}`, type: 'success' });
      setShowStockModal(false);
      setStockChange({ type: 'restock', amount: 0, notes: '' });
      loadProducts();

    } catch (error) {
      console.error('Error updating stock:', error);
      setToast({ message: `Error updating stock: ${error.message}`, type: 'error' });
    }
  };

  const checkStockAlerts = async (productId, newQuantity, threshold = 5) => {
    try {
      const finalThreshold = threshold || 5;

      if (newQuantity <= finalThreshold) {
        // Create or update stock alert
        const { error } = await supabase
          .from('stock_alerts')
          .upsert({
            product_id: productId,
            current_stock: newQuantity,
            threshold: finalThreshold,
            is_active: true,
            notified: false,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'product_id',
            ignoreDuplicates: false
          });

        if (error) {
          console.error('Error creating/updating stock alert:', error);
          // Fallback: try insert then update
          await handleStockAlertFallback(productId, newQuantity, finalThreshold, true);
        }
      } else {
        // Deactivate alert if stock is now above threshold
        const { error } = await supabase
          .from('stock_alerts')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('product_id', productId);

        if (error && !error.message.includes('PGRST116')) {
          console.error('Error deactivating stock alert:', error);
        }
      }
    } catch (error) {
      console.error('Error checking stock alerts:', error);
    }
  };

  const handleStockAlertFallback = async (productId, newQuantity, threshold, isActive) => {
    try {
      // Try to insert first
      const { error: insertError } = await supabase
        .from('stock_alerts')
        .insert([{
          product_id: productId,
          current_stock: newQuantity,
          threshold: threshold,
          is_active: isActive,
          notified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError && insertError.code === '23505') { // Unique violation
        // If insert fails due to duplicate, try update
        const { error: updateError } = await supabase
          .from('stock_alerts')
          .update({
            current_stock: newQuantity,
            threshold: threshold,
            is_active: isActive,
            notified: false,
            updated_at: new Date().toISOString()
          })
          .eq('product_id', productId);

        if (updateError) {
          console.error('Error updating stock alert in fallback:', updateError);
        }
      } else if (insertError) {
        console.error('Error inserting stock alert in fallback:', insertError);
      }
    } catch (error) {
      console.error('Error in stock alert fallback:', error);
    }
  };

  const updateThreshold = async (productId, newThreshold) => {
    setUpdatingThresholds(prev => new Set(prev).add(productId));
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          low_stock_threshold: newThreshold,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;
      
      // Reload products to get updated data
      await loadProducts();
    } catch (error) {
      console.error('Error updating threshold:', error);
      setToast({ message: `Error updating threshold: ${error.message}`, type: 'error' });
    } finally {
      setUpdatingThresholds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;

      loadProducts();
      setToast({ message: `Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`, type: 'success' });
    } catch (error) {
      console.error('Error toggling product status:', error);
      setToast({ message: `Error updating product status: ${error.message}`, type: 'error' });
    }
  };

  const openStockModal = (product, changeType = 'restock') => {
    setSelectedProduct(product);
    setStockChange({
      type: changeType,
      amount: changeType === 'adjustment' ? product.stock_quantity : 0,
      notes: ''
    });
    setShowStockModal(true);
  };

  const viewStockHistory = (product) => {
    setSelectedProduct(product);
    setShowHistory(true);
    loadStockHistory(product.id);
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl || imageUrl === '' || imageUrl === '""') {
      return null;
    }
    return imageUrl;
  };

  const getStockStatus = (product) => {
    if (product.stock_quantity === 0) {
      return { text: 'Out of Stock', color: 'red', icon: '❌' };
    } else if (product.stock_quantity <= (product.low_stock_threshold || 5)) {
      return { text: 'Low Stock', color: 'orange', icon: '⚠️' };
    } else {
      return { text: 'In Stock', color: 'green', icon: '✅' };
    }
  };

  const getStockQuantityClass = (quantity, threshold = 5) => {
    if (quantity === 0) return 'out';
    if (quantity <= threshold) return 'low';
    return 'good';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'low' ? (product.stock_quantity <= (product.low_stock_threshold || 5) && product.stock_quantity > 0) :
      filter === 'out' ? product.stock_quantity === 0 :
      filter === 'active' ? product.is_active :
      filter === 'inactive' ? !product.is_active : true;

    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <div className="stock-management">
      <div className="stock-loading">
        <div className="spinner"></div>
        <p>Loading stock data...</p>
      </div>
    </div>
  );

  return (
    <div className="stock-management">
      {toast && (
        <StockToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="admin-header">
        <h1>Stock Management</h1>
        <div className="stock-stats">
          <span>Total: {products.length}</span>
          <span className="text-green">In Stock: {products.filter(p => p.stock_quantity > 0).length}</span>
          <span className="text-orange">Low Stock: {products.filter(p => p.stock_quantity <= (p.low_stock_threshold || 5) && p.stock_quantity > 0).length}</span>
          <span className="text-red">Out of Stock: {products.filter(p => p.stock_quantity === 0).length}</span>
        </div>
      </div>

      <div className="admin-controls">
        <SearchInput 
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search products..."
        />
        
        <div className="filter-group">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Products</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Status</th>
              <th>Low Stock Threshold</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product);
              const imageUrl = getImageUrl(product.image_url);
              const isUpdating = updatingThresholds.has(product.id);
              
              return (
                <tr key={product.id}>
                  <td>
                    <div className="product-info">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={product.name}
                          className="product-thumb"
                          onError={handleImageError}
                        />
                      ) : (
                        <div className="product-thumb image-fallback">
                          📷
                        </div>
                      )}
                      <div className="product-text-info">
                        <div className="product-name">{product.name}</div>
                        <div className="product-price">GH₵ {parseFloat(product.price || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>
                    <div className={`stock-quantity ${getStockQuantityClass(product.stock_quantity, product.low_stock_threshold)}`}>
                      <strong>{product.stock_quantity}</strong>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${stockStatus.color}`}>
                      {stockStatus.icon} {stockStatus.text}
                    </span>
                    <br />
                    <small>
                      {product.is_active ? '🟢 Active' : '🔴 Inactive'}
                    </small>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={product.low_stock_threshold || 5}
                      onChange={(e) => {
                        const newThreshold = parseInt(e.target.value) || 5;
                        updateThreshold(product.id, newThreshold);
                      }}
                      className="threshold-input"
                      min="1"
                      disabled={isUpdating}
                    />
                    {isUpdating && <div className="updating-indicator">...</div>}
                  </td>
                  <td>
                    {new Date(product.updated_at).toLocaleDateString()}
                    <br />
                    <small>{new Date(product.updated_at).toLocaleTimeString()}</small>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => openStockModal(product, 'restock')}
                        className="btn btn-small btn-success"
                        title="Restock"
                      >
                        ➕ Restock
                      </button>
                      <button
                        onClick={() => openStockModal(product, 'adjustment')}
                        className="btn btn-small"
                        title="Adjust Stock"
                      >
                        ✏️ Adjust
                      </button>
                      <button
                        onClick={() => viewStockHistory(product)}
                        className="btn btn-small btn-secondary"
                        title="View History"
                      >
                        📊 History
                      </button>
                      <button
                        onClick={() => toggleProductStatus(product.id, product.is_active)}
                        className={`btn btn-small ${product.is_active ? 'btn-warning' : 'btn-success'}`}
                        title={product.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {product.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mobile-cards-view">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product);
            const imageUrl = getImageUrl(product.image_url);
            const isUpdating = updatingThresholds.has(product.id);
            
            return (
              <div key={product.id} className="stock-card">
                <div className="stock-card-header">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={product.name}
                      className="stock-card-thumb"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="stock-card-thumb image-fallback">
                      📷
                    </div>
                  )}
                  <div className="stock-card-title">
                    <h3>{product.name}</h3>
                    <div className="product-price">GH₵ {parseFloat(product.price || 0).toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="stock-card-details">
                  <div className="stock-card-row">
                    <span className="label">Category</span>
                    <span className="value">{product.category}</span>
                  </div>
                  
                  <div className="stock-card-row">
                    <span className="label">Current Stock</span>
                    <span className={`value ${getStockQuantityClass(product.stock_quantity, product.low_stock_threshold)}`}>
                      <strong>{product.stock_quantity}</strong>
                      <span className={`stock-status-mobile ${stockStatus.color}`}>
                        {stockStatus.icon} {stockStatus.text}
                      </span>
                    </span>
                  </div>
                  
                  <div className="stock-card-row">
                    <span className="label">Status</span>
                    <span className="value">
                      {product.is_active ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </div>
                  
                  <div className="stock-card-row">
                    <span className="label">Low Stock Threshold</span>
                    <span className="value">
                      <input
                        type="number"
                        value={product.low_stock_threshold || 5}
                        onChange={(e) => {
                          const newThreshold = parseInt(e.target.value) || 5;
                          updateThreshold(product.id, newThreshold);
                        }}
                        className="threshold-input-mobile"
                        min="1"
                        disabled={isUpdating}
                      />
                      {isUpdating && <span className="updating-indicator">...</span>}
                    </span>
                  </div>
                  
                  <div className="stock-card-row">
                    <span className="label">Last Updated</span>
                    <span className="value">
                      {new Date(product.updated_at).toLocaleDateString()}
                      <br />
                      <small>{new Date(product.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                    </span>
                  </div>
                </div>
                
                <div className="stock-card-actions">
                  <button
                    onClick={() => openStockModal(product, 'restock')}
                    className="btn btn-small btn-success"
                    title="Restock"
                  >
                    ➕ Restock
                  </button>
                  <button
                    onClick={() => openStockModal(product, 'adjustment')}
                    className="btn btn-small"
                    title="Adjust Stock"
                  >
                    ✏️ Adjust
                  </button>
                  <button
                    onClick={() => viewStockHistory(product)}
                    className="btn btn-small btn-secondary"
                    title="View History"
                  >
                    📊 History
                  </button>
                  <button
                    onClick={() => toggleProductStatus(product.id, product.is_active)}
                    className={`btn btn-small ${product.is_active ? 'btn-warning' : 'btn-success'}`}
                    title={product.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {product.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                  </button>
                </div>
              </div>
            );
          })}
          
          {filteredProducts.length === 0 && (
            <div className="stock-empty-state">
              <div className="icon">📦</div>
              <h3>No Products Found</h3>
              <p>No products match your search criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Stock Update Modal */}
      {showStockModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {stockChange.type === 'restock' ? 'Restock Product' : 
                 stockChange.type === 'adjustment' ? 'Adjust Stock' : 'Update Stock'}
              </h3>
              <button onClick={() => setShowStockModal(false)} className="close-btn">×</button>
            </div>
            
            <div className="modal-body">
              <div className="product-info-modal">
                {getImageUrl(selectedProduct.image_url) ? (
                  <img 
                    src={getImageUrl(selectedProduct.image_url)} 
                    alt={selectedProduct.name} 
                    onError={handleImageError}
                  />
                ) : (
                  <div className="no-image">No Image</div>
                )}
                <div className="product-modal-details">
                  <h4>{selectedProduct.name}</h4>
                  <p>Current Stock: <strong>{selectedProduct.stock_quantity}</strong></p>
                  <p>Category: {selectedProduct.category}</p>
                </div>
              </div>

              <div className="form-group">
                <label>
                  {stockChange.type === 'restock' ? 'Quantity to Add' : 
                   stockChange.type === 'adjustment' ? 'New Stock Quantity' : 'Amount'}
                </label>
                <input
                  type="number"
                  value={stockChange.amount}
                  onChange={(e) => setStockChange(prev => ({
                    ...prev,
                    amount: parseInt(e.target.value) || 0
                  }))}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={stockChange.notes}
                  onChange={(e) => setStockChange(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  placeholder="Add notes about this stock change..."
                  rows="3"
                />
              </div>

              {stockChange.type === 'adjustment' && (
                <div className="info-message">
                  ⚠️ This will set the stock quantity to the specified amount.
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button onClick={() => setShowStockModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button 
                onClick={() => updateStock(
                  selectedProduct.id, 
                  stockChange.type, 
                  stockChange.amount,
                  stockChange.notes
                )}
                className="btn btn-primary"
                disabled={stockChange.amount < 0}
              >
                Confirm {stockChange.type === 'restock' ? 'Restock' : 'Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock History Modal */}
      {showHistory && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>Stock History - {selectedProduct.name}</h3>
              <button onClick={() => setShowHistory(false)} className="close-btn">×</button>
            </div>
            
            <div className="modal-body">
              <div className="stock-history-list">
                {stockHistory.map((record) => (
                  <div key={record.id} className="history-item">
                    <div className="history-main">
                      <span className={`change-type ${record.change_type}`}>
                        {record.change_type}
                      </span>
                      <span className="change-amount">
                        {record.change_type === 'restock' || record.change_type === 'return' ? '+' : '-'}
                        {record.change_amount}
                      </span>
                      <span className="stock-range">
                        {record.old_quantity} → {record.new_quantity}
                      </span>
                    </div>
                    <div className="history-details">
                      <span className="date">
                        {new Date(record.created_at).toLocaleString()}
                      </span>
                      {record.users && (
                        <span className="admin">
                          by {record.users.first_name} {record.users.last_name}
                        </span>
                      )}
                      {record.notes && (
                        <span className="notes">Note: {record.notes}</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {stockHistory.length === 0 && (
                  <div className="no-history">
                    <div className="icon">📊</div>
                    No stock history found for this product.
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-actions">
              <button onClick={() => setShowHistory(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Search Input with debounce
const SearchInput = ({ value, onChange, placeholder = 'Search...' }) => {
  const [localValue, setLocalValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [localValue, onChange]);
  
  return (
    <div className="search-box">
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="search-input"
      />
    </div>
  );
};

export default StockManagement;
