// pages/ComparisonPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useComparison } from '../contexts/ComparisonContext';
import { supabasePublic as supabase } from '../config/supabase';
import { 
  ArrowLeft, X, Check, Star, TrendingUp, 
  Cpu, HardDrive, Monitor, Battery, 
  DollarSign, Truck, Shield, RotateCcw,
  BarChart2, Download, Share2, Printer,
  Smartphone, Laptop, Headphones, Camera,
  Wifi, Bluetooth, Zap, Settings,
  Plus, ShoppingCart
} from 'lucide-react';
import '../App.css';
import '../styles/comparison.css';

// Feature icons mapping
const featureIcons = {
  performance: <Cpu size={18} />,
  storage: <HardDrive size={18} />,
  display: <Monitor size={18} />,
  battery: <Battery size={18} />,
  price: <DollarSign size={18} />,
  shipping: <Truck size={18} />,
  warranty: <Shield size={18} />,
  returns: <RotateCcw size={18} />,
  connectivity: <Wifi size={18} />,
  bluetooth: <Bluetooth size={18} />,
  speed: <Zap size={18} />,
  camera: <Camera size={18} />,
  audio: <Headphones size={18} />,
  software: <Settings size={18} />
};

// Category-specific features mapping
const categoryFeatures = {
  laptops: [
    { key: 'processor', label: 'Processor', icon: 'performance' },
    { key: 'ram', label: 'RAM', icon: 'performance' },
    { key: 'storage', label: 'Storage', icon: 'storage' },
    { key: 'display', label: 'Display', icon: 'display' },
    { key: 'graphics', label: 'Graphics', icon: 'performance' },
    { key: 'battery', label: 'Battery Life', icon: 'battery' },
    { key: 'weight', label: 'Weight', icon: 'performance' },
    { key: 'os', label: 'Operating System', icon: 'software' }
  ],
  phones: [
    { key: 'display', label: 'Display', icon: 'display' },
    { key: 'camera', label: 'Camera', icon: 'camera' },
    { key: 'processor', label: 'Processor', icon: 'performance' },
    { key: 'ram', label: 'RAM', icon: 'performance' },
    { key: 'storage', label: 'Storage', icon: 'storage' },
    { key: 'battery', label: 'Battery', icon: 'battery' },
    { key: 'os', label: 'Operating System', icon: 'software' },
    { key: 'connectivity', label: 'Connectivity', icon: 'connectivity' }
  ],
  monitors: [
    { key: 'size', label: 'Screen Size', icon: 'display' },
    { key: 'resolution', label: 'Resolution', icon: 'display' },
    { key: 'refreshRate', label: 'Refresh Rate', icon: 'performance' },
    { key: 'panel', label: 'Panel Type', icon: 'display' },
    { key: 'responseTime', label: 'Response Time', icon: 'performance' },
    { key: 'ports', label: 'Ports', icon: 'connectivity' },
    { key: 'features', label: 'Features', icon: 'settings' }
  ],
  accessories: [
    { key: 'type', label: 'Type', icon: 'settings' },
    { key: 'compatibility', label: 'Compatibility', icon: 'connectivity' },
    { key: 'connectivity', label: 'Connectivity', icon: 'connectivity' },
    { key: 'features', label: 'Features', icon: 'settings' },
    { key: 'warranty', label: 'Warranty', icon: 'warranty' }
  ],
  default: [
    { key: 'specifications', label: 'Key Specs', icon: 'performance' },
    { key: 'features', label: 'Features', icon: 'settings' },
    { key: 'warranty', label: 'Warranty', icon: 'warranty' },
    { key: 'returns', label: 'Returns Policy', icon: 'returns' }
  ]
};

