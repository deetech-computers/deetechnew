// admin.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import '../App.css';
import '../styles/admin.css';

import { 
  Package, Image, BarChart3, Settings, X, Edit, Plus, Save, ArrowLeft, 
  Link as LinkIcon, Upload, ShoppingCart, Users, Eye, Truck, DollarSign,
  TrendingUp
} from 'lucide-react';
import AdminAffiliates from './AdminAffiliates';
import AdminUsers from './AdminUsers';
import AdminDashboard from './AdminDashboard';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminOrders';
import AdminBanner from './AdminBanner';
import StockManagement from './StockManagement';

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="confirmation-modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn btn-danger">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Product Form Component
const ProductForm = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    price: '',
    category: '',
    specifications: '',
    featured: false,
    stock_quantity: 0,
    image_url: '',
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [useImageUpload, setUseImageUpload] = useState(false);
  const [imageUrls, setImageUrls] = useState(['']);

  const categories = ['laptops', 'phones', 'monitors', 'accessories', 'storage', 'printers'];

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        short_description: product.short_description || '',
        price: product.price || '',
        category: product.category || '',
        specifications: product.specifications || '',
        featured: product.featured || false,
        stock_quantity: product.stock_quantity || 0,
        image_url: product.image_url || '',
        images: product.images || []
      });
      
      // Load existing images properly without duplicates
      let urls = [];
      if (product.image_url && product.image_url.trim() !== '') {
        urls = [product.image_url];
      }
      
      // Add gallery images that are NOT the same as the main image
      if (product.images && Array.isArray(product.images)) {
        const uniqueGalleryImages = product.images.filter(img => 
          img && 
          img.trim() !== '' && 
          img !== product.image_url
        );
        urls = [...urls, ...uniqueGalleryImages];
      }
      
      // Ensure we have at least one empty field
      if (urls.length === 0) {
        urls = [''];
      }
      
      setImageUrls(urls);
    } else {
      setFormData({
        name: '',
        description: '',
        short_description: '',
        price: '',
        category: '',
        specifications: '',
        featured: false,
        stock_quantity: 0,
        image_url: '',
        images: []
      });
      setImageUrls(['']);
      setImageFile(null);
      setUseImageUpload(false);
    }
  }, [product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = '';
      let finalImagesArray = [];

      if (useImageUpload && imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `products/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('deetech-files')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('deetech-files')
          .getPublicUrl(fileName);

        finalImageUrl = publicUrl;
        finalImagesArray = [publicUrl];
      } else {
        // Process image URLs: trim, filter empty, remove duplicates
        const validUrls = imageUrls
          .map(url => url.trim())
          .filter(url => url !== '');
        
        // Remove duplicates using Set
        const uniqueUrls = [...new Set(validUrls)];
        
        if (uniqueUrls.length > 0) {
          // First URL is main image
          finalImageUrl = uniqueUrls[0];
          // Remaining URLs are gallery images
          finalImagesArray = uniqueUrls.slice(1);
        } else if (product && product.image_url) {
          // Preserve existing image if no new URLs provided
          finalImageUrl = product.image_url;
          // Ensure gallery doesn't contain main image
          finalImagesArray = (product.images || []).filter(img => 
            img && img.trim() !== '' && img !== product.image_url
          );
        }
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        image_url: finalImageUrl,
        images: finalImagesArray, // Store only gallery images (no duplicates)
        updated_at: new Date().toISOString()
      };

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            ...productData,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUrlChange = (index, value) => {
    const newImageUrls = [...imageUrls];
    newImageUrls[index] = value;
    setImageUrls(newImageUrls);
  };

  const addImageUrlField = () => {
    setImageUrls([...imageUrls, '']);
  };

  const removeImageUrlField = (index) => {
    if (imageUrls.length > 1) {
      const newImageUrls = imageUrls.filter((_, i) => i !== index);
      setImageUrls(newImageUrls);
    } else {
      // If removing the only field, clear it instead
      setImageUrls(['']);
    }
  };

  const clearAllImageUrls = () => {
    setImageUrls(['']);
  };

  const handleImageMethodChange = (useUpload) => {
    setUseImageUpload(useUpload);
    if (!useUpload) {
      setImageFile(null);
    }
    if (useUpload) {
      setImageUrls(['']);
    }
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    const errorElement = e.target.nextSibling;
    if (errorElement && errorElement.classList.contains('preview-error')) {
      errorElement.style.display = 'block';
    }
  };

  const getUniqueImageCount = () => {
    const validUrls = imageUrls
      .map(url => url.trim())
      .filter(url => url !== '');
    const uniqueUrls = [...new Set(validUrls)];
    return uniqueUrls.length;
  };

  return (
    <div className="product-form-container">
      <div className="form-header">
        <button onClick={onCancel} className="btn btn-secondary">
          <ArrowLeft size={20} />
          Back to Products
        </button>
        <h1>{product ? 'Edit Product' : 'Add New Product'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-row">
          <div className="form-group">
            <label>Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Enter product name"
            />
          </div>
          <div className="form-group">
            <label>Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Price (GH₵) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              required
              placeholder="0.00"
            />
          </div>
          <div className="form-group">
            <label>Stock Quantity *</label>
            <input
              type="number"
              name="stock_quantity"
              value={formData.stock_quantity}
              onChange={handleInputChange}
              min="0"
              required
              placeholder="0"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Short Description *</label>
          <input
            type="text"
            name="short_description"
            value={formData.short_description}
            onChange={handleInputChange}
            required
            placeholder="Brief description for product cards"
          />
        </div>

        <div className="form-group">
          <label>Full Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
            placeholder="Detailed product description"
          />
        </div>

        <div className="form-group">
          <label>Specifications (comma-separated)</label>
          <textarea
            name="specifications"
            value={formData.specifications}
            onChange={handleInputChange}
            rows="3"
            placeholder="Spec 1, Spec 2, Spec 3, ..."
          />
          <small>Enter each specification separated by commas</small>
        </div>

        <div className="form-section">
          <h3>Product Images</h3>
          
          <div className="image-method-selection">
            <label className="method-option">
              <input
                type="radio"
                name="imageMethod"
                checked={!useImageUpload}
                onChange={() => handleImageMethodChange(false)}
              />
              <div className="method-content">
                <LinkIcon size={20} />
                <span>Use Image URLs</span>
                <small>Paste multiple image URLs</small>
              </div>
            </label>
            
            <label className="method-option">
              <input
                type="radio"
                name="imageMethod"
                checked={useImageUpload}
                onChange={() => handleImageMethodChange(true)}
              />
              <div className="method-content">
                <Upload size={20} />
                <span>Upload Image File</span>
                <small>Upload single image from device</small>
              </div>
            </label>
          </div>

          {!useImageUpload && (
            <div className="image-urls-section">
              <div className="section-header">
                <label>Image URLs ({getUniqueImageCount()} unique images)</label>
                {imageUrls.filter(url => url.trim() !== '').length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllImageUrls}
                    className="btn btn-small btn-danger"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="image-urls-instructions">
                <small>
                  <strong>Important:</strong> First URL will be the main product image. 
                  All URLs are automatically deduplicated. 
                  If you paste the same URL multiple times, only one will be saved.
                </small>
              </div>
              
              {imageUrls.map((url, index) => (
                <div key={index} className="url-input-group">
                  <div className="url-input-header">
                    <span className="url-label">
                      {index === 0 ? 'Main Image URL *' : `Gallery Image ${index}`}
                    </span>
                    {imageUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageUrlField(index)}
                        className="btn btn-small btn-danger btn-icon"
                        title="Remove this image"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleImageUrlChange(index, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="url-input"
                    required={index === 0 && !useImageUpload}
                  />
                  {url && url.trim() !== '' && (
                    <div className="url-preview">
                      <img 
                        src={url} 
                        alt={`Preview ${index === 0 ? 'main' : `gallery ${index}`}`}
                        onError={handleImageError}
                      />
                      <div className="preview-error" style={{display: 'none'}}>
                        Invalid image URL
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="url-actions">
                <button
                  type="button"
                  onClick={addImageUrlField}
                  className="btn btn-secondary btn-small"
                >
                  <Plus size={16} />
                  Add Gallery Image URL
                </button>
                <small>
                  {getUniqueImageCount() === 0 ? (
                    'Enter at least one image URL for the main product image.'
                  ) : getUniqueImageCount() === 1 ? (
                    '1 unique image will be saved as main product image.'
                  ) : (
                    `${getUniqueImageCount()} unique images will be saved. First as main image, others as gallery.`
                  )}
                </small>
              </div>
            </div>
          )}

          {useImageUpload && (
            <div className="file-upload-section">
              <label>Upload Product Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                required={!product && !imageFile}
              />
              
              {formData.image_url && !imageFile && (
                <div className="image-preview">
                  <img src={formData.image_url} alt="Current product" />
                  <small>Current image</small>
                </div>
              )}
              
              {imageFile && (
                <div className="image-preview">
                  <img src={URL.createObjectURL(imageFile)} alt="New product preview" />
                  <small>New image preview</small>
                </div>
              )}
              
              <small>Upload product image (will use your Supabase storage). Only single image upload is supported.</small>
            </div>
          )}
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleInputChange}
            />
            Featured Product
          </label>
          <small>Show this product in featured section on homepage</small>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn" disabled={loading}>
            <Save size={20} />
            {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
          </button>
        </div>
      </form>
    </div>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, onStatusUpdate }) => {
  // Safe order ID display
  const getOrderDisplayId = (order) => {
    if (!order.id) return 'N/A';
    const idString = String(order.id);
    return `#${idString.slice(-8)}`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>Order Details - {getOrderDisplayId(order)}</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="modal-body">
          <div className="order-details-grid">
            <div className="detail-section">
              <h4>Customer Information</h4>
              <div className="detail-item">
                <span className="label">Name:</span>
                <span className="value">{order.customer_name}</span>
              </div>
              <div className="detail-item">
                <span className="label">Email:</span>
                <span className="value">{order.customer_email}</span>
              </div>
              <div className="detail-item">
                <span className="label">Phone:</span>
                <span className="value">{order.customer_phone}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Delivery Information</h4>
              <div className="detail-item">
                <span className="label">Address:</span>
                <span className="value">{order.delivery_address}</span>
              </div>
              <div className="detail-item">
                <span className="label">Region:</span>
                <span className="value">{order.region}</span>
              </div>
              <div className="detail-item">
                <span className="label">City:</span>
                <span className="value">{order.city}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Order Information</h4>
              <div className="detail-item">
                <span className="label">Status:</span>
                <span className="value">
                  <select
                    value={order.status}
                    onChange={(e) => onStatusUpdate(order.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Payment Method:</span>
                <span className="value">{order.payment_method}</span>
              </div>
              <div className="detail-item">
                <span className="label">Order Date:</span>
                <span className="value">{new Date(order.created_at).toLocaleString()}</span>
              </div>
            </div>

            {order.referrals && order.referrals.length > 0 && (
              <div className="detail-section">
                <h4>Affiliate Information</h4>
                <div className="detail-item">
                  <span className="label">Affiliate:</span>
                  <span className="value">{order.referrals[0].affiliates?.full_name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Commission:</span>
                  <span className="value">GH₵ {parseFloat(order.referrals[0].commission_amount || 0).toFixed(2)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Referral Status:</span>
                  <span className="value">{order.referrals[0].status}</span>
                </div>
              </div>
            )}
          </div>

          <div className="order-items-section">
            <h4>Order Items</h4>
            <div className="order-items-list">
              {order.items && order.items.map((item, index) => (
                <div key={item.id || `${item.name}-${index}`} className="order-item-detail">
                  <img src={item.image_url || '/api/placeholder/60/60'} alt={item.name} />
                  <div className="item-info">
                    <h5>{item.name}</h5>
                    <p>Quantity: {item.quantity}</p>
                    <p>Price: GH₵ {parseFloat(item.price || 0).toFixed(2)}</p>
                  </div>
                  <div className="item-total">
                    GH₵ {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="order-total">
              <strong>Total: GH₵ {parseFloat(order.total_amount || 0).toFixed(2)}</strong>
            </div>
          </div>

          {order.payment_proof_url && (
            <div className="payment-proof-section">
              <h4>Payment Proof</h4>
              <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer">
                <img src={order.payment_proof_url} alt="Payment proof" className="payment-proof-image" />
              </a>
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div className="error-fallback">Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}

// Main Admin Component
const Admin = () => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  if (!isAdmin()) {
    return (
      <div className="container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="admin-layout">
        <div className="admin-sidebar">
          <div className="admin-brand">
            <Settings size={24} />
            <span>Admin Panel</span>
          </div>
          
          <nav className="admin-nav">
            <Link 
              to="/admin" 
              className={`admin-nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
            >
              <BarChart3 size={20} />
              Dashboard
            </Link>
            <Link 
              to="/admin/products" 
              className={`admin-nav-link ${location.pathname.includes('/products') ? 'active' : ''}`}
            >
              <Package size={20} />
              Products
            </Link>
            <Link 
              to="/admin/orders" 
              className={`admin-nav-link ${location.pathname.includes('/orders') ? 'active' : ''}`}
            >
              <ShoppingCart size={20} />
              Orders
            </Link>
            <Link 
              to="/admin/affiliates" 
              className={`admin-nav-link ${location.pathname.includes('/affiliates') ? 'active' : ''}`}
            >
              <Users size={20} />
              Affiliates
            </Link>
            <Link 
              to="/admin/banner" 
              className={`admin-nav-link ${location.pathname.includes('/banner') ? 'active' : ''}`}
            >
              <Image size={20} />
              Banner
            </Link>
            <Link 
              to="/admin/users" 
              className={`admin-nav-link ${location.pathname.includes('/users') ? 'active' : ''}`}
            >
              <Users size={20} />
              Users
            </Link>
            <Link 
              to="/admin/stock" 
              className={`admin-nav-link ${location.pathname.includes('/stock') ? 'active' : ''}`}
            >
              <TrendingUp size={20} />
              Stock Management
            </Link>
          </nav>
        </div>

        <div className="admin-content">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/products" element={<AdminProducts ProductForm={ProductForm} ConfirmationModal={ConfirmationModal} />} />
            <Route path="/orders" element={<AdminOrders OrderDetailsModal={OrderDetailsModal} ConfirmationModal={ConfirmationModal} />} />
            <Route path="/affiliates" element={<AdminAffiliates />} />
            <Route path="/banner" element={<AdminBanner />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/stock" element={<StockManagement />} />
          </Routes>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Admin;