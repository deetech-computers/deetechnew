// AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { 
  Package, ShoppingCart, DollarSign, Truck, X, Users, Image, TrendingUp 
} from 'lucide-react';
import '../styles/AdminDashboard.css';


const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalAffiliates: 0,
    activeAffiliates: 0,
    cancelledOrders: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Use Promise.allSettled instead of Promise.all
      const [productsResult, ordersResult, affiliatesResult] = await Promise.allSettled([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*'),
        supabase.from('affiliates').select('*')
      ]);

      const productCount = productsResult.status === 'fulfilled' ? (productsResult.value.count || 0) : 0;
      const orders = ordersResult.status === 'fulfilled' ? (ordersResult.value.data || []) : [];
      const affiliates = affiliatesResult.status === 'fulfilled' ? (affiliatesResult.value.data || []) : [];

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
      const pendingOrders = orders.filter(order => order.status === 'pending').length;
      const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
      const totalAffiliates = affiliates.length;
      const activeAffiliates = affiliates.filter(a => a.is_active).length;

      // Estimate user count
      let totalUsers = 0;
      try {
        if (orders.length > 0) {
          const uniqueEmails = new Set(orders.map(order => order.customer_email));
          totalUsers = uniqueEmails.size;
        }
        if (affiliates.length > 0) {
          totalUsers = Math.max(totalUsers, affiliates.length);
        }
      } catch (userError) {
        console.error('Error calculating user count:', userError);
        totalUsers = Math.floor(orders.length * 1.5);
      }

      setStats({
        totalProducts: productCount,
        totalOrders,
        totalRevenue,
        pendingOrders,
        cancelledOrders,
        totalAffiliates,
        activeAffiliates,
        totalUsers
      });

    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-admin">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Products</h3>
            <span className="stat-number">{stats.totalProducts}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Orders</h3>
            <span className="stat-number">{stats.totalOrders}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Revenue</h3>
            <span className="stat-number">GH₵ {stats.totalRevenue.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Truck size={24} />
          </div>
          <div className="stat-info">
            <h3>Pending Orders</h3>
            <span className="stat-number">{stats.pendingOrders}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <X size={24} />
          </div>
          <div className="stat-info">
            <h3>Cancelled Orders</h3>
            <span className="stat-number">{stats.cancelledOrders}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Affiliates</h3>
            <span className="stat-number">{stats.totalAffiliates}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Customers</h3>
            <span className="stat-number">{stats.totalUsers}</span>
          </div>
        </div>
      </div>

      <div className="admin-actions">
        <Link to="/admin/products" className="admin-action-card">
          <Package size={32} />
          <h3>Manage Products</h3>
          <p>Add, edit, or remove products</p>
        </Link>
        
        <Link to="/admin/orders" className="admin-action-card">
          <ShoppingCart size={32} />
          <h3>Manage Orders</h3>
          <p>Process and track orders</p>
        </Link>
        
        <Link to="/admin/affiliates" className="admin-action-card">
          <Users size={32} />
          <h3>Manage Affiliates</h3>
          <p>Track commissions and referrals</p>
        </Link>
        
        <Link to="/admin/users" className="admin-action-card">
          <Users size={32} />
          <h3>View Customers</h3>
          <p>View customer information</p>
        </Link>
        
        <Link to="/admin/banner" className="admin-action-card">
          <Image size={32} />
          <h3>Manage Banner</h3>
          <p>Update homepage banner</p>
        </Link>

        <Link to="/admin/stock" className="admin-action-card">
          <TrendingUp size={32} />
          <h3>Stock Management</h3>
          <p>Manage inventory and stock levels</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;