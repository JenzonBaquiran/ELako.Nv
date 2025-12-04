import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MsmeSidebar from './MsmeSidebar';
import Notification from '../components/Notification';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import { validation } from '../utils/validation';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import '../css/MsmeProfile.css';
import profileImg from '../assets/pic.jpg';

const MsmeProfile = () => {
  // Helper function to generate proper URLs for images
  const getImageUrl = (imageValue) => {
    if (!imageValue) return null;
    
    // If it's already a full URL (Cloudinary or other), use it directly
    if (imageValue.startsWith('http')) {
      return imageValue;
    }
    
    // If it contains folder structure like 'elako/blog/...', it's a Cloudinary public ID
    if (imageValue.includes('/') && !imageValue.startsWith('uploads/')) {
      return `https://res.cloudinary.com/dk9umulxw/image/upload/${imageValue}`;
    }
    
    // Otherwise, it's a legacy local file
    return `http://localhost:1337/uploads/${imageValue}`;
  };

  const [sidebarState, setSidebarState] = useState({ isOpen: true, isMobile: false });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'info',
    title: '',
    message: '',
    showConfirmButtons: false,
    onConfirm: () => {},
    onCancel: () => {}
  });
  const [profileData, setProfileData] = useState({
    id: '',
    businessName: '',
    email: '',
    contactNumber: '',
    address: '',
    businessDescription: '',
    category: '',
    website: '',
    storeLogo: null,
    termsAcceptedAt: null
  });
  const [stats, setStats] = useState({
    profileViews: 0,
    followers: 0,
    rating: 0,
    profileComplete: 0
  });
  const { user, userType } = useAuth();

  const handleSidebarToggle = (stateOrIsOpen, isMobile = false) => {
    // Handle both object parameter (from MsmeSidebar) and separate parameters
    if (typeof stateOrIsOpen === 'object') {
      setSidebarState({ 
        isOpen: stateOrIsOpen.isOpen, 
        isMobile: stateOrIsOpen.isMobile 
      });
    } else {
      setSidebarState({ isOpen: stateOrIsOpen, isMobile });
    }
  };

  // Fetch MSME profile data
  useEffect(() => {
    if (user && userType === 'msme') {
      fetchMsmeProfile();
    }
  }, [user, userType]);

  const fetchMsmeProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:1337/api/msme/${user.id}/profile`);
      const data = await response.json();
      
      if (data.success) {
        setProfileData(data.profile);
        setStats(data.stats);
      } else {
        console.error('Failed to fetch MSME profile:', data.error);
      }
    } catch (error) {
      console.error('Error fetching MSME profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update personal information
      const personalResponse = await fetch(`http://localhost:1337/api/msme/${user.id}/profile/personal`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: profileData.businessName,
          email: profileData.email,
          contactNumber: profileData.contactNumber,
          address: profileData.address,
          businessDescription: profileData.businessDescription
        })
      });

      const personalData = await personalResponse.json();

      // Update business information (only category and website)
      const businessResponse = await fetch(`http://localhost:1337/api/msme/${user.id}/profile/business`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: profileData.category,
          website: profileData.website
        })
      });

      const businessData = await businessResponse.json();

      if (personalData.success && businessData.success) {
        setProfileData(prev => ({ 
          ...prev, 
          ...personalData.profile,
          ...businessData.profile
        }));
        
        // Update localStorage with the new business name to keep UI in sync
        if (personalData.profile.businessName) {
          const msmeUserData = localStorage.getItem('msmeUser');
          if (msmeUserData) {
            const parsedData = JSON.parse(msmeUserData);
            parsedData.businessName = personalData.profile.businessName;
            localStorage.setItem('msmeUser', JSON.stringify(parsedData));
          }
        }
        
        setIsEditing(false);
        showNotification('success', 'Success', 'Business information updated successfully!');
      } else {
        const error = personalData.error || businessData.error || 'Failed to update information';
        console.error('Failed to update information:', error);
        showNotification('error', 'Error', error);
      }
    } catch (error) {
      console.error('Error updating information:', error);
      showNotification('error', 'Network Error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Invalid File Type', 'Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'File Too Large', 'File size must be less than 5MB');
      return;
    }

    try {
      setUploadingLogo(true);

      const formData = new FormData();
      formData.append('storeLogo', file);

      const response = await fetch(`http://localhost:1337/api/msme/${user.id}/profile/storeLogo`, {
        method: 'PUT',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setProfileData(prev => ({
          ...prev,
          storeLogo: data.storeLogo
        }));
        console.log('Store logo updated successfully');
        showNotification('success', 'Success', 'Store logo updated successfully!');
      } else {
        console.error('Failed to update store logo:', data.error);
        showNotification('error', 'Upload Failed', data.error || 'Failed to update store logo');
      }
    } catch (error) {
      console.error('Error uploading store logo:', error);
      showNotification('error', 'Network Error', 'Network error. Please try again.');
    } finally {
      setUploadingLogo(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  const showNotification = (type, title, message, showConfirmButtons = false, onConfirm = () => {}, onCancel = () => {}) => {
    setNotification({
      isVisible: true,
      type,
      title,
      message,
      showConfirmButtons,
      onConfirm,
      onCancel
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const handlePasswordInputChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showNotification('error', 'Validation Error', 'Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('error', 'Validation Error', 'New password and confirm password do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showNotification('error', 'Validation Error', 'New password must be at least 6 characters long');
      return;
    }

    // Check password strength
    const strengthResult = validation.passwordStrength(passwordData.newPassword);
    if (strengthResult.strength !== 'strong') {
      showNotification('error', 'Weak Password', 'Password is too weak. Please use a stronger password with uppercase letters, lowercase letters, numbers, and special characters.');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      showNotification('error', 'Validation Error', 'New password must be different from current password');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`http://localhost:1337/api/msme/${user.id}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        showNotification('success', 'Success', 'Password changed successfully!');
        setShowChangePasswordModal(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showNotification('error', 'Error', data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showNotification('error', 'Error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    showNotification(
      'confirm',
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your data, products, and business information will be permanently deleted.',
      true,
      confirmDeleteAccount,
      () => {}
    );
  };

  const confirmDeleteAccount = async () => {

    try {
      setSaving(true);

      const response = await fetch(`http://localhost:1337/api/msme/${user.id}/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        showNotification('success', 'Success', 'Account deleted successfully. You will be redirected to the home page.');
        // Redirect to home page
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        showNotification('error', 'Error', data.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showNotification('error', 'Error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getContentClass = () => {
    if (sidebarState.isMobile) {
      return 'msme-profile__content msme-profile__content--mobile';
    }
    return sidebarState.isOpen 
      ? 'msme-profile__content msme-profile__content--sidebar-open' 
      : 'msme-profile__content msme-profile__content--sidebar-collapsed';
  };

  if (loading) {
    return (
      <div className="msme-profile">
        <MsmeSidebar onSidebarToggle={handleSidebarToggle} />
        <div className={getContentClass()}>
          <div className="loading">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="msme-profile">
      <MsmeSidebar onSidebarToggle={handleSidebarToggle} />
      <div className={getContentClass()}>
        <div className="msme-profile__header">
          <div className="msme-profile__header-content">
            <div className="msme-profile__header-text">
              <h1>Profile Settings</h1>
              <p>Manage your business profile and account settings.</p>
            </div>
          </div>
        </div>

        <div className="msme-profile__stats">
          <div className="msme-profile__stat-box">
            <div className="msme-profile__stat-value">{stats.profileViews.toLocaleString()}</div>
            <div className="msme-profile__stat-label">Profile Views</div>
          </div>
          <div className="msme-profile__stat-box">
            <div className="msme-profile__stat-value">{stats.followers}</div>
            <div className="msme-profile__stat-label">Followers</div>
          </div>
          <div className="msme-profile__stat-box">
            <div className="msme-profile__stat-value">
              {profileData.termsAcceptedAt 
                ? new Date(profileData.termsAcceptedAt).toLocaleDateString()
                : 'Not available'
              }
            </div>
            <div className="msme-profile__stat-label">Terms Accepted</div>
          </div>
        </div>

        <div className="msme-profile__content-single">
          <div className="msme-profile__card msme-profile__business-info">
            <div className="msme-profile__card-header">
              <h3>Business Information</h3>
              <button 
                className="msme-profile__edit-btn"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            <div className="msme-profile__info-content">
              <div className="msme-profile__avatar-section">
                <div className="msme-profile__avatar">
                  <img 
                    src={profileData.storeLogo ? 
                      getImageUrl(profileData.storeLogo) : profileImg
                    } 
                    alt="Store Logo" 
                    onError={(e) => {
                      e.target.src = profileImg;
                    }}
                  />
                </div>
                <input
                  type="file"
                  id="storeLogo"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
                <button 
                  className="msme-profile__upload-btn"
                  onClick={() => document.getElementById('storeLogo').click()}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? 'Uploading...' : 'Upload Photo'}
                </button>
              </div>
              <div className="msme-profile__info-fields">
                <div className="msme-profile__field-row">
                  <div className="msme-profile__field">
                    <label>Business Name</label>
                    <span>{profileData.businessName || 'Not provided'}</span>
                  </div>
                  <div className="msme-profile__field">
                    <label>Business Category</label>
                    <span>{profileData.category === 'food' ? 'Food & Beverage' : profileData.category === 'artisan' ? 'Artisan' : 'Not provided'}</span>
                  </div>
                </div>

                <div className="msme-profile__field-row">
                  <div className="msme-profile__field">
                    <label>Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profileData.contactNumber}
                        onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                        className="msme-profile__edit-input"
                      />
                    ) : (
                      <span>{profileData.contactNumber || 'Not provided'}</span>
                    )}
                  </div>
                  <div className="msme-profile__field">
                    <label>Email Address</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="msme-profile__edit-input"
                      />
                    ) : (
                      <span>{profileData.email || 'Not provided'}</span>
                    )}
                  </div>
                </div>

                <div className="msme-profile__field msme-profile__field--full">
                  <label>Business Description</label>
                  {isEditing ? (
                    <textarea
                      value={profileData.businessDescription}
                      onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                      className="msme-profile__edit-textarea msme-profile__edit-textarea--description"
                      rows="4"
                      placeholder="Enter your business description..."
                    />
                  ) : (
                    <span>{profileData.businessDescription || 'Not provided'}</span>
                  )}
                </div>
                {isEditing && (
                  <div className="msme-profile__edit-actions msme-profile__field--full">
                    <button 
                      className="msme-profile__save-btn"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="msme-profile__account-settings">
          <div className="msme-profile__card">
            <div className="msme-profile__card-header">
              <h3>Account Settings</h3>
            </div>
            <div className="msme-profile__settings-grid">
              <button 
                className="msme-profile__setting-btn msme-profile__setting-btn--primary"
                onClick={() => setShowChangePasswordModal(true)}
              >
                Change Password
              </button>
              <button 
                className="msme-profile__setting-btn msme-profile__setting-btn--danger"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Change Password Modal */}
        {showChangePasswordModal && (
          <div className="msme-profile__modal-overlay" onClick={() => setShowChangePasswordModal(false)}>
            <div className="msme-profile__modal" onClick={(e) => e.stopPropagation()}>
              <div className="msme-profile__modal-header">
                <h3>Change Password</h3>
                <button 
                  className="msme-profile__modal-close"
                  onClick={() => setShowChangePasswordModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="msme-profile__modal-content">
                <div className="msme-profile__field">
                  <label>Current Password</label>
                  <div className="msme-profile__password-field">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                      className="msme-profile__edit-input"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="msme-profile__password-toggle"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </button>
                  </div>
                </div>
                <div className="msme-profile__field">
                  <label>New Password</label>
                  <div className="msme-profile__password-field">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                      className="msme-profile__edit-input"
                      placeholder="Enter new password (min. 6 characters)"
                    />
                    <button
                      type="button"
                      className="msme-profile__password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={passwordData.newPassword} />
                </div>
                <div className="msme-profile__field">
                  <label>Confirm New Password</label>
                  <div className="msme-profile__password-field">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                      className="msme-profile__edit-input"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="msme-profile__password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="msme-profile__modal-actions">
                <button 
                  className="msme-profile__modal-btn msme-profile__modal-btn--secondary"
                  onClick={() => setShowChangePasswordModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="msme-profile__modal-btn msme-profile__modal-btn--primary"
                  onClick={handleChangePassword}
                  disabled={saving}
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Component */}
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={hideNotification}
          showConfirmButtons={notification.showConfirmButtons}
          onConfirm={notification.onConfirm}
          onCancel={notification.onCancel}
          duration={4000}
        />
      </div>
    </div>
  );
};

export default MsmeProfile;