const ComparisonPage = () => {
  const navigate = useNavigate();
  const { 
    comparisonProducts, 
    removeFromComparison, 
    clearComparison,
    getComparisonCount 
  } = useComparison();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load product details for comparison
  useEffect(() => {
    const loadProductDetails = async () => {
      if (comparisonProducts.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const productIds = comparisonProducts.map(p => p.id);
        
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);

        if (error) throw error;

        // Preserve the order from comparisonProducts
        const orderedProducts = comparisonProducts.map(compProd => 
          data.find(p => p.id === compProd.id)
        ).filter(Boolean);

        setProducts(orderedProducts);
        
        // Determine common category if all products share same category
        if (orderedProducts.length > 0) {
          const firstCategory = orderedProducts[0].category;
          const allSameCategory = orderedProducts.every(p => p.category === firstCategory);
          setActiveCategory(allSameCategory ? firstCategory : 'default');
        }
      } catch (error) {
        console.error('Error loading comparison products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProductDetails();
  }, [comparisonProducts]);

  // Extract specifications from product
  const extractSpecifications = (product) => {
    const specs = {};
    
    if (product.specifications) {
      // Parse comma-separated specifications
      product.specifications.split(',').forEach(spec => {
        const [key, ...valueParts] = spec.split(':').map(s => s.trim());
        if (key && valueParts.length > 0) {
          specs[key.toLowerCase()] = valueParts.join(':');
        }
      });
    }
    
    // Extract common specs from description
    const desc = (product.description || '').toLowerCase();
    
    // RAM detection
    const ramMatch = desc.match(/(\d+)\s*(gb|mb)\s*ram/i) || 
                     product.name.match(/(\d+)\s*(gb|mb)\s*ram/i);
    if (ramMatch && !specs.ram) {
      specs.ram = `${ramMatch[1]} ${ramMatch[2].toUpperCase()} RAM`;
    }
    
    // Storage detection
    const storageMatch = desc.match(/(\d+)\s*(tb|gb|mb)\s*(ssd|hdd|storage)/i) ||
                        product.name.match(/(\d+)\s*(tb|gb|mb)\s*(ssd|hdd|storage)/i);
    if (storageMatch && !specs.storage) {
      specs.storage = `${storageMatch[1]} ${storageMatch[2].toUpperCase()} ${storageMatch[3]?.toUpperCase() || 'Storage'}`;
    }
    
    // Processor detection
    const processorMatch = desc.match(/(intel|amd|qualcomm|apple)\s+(\w+\s*\w*)/i) ||
                          product.name.match(/(intel|amd|qualcomm|apple)\s+(\w+\s*\w*)/i);
    if (processorMatch && !specs.processor) {
      specs.processor = `${processorMatch[1]} ${processorMatch[2]}`;
    }
    
    return specs;
  };

  // Get features for current category
  const getFeatures = useMemo(() => {
    return categoryFeatures[activeCategory] || categoryFeatures.default;
  }, [activeCategory]);

  // Get feature value for a product
  const getFeatureValue = (product, featureKey) => {
    const specs = extractSpecifications(product);
    
    switch (featureKey) {
      case 'price':
        return `GH₵ ${parseFloat(product.price).toLocaleString()}`;
      case 'category':
        return product.category.charAt(0).toUpperCase() + product.category.slice(1);
      case 'stock':
        return product.stock_quantity > 0 
          ? `In Stock (${product.stock_quantity})` 
          : 'Out of Stock';
      case 'rating':
        return product.rating ? `${product.rating}/5 ⭐` : 'Not Rated';
      default:
        return specs[featureKey] || product[featureKey] || 'N/A';
    }
  };

  // Calculate best value (price to features ratio)
  const bestValueProduct = useMemo(() => {
    if (products.length < 2) return null;
    
    // Simple scoring based on price and specifications count
    const scoredProducts = products.map(product => {
      const specs = extractSpecifications(product);
      const specCount = Object.keys(specs).length;
      const price = parseFloat(product.price);
      
      // Higher score = better value (more specs for lower price)
      const score = specCount / (price / 1000);
      return { product, score };
    });
    
    return scoredProducts.sort((a, b) => b.score - a.score)[0]?.product.id;
  }, [products]);

  // Export comparison as CSV
  const exportComparison = () => {
    if (products.length === 0) return;
    
    setExporting(true);
    
    try {
      const headers = ['Feature', ...products.map(p => p.name)];
      const rows = [];
      
      // Add basic info
      rows.push(['Product', ...products.map(p => p.name)]);
      rows.push(['Category', ...products.map(p => 
        p.category.charAt(0).toUpperCase() + p.category.slice(1)
      )]);
      rows.push(['Price', ...products.map(p => 
        `GH₵ ${parseFloat(p.price).toLocaleString()}`
      )]);
      rows.push(['Stock', ...products.map(p => 
        p.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'
      )]);
      
      // Add specifications
      getFeatures.forEach(feature => {
        rows.push([
          feature.label,
          ...products.map(p => getFeatureValue(p, feature.key))
        ]);
      });
      
      // Convert to CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => 
          `"${String(cell).replace(/"/g, '""')}"`
        ).join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `deetech-comparison-${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setTimeout(() => setExporting(false), 1000);
    }
  };

  // Share comparison
  const shareComparison = async () => {
    if (products.length === 0) return;
    
    const productNames = products.map(p => p.name).join(' vs ');
    const text = `Comparing ${productNames} on DEETECH COMPUTERS\n\n` +
                 `Check out this comparison and make an informed decision!\n\n` +
                 `${window.location.href}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Product Comparison - DEETECH COMPUTERS',
          text: text,
          url: window.location.href,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          await navigator.clipboard.writeText(text);
          alert('Comparison link copied to clipboard!');
        }
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Comparison link copied to clipboard!');
    }
  };

  // Handle empty comparison
  if (loading) {
    return (
      <div className="container">
        <div className="comparison-loading-state">
          <div className="comparison-loading-spinner"></div>
          <p>Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (comparisonProducts.length === 0) {
    return (
      <div className="container">
        <div className="comparison-empty">
          <div className="comparison-empty-icon">
            <BarChart2 size={64} />
          </div>
          <h2>No Products to Compare</h2>
          <p>Add products to comparison from the products page to start comparing features and specifications.</p>
          <div className="comparison-empty-actions">
            <Link to="/products" className="btn btn-primary">
              Browse Products
            </Link>
            <button onClick={() => navigate(-1)} className="btn btn-secondary">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container comparison-container">
      {/* Header */}
      <div className="comparison-header">
        <button onClick={() => navigate(-1)} className="comparison-back-btn">
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        
        <div className="comparison-header-content">
          <h1>Product Comparison</h1>
          <p>Compare features and specifications side by side</p>
        </div>
        
        <div className="comparison-header-actions">
          <button 
            onClick={shareComparison}
            className="btn btn-outline"
            title="Share comparison"
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>
          
          <button 
            onClick={exportComparison}
            className="btn btn-outline"
            disabled={exporting}
            title="Export as CSV"
          >
            <Download size={16} />
            <span>{exporting ? 'Exporting...' : 'Export'}</span>
          </button>
          
          <button 
            onClick={clearComparison}
            className="btn btn-danger"
            title="Clear all products"
          >
            <X size={16} />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Comparison Controls */}
      <div className="comparison-controls">
        <div className="comparison-stats">
          <span className="comparison-stat-item">
            <strong>{products.length}</strong> products
          </span>
          <span className="comparison-stat-item">
            <strong>{getFeatures.length}</strong> features
          </span>
          <span className="comparison-stat-item">
            <strong>{activeCategory !== 'default' ? activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1) : 'Mixed'}</strong> category
          </span>
        </div>
        
        <div className="comparison-actions">
          <button 
            onClick={() => setShowAllFeatures(!showAllFeatures)}
            className="btn btn-outline"
          >
            {showAllFeatures ? 'Show Key Features' : 'Show All Features'}
          </button>
          
          {bestValueProduct && (
            <div className="comparison-best-value-badge">
              <TrendingUp size={16} />
              <span>Best Value: Product #{products.findIndex(p => p.id === bestValueProduct) + 1}</span>
            </div>
          )}
        </div>
      </div>

      {/* Products Header */}
      <div className="comparison-products-header-row">
        <div className="comparison-feature-column">
          <h3>Features</h3>
        </div>
        
        {products.map((product, index) => (
          <div key={product.id} className="comparison-product-column">
            <div className="comparison-product-header-card">
              <button
                onClick={() => removeFromComparison(product.id)}
                className="comparison-remove-btn"
                title="Remove from comparison"
              >
                <X size={16} />
              </button>
              
              <div className="comparison-product-image-container">
                <img 
                  src={product.image_url || '/api/placeholder/200/150'} 
                  alt={product.name}
                  className="comparison-product-image"
                  loading="lazy"
                />
                {product.featured && (
                  <span className="comparison-featured-badge">Featured</span>
                )}
              </div>
              
              <h4 className="comparison-product-title">{product.name}</h4>
              
              <div className="comparison-product-price">
                GH₵ {parseFloat(product.price).toLocaleString()}
              </div>
              
              <div className={`comparison-product-stock ${product.stock_quantity > 0 ? 'comparison-in-stock' : 'comparison-out-stock'}`}>
                {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
              </div>
              
              <div className="comparison-product-actions">
                <Link 
                  to={`/product/${product.id}`}
                  className="btn btn-small btn-primary"
                >
                  View Details
                </Link>
                <button
                  onClick={() => {
                    removeFromComparison(product.id);
                    navigate(`/product/${product.id}`);
                  }}
                  className="btn btn-small btn-outline"
                >
                  Remove
                </button>
              </div>
              
              {product.id === bestValueProduct && (
                <div className="comparison-best-value-indicator">
                  <TrendingUp size={14} />
                  <span>Best Value</span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Empty slots for remaining comparison capacity */}
        {Array.from({ length: 4 - products.length }).map((_, index) => (
          <div key={`empty-${index}`} className="comparison-product-column comparison-empty-column">
            <div className="comparison-empty-slot">
              <div className="comparison-empty-slot-icon">
                {index === 0 ? (
                  <Plus size={32} />
                ) : (
                  <div className="comparison-slot-number">{products.length + index + 1}</div>
                )}
              </div>
              <p>Add Product {products.length + index + 1}</p>
              <Link to="/products" className="btn btn-small btn-outline">
                Browse Products
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Features Comparison */}
      <div className="comparison-features">
        {getFeatures
          .filter(feature => showAllFeatures || ['processor', 'ram', 'storage', 'price', 'display'].includes(feature.key))
          .map((feature, featureIndex) => (
            <div key={feature.key} className="comparison-feature-row">
              <div className="comparison-feature-column">
                <div className="comparison-feature-header">
                  <span className="comparison-feature-icon">
                    {featureIcons[feature.icon] || <Settings size={18} />}
                  </span>
                  <span className="comparison-feature-label">{feature.label}</span>
                </div>
              </div>
              
              {products.map((product, productIndex) => {
                const value = getFeatureValue(product, feature.key);
                const isBest = feature.key === 'price' 
                  ? parseFloat(product.price) === Math.min(...products.map(p => parseFloat(p.price)))
                  : false;
                
                return (
                  <div 
                    key={`${product.id}-${feature.key}`} 
                    className={`comparison-product-column ${isBest ? 'comparison-best-value-cell' : ''}`}
                  >
                    <div className="comparison-feature-value">
                      {value}
                      {isBest && feature.key === 'price' && (
                        <span className="comparison-best-price-badge">Lowest Price</span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Empty cells for remaining slots */}
              {Array.from({ length: 4 - products.length }).map((_, index) => (
                <div key={`empty-cell-${featureIndex}-${index}`} className="comparison-product-column comparison-empty-cell">
                  —
                </div>
              ))}
            </div>
          ))}
      </div>

      {/* Summary & Recommendations */}
      {products.length >= 2 && (
        <div className="comparison-summary">
          <h3>Comparison Summary</h3>
          <div className="comparison-summary-grid">
            <div className="comparison-summary-card">
              <div className="comparison-summary-icon comparison-price-icon">
                <DollarSign size={24} />
              </div>
              <h4>Price Analysis</h4>
              <p>
                Price range: GH₵ {Math.min(...products.map(p => parseFloat(p.price))).toLocaleString()} 
                - GH₵ {Math.max(...products.map(p => parseFloat(p.price))).toLocaleString()}
              </p>
              <p className="comparison-summary-highlight">
                Most affordable: Product #{products.findIndex(p => 
                  parseFloat(p.price) === Math.min(...products.map(p => parseFloat(p.price)))
                ) + 1}
              </p>
            </div>
            
            <div className="comparison-summary-card">
              <div className="comparison-summary-icon comparison-specs-icon">
                <Cpu size={24} />
              </div>
              <h4>Specifications</h4>
              <p>
                Average specifications count: {
                  Math.round(products.reduce((acc, p) => 
                    acc + Object.keys(extractSpecifications(p)).length, 0) / products.length
                  )
                } key specs per product
              </p>
              <p className="comparison-summary-highlight">
                Most featured: Product #{products.findIndex(p => 
                  Object.keys(extractSpecifications(p)).length === 
                  Math.max(...products.map(p => Object.keys(extractSpecifications(p)).length))
                ) + 1}
              </p>
            </div>
            
            <div className="comparison-summary-card">
              <div className="comparison-summary-icon comparison-stock-icon">
                <Check size={24} />
              </div>
              <h4>Availability</h4>
              <p>
                {products.filter(p => p.stock_quantity > 0).length} of {products.length} 
                products are in stock
              </p>
              <p className="comparison-summary-highlight">
                {products.filter(p => p.stock_quantity > 0).length === products.length 
                  ? 'All products available' 
                  : 'Some products may be out of stock'}
              </p>
            </div>
            
            <div className="comparison-summary-card">
              <div className="comparison-summary-icon comparison-recommendation-icon">
                <Star size={24} />
              </div>
              <h4>Our Recommendation</h4>
              {bestValueProduct && (
                <>
                  <p>
                    Based on price-to-features ratio, we recommend{' '}
                    <strong>Product #{products.findIndex(p => p.id === bestValueProduct) + 1}</strong>
                  </p>
                  <p className="comparison-summary-highlight">
                    Best overall value for money
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="comparison-quick-actions">
        <div className="comparison-quick-actions-content">
          <div className="comparison-quick-actions-text">
            <h4>Ready to make a decision?</h4>
            <p>Add selected products to cart or continue comparing</p>
          </div>
          
          <div className="comparison-quick-actions-buttons">
            <Link to="/products" className="btn btn-outline">
              <Laptop size={16} />
              <span>Add More Products</span>
            </Link>
            
            <button 
              onClick={() => {
                // Add all comparison products to cart
                products.forEach(product => {
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
                });
                
                window.dispatchEvent(new CustomEvent('cartUpdated'));
                navigate('/cart');
              }}
              className="btn btn-primary"
            >
              <ShoppingCart size={16} />
              <span>Add All to Cart</span>
            </button>
            
            <button 
              onClick={clearComparison}
              className="btn btn-danger"
            >
              <X size={16} />
              <span>Clear Comparison</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonPage;
