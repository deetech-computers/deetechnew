import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Users, Search, Trash2, Eye, Mail, Phone, Calendar, Shield, X, UserCheck, UserX, AlertCircle, Key } from 'lucide-react';

import '../styles/adminuser.css';

// User Details Modal Component
const UserDetailsModal = ({ user, onClose, onUserUpdate }) => {
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const toggleUserStatus = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          is_active: !user.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      onUserUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>User Details</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="modal-body">
          <div className="user-details-grid">
            <div className="detail-section">
              <h4>Basic Information</h4>
              <div className="detail-item">
                <span className="label">User ID:</span>
                <span className="value code">{user.id}</span>
              </div>
              <div className="detail-item">
                <span className="label">Email:</span>
                <span className="value">{user.email}</span>
              </div>
              <div className="detail-item">
                <span className="label">Email Verified:</span>
                <span className="value">
                  <span className={`status-badge ${user.email_verified ? 'green' : 'orange'}`}>
                    {user.email_verified ? 'Verified' : 'Not Verified'}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Account Created:</span>
                <span className="value">{new Date(user.created_at).toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span className="label">Last Sign In:</span>
                <span className="value">
                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Profile Information</h4>
              <div className="detail-item">
                <span className="label">First Name:</span>
                <span className="value">{user.first_name || 'Not set'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Last Name:</span>
                <span className="value">{user.last_name || 'Not set'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Phone:</span>
                <span className="value">{user.phone || 'Not set'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Account Status</h4>
              <div className="detail-item">
                <span className="label">Status:</span>
                <span className="value">
                  <span className={`status-badge ${user.is_active ? 'green' : 'red'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Role:</span>
                <span className="value">
                  <span className="status-badge blue">
                    {user.role || 'User'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-actions">
          <button 
            onClick={toggleUserStatus} 
            className={`btn ${user.is_active ? 'btn-warning' : 'btn-success'}`}
            disabled={loading}
          >
            {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
            {loading ? 'Updating...' : (user.is_active ? 'Deactivate User' : 'Activate User')}
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, user, isAdminUser, requiresServiceKey }) => {
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
          {user && (
            <div className="user-warning">
              <strong>User: {user.email}</strong>
              {user.first_name && (
                <span> ({user.first_name} {user.last_name})</span>
              )}
            </div>
          )}
          
          {requiresServiceKey && (
            <div className="admin-warning">
              <AlertCircle size={20} />
              <div>
                <strong>Admin Permission Required</strong>
                <p>This action requires service role permissions. Make sure you're using a service key with admin privileges.</p>
              </div>
            </div>
          )}

          {isAdminUser && (
            <div className="admin-warning">
              <Key size={20} />
              <div>
                <strong>Protected Admin User</strong>
                <p>This user has admin privileges and cannot be deleted through the dashboard for security reasons.</p>
              </div>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          {!isAdminUser && (
            <button onClick={onConfirm} className="btn btn-danger">
              {requiresServiceKey ? 'Delete with Service Key' : 'Confirm Delete'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main User Management Component
const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    verified: 0
  });

  // Admin email for protection
  const ADMIN_EMAIL = 'cartadaniel01@gmail.com';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setUsers(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (userList) => {
    const total = userList.length;
    const active = userList.filter(user => user.is_active).length;
    const inactive = total - active;
    const verified = userList.filter(user => user.email_verified).length;

    setStats({ total, active, inactive, verified });
  };

  const deleteUser = async (userId, userEmail) => {
    try {
      setDeleteError(null);
      
      // Check if user is admin
      if (userEmail === ADMIN_EMAIL) {
        setDeleteError('Cannot delete admin user for security reasons.');
        return;
      }

      // Method 1: Try using admin API (requires service role key)
      console.log('Attempting to delete user:', userId);
      
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        // If admin API fails, try alternative method
        console.log('Admin API failed, trying alternative method...');
        await deleteUserAlternative(userId);
        return;
      }
      
      // Success - remove from local state
      setUsers(prev => prev.filter(user => user.id !== userId));
      setShowDeleteModal(false);
      setUserToDelete(null);
      
      // Reload stats
      calculateStats(users.filter(user => user.id !== userId));
      
    } catch (error) {
      console.error('Error deleting user:', error);
      setDeleteError(error.message || 'Failed to delete user. Please check your permissions.');
    }
  };

  // Alternative method for user deletion
  const deleteUserAlternative = async (userId) => {
    try {
      // Method 2: Deactivate user instead of deleting
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Method 3: Delete from custom users table only
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        console.log('Could not delete from users table, user deactivated instead');
        // User is deactivated but still in database
      }

      // Update local state
      setUsers(prev => prev.filter(user => user.id !== userId));
      setShowDeleteModal(false);
      setUserToDelete(null);
      
    } catch (error) {
      console.error('Alternative delete method failed:', error);
      throw new Error('User deactivation failed: ' + error.message);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id, userToDelete.email);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
    setDeleteError(null);
  };

  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const closeUserDetails = () => {
    setShowUserDetails(false);
    setSelectedUser(null);
  };

  const handleUserUpdate = () => {
    loadUsers(); // Reload users after update
  };

  // Check if user is admin
  const isAdminUser = (user) => {
    return user.email === ADMIN_EMAIL || user.role === 'admin';
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchLower)) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchLower)) ||
      (user.phone && user.phone.includes(searchTerm)) ||
      user.id.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (user) => {
    if (!user.is_active) {
      return <span className="status-badge red">Inactive</span>;
    }
    if (user.email_verified) {
      return <span className="status-badge green">Verified</span>;
    }
    return <span className="status-badge orange">Unverified</span>;
  };

  if (loading) {
    return (
      <div className="admin-users-container">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="admin-users-container">
      <div className="admin-header">
        <h1>
          <Users size={24} />
          User Management
        </h1>
        <div className="user-stats">
          <div className="stat-item">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total Users</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.active}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.inactive}</span>
            <span className="stat-label">Inactive</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.verified}</span>
            <span className="stat-label">Verified</span>
          </div>
        </div>
      </div>

      {/* Permissions Notice */}
      <div className="permissions-notice">
        <AlertCircle size={18} />
        <div>
          <strong>Permissions Notice:</strong> User deletion requires service role permissions. 
          Some actions may be limited based on your current access level.
        </div>
      </div>

      <div className="admin-controls">
        <div className="search-box with-icon">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by email, name, phone, or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>Phone</th>
              <th>Created</th>
              <th>Last Sign In</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.first_name ? 
                        user.first_name.charAt(0).toUpperCase() : 
                        user.email.charAt(0).toUpperCase()
                      }
                      {isAdminUser(user) && (
                        <span className="admin-badge" title="Admin User">
                          <Key size={10} />
                        </span>
                      )}
                    </div>
                    <div className="user-details">
                      <div className="user-name">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : 'No Name Set'
                        }
                        {isAdminUser(user) && (
                          <span className="admin-tag">Admin</span>
                        )}
                      </div>
                      <div className="user-email">
                        <Mail size={14} />
                        {user.email}
                      </div>
                      <div className="user-id">
                        <Shield size={14} />
                        {user.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  {getStatusBadge(user)}
                </td>
                <td>
                  <div className="user-phone">
                    {user.phone ? (
                      <>
                        <Phone size={14} />
                        {user.phone}
                      </>
                    ) : (
                      <span className="no-data">Not set</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="date-info">
                    <Calendar size={14} />
                    {formatDate(user.created_at)}
                  </div>
                </td>
                <td>
                  <div className="date-info">
                    {user.last_sign_in_at ? (
                      <>
                        <Calendar size={14} />
                        {formatDate(user.last_sign_in_at)}
                      </>
                    ) : (
                      <span className="no-data">Never</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => viewUserDetails(user)}
                      className="btn-icon"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    
                    {!isAdminUser(user) && (
                      <button 
                        onClick={() => handleDeleteClick(user)}
                        className="btn-icon btn-danger"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* ===== MOBILE CARDS VIEW ===== */}
        <div className="mobile-cards-view">
          {filteredUsers.map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-card-header">
                <div className="user-avatar">
                  {user.first_name ? 
                    user.first_name.charAt(0).toUpperCase() : 
                    user.email.charAt(0).toUpperCase()
                  }
                  {isAdminUser(user) && (
                    <span className="admin-badge" title="Admin User">
                      <Key size={10} />
                    </span>
                  )}
                </div>
                <div className="user-details">
                  <div className="user-name">
                    {user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : 'No Name Set'
                    }
                    {isAdminUser(user) && (
                      <span className="admin-tag">Admin</span>
                    )}
                  </div>
                  <div className="user-email">
                    <Mail size={14} />
                    {user.email}
                  </div>
                </div>
              </div>
              
              <div className="user-card-details">
                <div className="user-card-row">
                  <span className="label">Status:</span>
                  <span className="value">
                    {getStatusBadge(user)}
                  </span>
                </div>
                
                <div className="user-card-row">
                  <span className="label">Phone:</span>
                  <span className="value">
                    {user.phone || 'Not set'}
                  </span>
                </div>
                
                <div className="user-card-row">
                  <span className="label">Created:</span>
                  <span className="value">
                    {formatDate(user.created_at)}
                  </span>
                </div>
                
                <div className="user-card-row">
                  <span className="label">Last Sign In:</span>
                  <span className="value">
                    {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}
                  </span>
                </div>
              </div>
              
              <div className="user-card-actions">
                <button 
                  onClick={() => viewUserDetails(user)}
                  className="btn-icon"
                  title="View Details"
                >
                  <Eye size={16} />
                </button>
                
                {!isAdminUser(user) && (
                  <button 
                    onClick={() => handleDeleteClick(user)}
                    className="btn-icon btn-danger"
                    title="Delete User"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="no-data">
            <Users size={48} />
            <p>No users found matching your search criteria</p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="btn btn-secondary"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {showUserDetails && selectedUser && (
        <UserDetailsModal 
          user={selectedUser}
          onClose={closeUserDetails}
          onUserUpdate={handleUserUpdate}
        />
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete User Account"
        message="Are you sure you want to permanently delete this user account? This action cannot be undone and will remove all user data including orders and affiliate information."
        user={userToDelete}
        isAdminUser={userToDelete && isAdminUser(userToDelete)}
        requiresServiceKey={true}
      />

      {deleteError && (
        <div className="error-message">
          <AlertCircle size={18} />
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="close-error">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;