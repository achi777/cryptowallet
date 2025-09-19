import React, { useState } from 'react';
import { Admin, ChangePassword, AdminRegistration, AdminRole } from '../../types';
import { adminAuthApi } from '../../services/adminApi';

interface AdminSettingsProps {
  currentAdmin: Admin;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ currentAdmin }) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'password' | 'admins'>('profile');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Profile update state
  const [profileData, setProfileData] = useState<Partial<Admin>>({
    firstName: currentAdmin.firstName,
    lastName: currentAdmin.lastName,
    email: currentAdmin.email,
  });

  // Password change state
  const [passwordData, setPasswordData] = useState<ChangePassword>({
    currentPassword: '',
    newPassword: '',
  });

  // New admin creation state
  const [newAdminData, setNewAdminData] = useState<AdminRegistration>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: AdminRole.ADMIN,
  });

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminAuthApi.update(currentAdmin.id, profileData);
      showMessage('success', 'Profile updated successfully');
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminAuthApi.changePassword(currentAdmin.id, passwordData);
      setPasswordData({ currentPassword: '', newPassword: '' });
      showMessage('success', 'Password changed successfully');
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminAuthApi.register(newAdminData);
      setNewAdminData({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: AdminRole.ADMIN,
      });
      showMessage('success', 'New admin created successfully');
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  const renderSectionButton = (section: typeof activeSection, label: string, icon: string) => (
    <button
      onClick={() => setActiveSection(section)}
      className={`btn ${activeSection === section ? 'btn-primary' : 'btn-secondary'} btn-small w-full text-left`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">⚙️ Admin Settings</h2>
        <div className="text-sm text-muted">
          Logged in as: {currentAdmin.username} ({currentAdmin.role})
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type} mb-4`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            <div className="space-y-2">
              {renderSectionButton('profile', 'Profile Settings', '👤')}
              {renderSectionButton('password', 'Change Password', '🔒')}
              {(currentAdmin.role === AdminRole.SUPER_ADMIN) && 
                renderSectionButton('admins', 'Manage Admins', '👥')
              }
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeSection === 'profile' && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">👤 Profile Settings</h3>
              <form onSubmit={handleProfileUpdate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      value={profileData.firstName || ''}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      value={profileData.lastName || ''}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={profileData.email || ''}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={currentAdmin.username}
                    className="form-input"
                    disabled
                  />
                  <small className="text-muted">Username cannot be changed</small>
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value={currentAdmin.role.replace('_', ' ')}
                    className="form-input"
                    disabled
                  />
                  <small className="text-muted">Role can only be changed by Super Admin</small>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '🔄 Updating...' : '💾 Update Profile'}
                </button>
              </form>
            </div>
          )}

          {activeSection === 'password' && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">🔒 Change Password</h3>
              <form onSubmit={handlePasswordChange}>
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="form-input"
                    minLength={8}
                    required
                  />
                  <small className="text-muted">Password must be at least 8 characters long</small>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '🔄 Changing...' : '🔒 Change Password'}
                </button>
              </form>
            </div>
          )}

          {activeSection === 'admins' && currentAdmin.role === AdminRole.SUPER_ADMIN && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">👥 Create New Admin</h3>
              <form onSubmit={handleCreateAdmin}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="adminUsername">Username</label>
                    <input
                      type="text"
                      id="adminUsername"
                      value={newAdminData.username}
                      onChange={(e) => setNewAdminData({...newAdminData, username: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="adminEmail">Email</label>
                    <input
                      type="email"
                      id="adminEmail"
                      value={newAdminData.email}
                      onChange={(e) => setNewAdminData({...newAdminData, email: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="adminFirstName">First Name</label>
                    <input
                      type="text"
                      id="adminFirstName"
                      value={newAdminData.firstName}
                      onChange={(e) => setNewAdminData({...newAdminData, firstName: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="adminLastName">Last Name</label>
                    <input
                      type="text"
                      id="adminLastName"
                      value={newAdminData.lastName}
                      onChange={(e) => setNewAdminData({...newAdminData, lastName: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="adminPassword">Password</label>
                    <input
                      type="password"
                      id="adminPassword"
                      value={newAdminData.password}
                      onChange={(e) => setNewAdminData({...newAdminData, password: e.target.value})}
                      className="form-input"
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="adminRole">Role</label>
                    <select
                      id="adminRole"
                      value={newAdminData.role}
                      onChange={(e) => setNewAdminData({...newAdminData, role: e.target.value as AdminRole})}
                      className="form-input"
                      required
                    >
                      <option value={AdminRole.ADMIN}>Admin</option>
                      <option value={AdminRole.MODERATOR}>Moderator</option>
                      <option value={AdminRole.SUPPORT}>Support</option>
                      <option value={AdminRole.SUPER_ADMIN}>Super Admin</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '🔄 Creating...' : '👥 Create Admin'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Account Information */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold mb-4">📋 Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-muted">Account ID</div>
            <div className="font-mono">{currentAdmin.id}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Username</div>
            <div className="font-medium">{currentAdmin.username}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Role</div>
            <div className="font-medium">{currentAdmin.role.replace('_', ' ')}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Status</div>
            <div className={`font-medium ${currentAdmin.active ? 'text-green-600' : 'text-red-600'}`}>
              {currentAdmin.active ? '✅ Active' : '❌ Inactive'}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted">Created</div>
            <div className="text-sm">{new Date(currentAdmin.createdAt).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Last Updated</div>
            <div className="text-sm">{new Date(currentAdmin.updatedAt).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Last Login</div>
            <div className="text-sm">
              {currentAdmin.lastLogin ? 
                new Date(currentAdmin.lastLogin).toLocaleDateString() : 
                'Never'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;