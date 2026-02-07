// AdminBanner.js - Enhanced with Page Linking
import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { ArrowLeft, Plus, Edit, Image, Upload, Link as LinkIcon, X, ExternalLink } from 'lucide-react';
import '../styles/AdminBanner.css';

const AdminBanner = () => {
  const [banners, setBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState({
    id: null,
    title: '',
    description: '',
    images: [],
    imageMethod: 'upload',
    linkType: 'none', // 'none', 'internal', 'external'
    linkUrl: '',
    category: '' // For internal product category links
  });
  const [imageUrls, setImageUrls] = useState(['']);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [view, setView] = useState('list'); // 'list', 'create', 'edit'
  const [objectUrls, setObjectUrls] = useState([]);

  // Available internal pages for linking
  const internalPages = [
    { value: '/', label: 'Home Page' },
    { value: '/products', label: 'All Products' },
    { value: '/products?category=laptops', label: 'Laptops Category' },
    { value: '/products?category=phones', label: 'Phones Category' },
    { value: '/products?category=monitors', label: 'Monitors Category' },
    { value: '/products?category=accessories', label: 'Accessories Category' },
    { value: '/products?category=storage', label: 'Storage Category' },
    { value: '/products?category=printers', label: 'Printers Category' },
    { value: '/products?sort=featured', label: 'Featured Products' },
    { value: '/products?sort=best-selling', label: 'Best Sellers' },
    { value: '/products?sort=popular', label: 'Trending Products' },
    { value: '/affiliates', label: 'Affiliate Program' },
    { value: '/about', label: 'About Us' },
    { value: '/support', label: 'Support' },
    { value: '/warranty', label: 'Warranty Policy' },
    { value: '/delivery-policy', label: 'Delivery Policy' },
    { value: '/return-refund-policy', label: 'Return & Refund Policy' },
    { value: '/payment-policy', label: 'Payment Policy' },
    { value: '/faq', label: 'FAQ' }
  ];

  useEffect(() => {
    loadBanners();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const loadBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error loading banners:', error);
      setSuccessMessage('Error loading banners');
    }
  };

  const handleCreateNew = () => {
    setCurrentBanner({
      id: null,
      title: '',
      description: '',
      images: [],
      imageMethod: 'upload',
      linkType: 'none',
      linkUrl: '',
      category: ''
    });
    setImageUrls(['']);
    setView('create');
  };

  const handleEditBanner = (banner) => {
    const images = banner.images || (banner.image_url ? [banner.image_url] : []);
    
    setCurrentBanner({
      id: banner.id,
      title: banner.title || '',
      description: banner.description || '',
      images: images,
      imageMethod: images.length > 0 ? 'url' : 'upload',
      linkType: banner.link_type || 'none',
      linkUrl: banner.link_url || '',
      category: banner.category || ''
    });
    
    if (images.length > 0) {
      setImageUrls([...images, '']);
    } else {
      setImageUrls(['']);
    }
    
    setView('edit');
  };

  const handleCancel = () => {
    setView('list');
    setCurrentBanner({
      id: null,
      title: '',
      description: '',
      images: [],
      imageMethod: 'upload',
      linkType: 'none',
      linkUrl: '',
      category: ''
    });
    setImageUrls(['']);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalImages = [];

      if (currentBanner.imageMethod === 'upload' && currentBanner.images.length > 0) {
        // Handle multiple file uploads
        for (const image of currentBanner.images) {
          if (image instanceof File) {
            const fileExt = image.name.split('.').pop();
            const fileName = `banners/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('deetech-files')
              .upload(fileName, image);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
              .from('deetech-files')
              .getPublicUrl(fileName);

            finalImages.push(urlData.publicUrl);
          } else if (typeof image === 'string') {
            // Keep existing URLs
            finalImages.push(image);
          }
        }
      } else if (currentBanner.imageMethod === 'url') {
        // Handle multiple URLs
        const validUrls = imageUrls.filter(url => url && url.trim() !== '');
        for (const url of validUrls) {
          // Validate URL format
          try {
            new URL(url.trim());
            finalImages.push(url.trim());
          } catch (error) {
            throw new Error(`Please enter a valid URL: ${url}`);
          }
        }
      }

      const bannerData = {
        title: currentBanner.title,
        description: currentBanner.description,
        images: finalImages,
        image_url: finalImages[0] || '', // Keep for backward compatibility
        link_type: currentBanner.linkType,
        link_url: currentBanner.linkType !== 'none' ? currentBanner.linkUrl : null,
        category: currentBanner.category || null,
        updated_at: new Date().toISOString()
      };

      let error;

      if (currentBanner.id) {
        // Update existing banner
        const { error: updateError } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', currentBanner.id);
        error = updateError;
      } else {
        // Create new banner
        const { error: insertError } = await supabase
          .from('banners')
          .insert([{
            ...bannerData,
            created_at: new Date().toISOString()
          }]);
        error = insertError;
      }

      if (error) throw error;
      
      setSuccessMessage(`Banner ${currentBanner.id ? 'updated' : 'created'} successfully with ${finalImages.length} images!`);
      setView('list');
      loadBanners();
      
    } catch (error) {
      console.error('Error saving banner:', error);
      setSuccessMessage(error.message || 'Error saving banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', bannerId);

      if (error) throw error;
      
      setSuccessMessage('Banner deleted successfully!');
      loadBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      setSuccessMessage('Error deleting banner');
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newObjectUrls = files.map(file => URL.createObjectURL(file));
      setObjectUrls(prev => [...prev, ...newObjectUrls]);
      setCurrentBanner(prev => ({ 
        ...prev, 
        images: [...prev.images, ...files] 
      }));
    }
  };

  const removeUploadedImage = (index) => {
    setCurrentBanner(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    if (objectUrls[index]) {
      URL.revokeObjectURL(objectUrls[index]);
      setObjectUrls(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleImageMethodChange = (method) => {
    setCurrentBanner(prev => ({ 
      ...prev, 
      imageMethod: method,
      images: method === 'upload' ? [] : imageUrls.filter(url => url.trim() !== '')
    }));
  };

  const handleUrlChange = (index, value) => {
    const newImageUrls = [...imageUrls];
    newImageUrls[index] = value;
    setImageUrls(newImageUrls);
    
    // Update banner images with valid URLs
    const validUrls = newImageUrls.filter(url => url && url.trim() !== '');
    setCurrentBanner(prev => ({ ...prev, images: validUrls }));
  };

  const addUrlField = () => {
    setImageUrls([...imageUrls, '']);
  };

  const removeUrlField = (index) => {
    if (imageUrls.length > 1) {
      const newImageUrls = imageUrls.filter((_, i) => i !== index);
      setImageUrls(newImageUrls);
      
      // Update banner images
      const validUrls = newImageUrls.filter(url => url && url.trim() !== '');
      setCurrentBanner(prev => ({ ...prev, images: validUrls }));
    }
  };

  const clearAllUrls = () => {
    setImageUrls(['']);
    setCurrentBanner(prev => ({ ...prev, images: [] }));
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getImagePreviews = () => {
    if (currentBanner.imageMethod === 'upload') {
      return currentBanner.images.map((image, i) => 
        image instanceof File ? (objectUrls[i] || URL.createObjectURL(image)) : image
      );
    } else {
      return currentBanner.images.filter(url => validateUrl(url));
    }
  };

  const previewImages = getImagePreviews();

  // Get link display text
  const getLinkDisplay = (banner) => {
    if (!banner.link_type || banner.link_type === 'none') {
      return 'No link';
    }
    
    if (banner.link_type === 'internal') {
      const page = internalPages.find(p => p.value === banner.link_url);
      return page ? page.label : banner.link_url;
    }
    
    if (banner.link_type === 'external') {
      return banner.link_url;
    }
    
    return 'No link';
  };

  if (view === 'create' || view === 'edit') {
    return (
      <div>
        <div className="form-header">
          <button onClick={handleCancel} className="btn btn-secondary">
            <ArrowLeft size={20} />
            Back to Banners
          </button>
          <h1>{currentBanner.id ? 'Edit Banner' : 'Create New Banner'}</h1>
        </div>

        {successMessage && (
          <div className={`message-banner ${successMessage.includes('Error') ? 'error' : 'success'}`}>
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleSave} className="banner-form">
          <div className="form-group">
            <label>Banner Title *</label>
            <input
              type="text"
              value={currentBanner.title}
              onChange={(e) => setCurrentBanner(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter banner title"
              required
            />
          </div>

          <div className="form-group">
            <label>Banner Description *</label>
            <textarea
              value={currentBanner.description}
              onChange={(e) => setCurrentBanner(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter banner description"
              rows="3"
              required
            />
          </div>

          {/* ===== LINK CONFIGURATION SECTION ===== */}
          <div className="form-group banner-link-section">
            <label>Banner Link (Optional)</label>
            <p className="form-help-text">Choose where users go when they click this banner</p>
            
            <div className="link-type-selection">
              <label className="link-type-option">
                <input
                  type="radio"
                  name="linkType"
                  value="none"
                  checked={currentBanner.linkType === 'none'}
                  onChange={(e) => setCurrentBanner(prev => ({ 
                    ...prev, 
                    linkType: e.target.value,
                    linkUrl: '',
                    category: ''
                  }))}
                />
                <div className="link-type-content">
                  <X size={20} />
                  <span>No Link</span>
                  <small>Banner is not clickable</small>
                </div>
              </label>
              
              <label className="link-type-option">
                <input
                  type="radio"
                  name="linkType"
                  value="internal"
                  checked={currentBanner.linkType === 'internal'}
                  onChange={(e) => setCurrentBanner(prev => ({ 
                    ...prev, 
                    linkType: e.target.value,
                    linkUrl: ''
                  }))}
                />
                <div className="link-type-content">
                  <LinkIcon size={20} />
                  <span>Internal Page</span>
                  <small>Link to a page on your site</small>
                </div>
              </label>
              
              <label className="link-type-option">
                <input
                  type="radio"
                  name="linkType"
                  value="external"
                  checked={currentBanner.linkType === 'external'}
                  onChange={(e) => setCurrentBanner(prev => ({ 
                    ...prev, 
                    linkType: e.target.value,
                    linkUrl: '',
                    category: ''
                  }))}
                />
                <div className="link-type-content">
                  <ExternalLink size={20} />
                  <span>External URL</span>
                  <small>Link to an external website</small>
                </div>
              </label>
            </div>

            {/* Internal Page Selection */}
            {currentBanner.linkType === 'internal' && (
              <div className="link-input-section">
                <label>Select Page</label>
                <select
                  value={currentBanner.linkUrl}
                  onChange={(e) => setCurrentBanner(prev => ({ ...prev, linkUrl: e.target.value }))}
                  required
                >
                  <option value="">-- Select a page --</option>
                  {internalPages.map(page => (
                    <option key={page.value} value={page.value}>
                      {page.label}
                    </option>
                  ))}
                </select>
                <small className="form-help-text">
                  Choose which page users will be redirected to when clicking the banner
                </small>
              </div>
            )}

            {/* External URL Input */}
            {currentBanner.linkType === 'external' && (
              <div className="link-input-section">
                <label>External URL</label>
                <input
                  type="url"
                  value={currentBanner.linkUrl}
                  onChange={(e) => setCurrentBanner(prev => ({ ...prev, linkUrl: e.target.value }))}
                  placeholder="https://example.com"
                  required
                />
                <small className="form-help-text">
                  Enter the full URL including https:// (opens in new tab)
                </small>
              </div>
            )}

            {/* Link Preview */}
            {currentBanner.linkType !== 'none' && currentBanner.linkUrl && (
              <div className="link-preview">
                <strong>Link Preview:</strong>
                <span className="link-preview-url">
                  {currentBanner.linkType === 'internal' 
                    ? `Your site → ${internalPages.find(p => p.value === currentBanner.linkUrl)?.label || currentBanner.linkUrl}`
                    : `External → ${currentBanner.linkUrl}`
                  }
                </span>
              </div>
            )}
          </div>

          {/* ===== IMAGE UPLOAD SECTION ===== */}
          <div className="form-group">
            <label>Image Method</label>
            <div className="image-method-selection">
              <label className="method-option">
                <input
                  type="radio"
                  name="imageMethod"
                  value="upload"
                  checked={currentBanner.imageMethod === 'upload'}
                  onChange={() => handleImageMethodChange('upload')}
                />
                <div className="method-content">
                  <Upload size={20} />
                  <span>Upload Images</span>
                  <small>Upload multiple images from your device</small>
                </div>
              </label>
              
              <label className="method-option">
                <input
                  type="radio"
                  name="imageMethod"
                  value="url"
                  checked={currentBanner.imageMethod === 'url'}
                  onChange={() => handleImageMethodChange('url')}
                />
                <div className="method-content">
                  <LinkIcon size={20} />
                  <span>Direct URLs</span>
                  <small>Use multiple image URLs</small>
                </div>
              </label>
            </div>
          </div>

          {currentBanner.imageMethod === 'upload' && (
            <div className="form-group">
              <label>Upload Banner Images ({currentBanner.images.length} selected)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
              <small>Supported formats: JPG, PNG, WebP. Max 10 images, 5MB each</small>
              
              {currentBanner.images.length > 0 && (
                <div className="uploaded-images-list">
                  <h4>Selected Images:</h4>
                  {currentBanner.images.map((image, index) => (
                    <div key={index} className="uploaded-image-item">
                      <span>{image.name || 'Image ' + (index + 1)}</span>
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(index)}
                        className="btn btn-small btn-danger"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentBanner.imageMethod === 'url' && (
            <div className="form-group">
              <label>Image URLs ({imageUrls.filter(url => url.trim() !== '').length} images)</label>
              
              <div className="urls-section">
                {imageUrls.map((url, index) => (
                  <div key={index} className="url-input-group">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleUrlChange(index, e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="url-input"
                    />
                    {imageUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUrlField(index)}
                        className="btn btn-small btn-danger"
                        title="Remove this URL"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                
                <div className="url-actions">
                  <button
                    type="button"
                    onClick={addUrlField}
                    className="btn btn-secondary btn-small"
                  >
                    <Plus size={14} />
                    Add Another URL
                  </button>
                  
                  {imageUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={clearAllUrls}
                      className="btn btn-danger btn-small"
                    >
                      Clear All URLs
                    </button>
                  )}
                </div>
              </div>
              
              <small>Enter direct URLs to your images (Supabase storage or any image hosting service)</small>
            </div>
          )}

          {previewImages.length > 0 && (
            <div className="form-group">
              <label>Preview ({previewImages.length} images)</label>
              <div className="images-preview-grid">
                {previewImages.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img 
                      src={preview} 
                      alt={`Banner preview ${index + 1}`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        console.error('Failed to load image preview');
                      }}
                    />
                    <div className="image-number">{index + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={handleCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn" 
              disabled={saving || currentBanner.images.length === 0}
            >
              {saving ? 'Saving...' : (currentBanner.id ? 'Update Banner' : 'Create Banner')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Manage Banners</h1>
        <button onClick={handleCreateNew} className="btn">
          <Plus size={20} />
          Create New Banner
        </button>
      </div>

      {successMessage && (
        <div className={`message-banner ${successMessage.includes('Error') ? 'error' : 'success'}`}>
          {successMessage}
        </div>
      )}

      <div className="banners-list">
        {banners.length > 0 ? (
          banners.map(banner => {
            const images = banner.images || (banner.image_url ? [banner.image_url] : []);
            const linkDisplay = getLinkDisplay(banner);
            
            return (
              <div key={banner.id} className="banner-card">
                <div className="banner-preview">
                  {images.length > 0 ? (
                    <img src={images[0]} alt={banner.title} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  {images.length > 1 && (
                    <div className="images-count">+{images.length - 1} more</div>
                  )}
                  {banner.link_type && banner.link_type !== 'none' && (
                    <div className="banner-link-indicator">
                      {banner.link_type === 'external' ? (
                        <ExternalLink size={16} />
                      ) : (
                        <LinkIcon size={16} />
                      )}
                    </div>
                  )}
                </div>
                <div className="banner-details">
                  <h3>{banner.title}</h3>
                  <p>{banner.description}</p>
                  <div className="banner-meta">
                    <span>{images.length} images</span>
                    <span>Link: {linkDisplay}</span>
                    <span>Updated: {new Date(banner.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="banner-actions">
                  <button 
                    onClick={() => handleEditBanner(banner)}
                    className="btn btn-small"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="btn btn-small btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <Image size={48} />
            <h3>No Banners Created</h3>
            <p>Get started by creating your first banner.</p>
            <button onClick={handleCreateNew} className="btn">
              <Plus size={20} />
              Create First Banner
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBanner;