// AdminProducts.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Plus, Edit, Package, Image as ImageIcon } from 'lucide-react';
import '../styles/AdminProducts.css';

const AdminProducts = ({ ProductForm, ConfirmationModal }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [view, setView] = useState('list');
  const [editingProduct, setEditingProduct] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
      setImageErrors({});
    } catch (error) {
      console.error('Error loading products:', error);
      setSuccessMessage('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setView('create');
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setView('edit');
  };

  const handleSaveProduct = () => {
    setView('list');
    setSuccessMessage(`Product ${editingProduct ? 'updated' : 'created'} successfully!`);
    loadProducts();
  };

  const handleCancelEdit = () => {
    setView('list');
    setEditingProduct(null);
  };

  const handleDeleteClick = (productId, productName) => {
    setProductToDelete({ id: productId, name: productName });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;
      
      loadProducts();
      setShowDeleteModal(false);
      setProductToDelete(null);
      setSuccessMessage(`Product "${productToDelete.name}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting product:', error);
      setSuccessMessage('Error deleting product');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleImageError = (productId, imageType = 'main') => {
    setImageErrors(prev => ({
      ...prev,
      [`${productId}-${imageType}`]: true
    }));
  };

  const getFallbackImage = () => {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMCA0MEw1MCA2MEw3MCA0MCIgc3Ryb2tlPSIjNjQ3NDhCIiBzdHJva2Utd2lkdGg9IjIiLz4KPHBhdGggZD0iTTI1IDI1SDc1Vjc1SDI1VjI1WiIgc3Ryb2tlPSIjOTRBM0I4IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+';
  };

  // Get ALL unique images for a product (main + gallery without duplicates)
  const getAllUniqueImages = (product) => {
    if (!product) return [];
    
    const allImages = new Set();
    
    // Add main image if exists
    if (product.image_url && product.image_url.trim() !== '') {
      allImages.add(product.image_url.trim());
    }
    
    // Add gallery images if they exist
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (img && img.trim() !== '') {
          allImages.add(img.trim());
        }
      });
    }
    
    return Array.from(allImages);
  };

  // Get only gallery images (excluding main image)
  const getGalleryImages = (product) => {
    if (!product) return [];
    
    const allUniqueImages = getAllUniqueImages(product);
    const mainImage = product.image_url?.trim() || '';
    
    // Filter out the main image from gallery
    return allUniqueImages.filter(img => img !== mainImage);
  };

  // Get total count of unique images
  const getTotalImagesCount = (product) => {
    return getAllUniqueImages(product).length;
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (view === 'create' || view === 'edit') {
    return (
      <ProductForm
        product={editingProduct}
        onSave={handleSaveProduct}
        onCancel={handleCancelEdit}
      />
    );
  }

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div>
      <div className="admin-header">
        <h1>Manage Products</h1>
        <button onClick={handleCreateProduct} className="btn">
          <Plus size={20} />
          Add New Product
        </button>
      </div>

      {successMessage && (
        <div className="success-message-banner">
          {successMessage}
        </div>
      )}

      <div className="products-summary">
        <p>Total Products: <strong>{products.length}</strong></p>
        <p>Featured Products: <strong>{products.filter(p => p.featured).length}</strong></p>
        <p>Total Unique Images: <strong>{products.reduce((total, product) => total + getTotalImagesCount(product), 0)}</strong></p>
      </div>

      <div className="admin-products-list">
        {products.map(product => {
          const allImages = getAllUniqueImages(product);
          const galleryImages = getGalleryImages(product);
          const totalImages = getTotalImagesCount(product);
          const hasImageError = imageErrors[`${product.id}-main`];
          const mainImage = product.image_url?.trim() || getFallbackImage();
          
          return (
            <div key={product.id} className="admin-product-card">
              <div className="product-image">
                <div className="image-container">
                  <img 
                    src={hasImageError ? getFallbackImage() : mainImage}
                    alt={product.name}
                    onError={() => handleImageError(product.id, 'main')}
                    className={hasImageError ? 'image-error' : ''}
                  />
                  {product.featured && <span className="featured-badge">Featured</span>}
                  {totalImages > 0 && (
                    <span className="images-badge">
                      <ImageIcon size={12} />
                      {totalImages} {totalImages === 1 ? 'image' : 'images'}
                    </span>
                  )}
                </div>
                
                {/* Show gallery images preview (excluding main image) */}
                {galleryImages.length > 0 && (
                  <div className="additional-images-preview">
                    {galleryImages.slice(0, 3).map((img, idx) => (
                      <div key={`${product.id}-gallery-${idx}`} className="additional-image-thumb">
                        <img 
                          src={img} 
                          alt={`${product.name} view ${idx + 2}`}
                          onError={(e) => {
                            e.target.src = getFallbackImage();
                          }}
                        />
                      </div>
                    ))}
                    {galleryImages.length > 3 && (
                      <div className="additional-image-more">
                        +{galleryImages.length - 3}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="debug-info" style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
                    Main: {product.image_url ? '✓' : '✗'} | 
                    Gallery: {product.images?.length || 0} | 
                    Unique: {totalImages}
                  </div>
                )}
              </div>
              
              <div className="product-details">
                <h3>{product.name}</h3>
                <div className="product-meta">
                  <span className="product-price">GH₵ {parseFloat(product.price || 0).toFixed(2)}</span>
                  <span className="product-category">{product.category}</span>
                  <span className={`product-stock ${product.stock_quantity === 0 ? 'out-of-stock' : ''}`}>
                    Stock: {product.stock_quantity}
                  </span>
                </div>
                <p className="product-desc">{product.short_description}</p>
                <div className="product-stats">
                  <span className="stat-item">Views: {product.view_count || 0}</span>
                  <span className="stat-item">Images: {totalImages}</span>
                  <span className="stat-item">Updated: {new Date(product.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="product-actions">
                <button 
                  onClick={() => handleEditProduct(product)}
                  className="btn btn-small"
                  title="Edit Product"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteClick(product.id, product.name)}
                  className="btn btn-small btn-danger"
                  title="Delete Product"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="empty-state">
          <Package size={48} />
          <h3>No Products Found</h3>
          <p>Get started by adding your first product.</p>
          <button onClick={handleCreateProduct} className="btn">
            <Plus size={20} />
            Add First Product
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete ? productToDelete.name : ''}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default AdminProducts;