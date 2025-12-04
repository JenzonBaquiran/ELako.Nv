import React, { useState, useEffect } from 'react';
import MsmeSidebar from './MsmeSidebar';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../components/NotificationProvider';
import { processGoogleMapsInput } from '../utils/googleMapsProcessor';
import '../css/MsmeCustomizeDashboard.css';

const MsmeCustomizeDashboard = () => {
  const { user, userType } = useAuth();
  const { showSuccess, showError, showConfirm } = useNotification();
  const [sidebarState, setSidebarState] = useState({ isOpen: true, isMobile: false });
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [blogFormData, setBlogFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    mediaType: 'image',
    mediaUrl: '',
    category: 'STORE UPDATE',
    featured: false
  });
  const [blogFormLoading, setBlogFormLoading] = useState(false);
  
  // Dashboard customization state
  const [dashboardData, setDashboardData] = useState({
    coverPhoto: null,
    storeLogo: null,
    businessName: '',
    description: '',
    contactNumber: '',
    location: '',
    googleMapsUrl: '',
    coordinates: { lat: null, lng: null },
    socialLinks: {
      facebook: '',
      instagram: ''
    },
    ecommercePlatforms: {
      shopee: { enabled: false, url: '' },
      lazada: { enabled: false, url: '' },
      tiktok: { enabled: false, url: '' }
    },
    rating: 0,
    totalRatings: 0,
    isPublic: true
  });

  const [previewUrls, setPreviewUrls] = useState({
    coverPhoto: null,
    storeLogo: null
  });

  const [editMode, setEditMode] = useState(false);
  const [showBlogViewModal, setShowBlogViewModal] = useState(false);
  const [selectedViewBlog, setSelectedViewBlog] = useState(null);

  // Debug preview URLs whenever they change
  useEffect(() => {
    console.log('=== PREVIEW URLs CHANGED ===');
    console.log('Cover photo URL:', previewUrls.coverPhoto);
    console.log('Store logo URL:', previewUrls.storeLogo);
    console.log('============================');
  }, [previewUrls]);

  // Fetch dashboard data and products on component mount
  useEffect(() => {
    if (user && user._id) {
      console.log('User ID found, fetching dashboard data for:', user._id);
      fetchDashboardData();
      fetchProducts();
      fetchBlogPosts();
    } else {
      console.log('No user ID found, cannot fetch dashboard data');
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?._id) return;
    
    try {
      const response = await fetch(`http://localhost:1337/api/msme/${user._id}/dashboard`);
      const data = await response.json();
      
      if (data.success) {
        console.log('=== DASHBOARD DATA FETCH SUCCESS ===');
        console.log('Full dashboard data:', data.dashboard);
        console.log('Cover photo:', data.dashboard.coverPhoto);
        console.log('Store logo:', data.dashboard.storeLogo);
        console.log('=====================================');
        
        // Ensure new fields have default values if not present in the data
        const dashboardWithDefaults = {
          ...data.dashboard,
          ecommercePlatforms: data.dashboard.ecommercePlatforms || {
            shopee: { enabled: false, url: '' },
            lazada: { enabled: false, url: '' },
            tiktok: { enabled: false, url: '' }
          },
          googleMapsUrl: data.dashboard.googleMapsUrl || '',
          coordinates: data.dashboard.coordinates || { lat: null, lng: null },
          rating: data.dashboard.rating || 0,
          totalRatings: data.dashboard.totalRatings || 0
        };
        setDashboardData(dashboardWithDefaults);
        // Set preview URLs for existing images
        if (data.dashboard.coverPhoto) {
          setPreviewUrls(prev => ({
            ...prev,
            coverPhoto: `http://localhost:1337/uploads/${data.dashboard.coverPhoto}`
          }));
        }
        if (data.dashboard.storeLogo) {
          const logoUrl = `http://localhost:1337/uploads/${data.dashboard.storeLogo}`;
          console.log('✅ STORE LOGO DETECTED:');
          console.log('   - Setting store logo URL:', logoUrl);
          console.log('   - Store logo filename:', data.dashboard.storeLogo);
          console.log('   - Business name:', data.dashboard.businessName);
          setPreviewUrls(prev => ({
            ...prev,
            storeLogo: logoUrl
          }));
          
          // Test if image can be loaded
          const testImg = new Image();
          testImg.onload = () => console.log('✅ Store logo image loads successfully');
          testImg.onerror = () => console.error('❌ Store logo image failed to load');
          testImg.src = logoUrl;
        } else {
          console.log('❌ No store logo found in dashboard data');
          setPreviewUrls(prev => ({
            ...prev,
            storeLogo: null
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const fetchProducts = async () => {
    if (!user?._id) return;
    
    try {
      const response = await fetch(`http://localhost:1337/api/msme/${user._id}/products/owner?visible=true`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchBlogPosts = async () => {
    if (!user?._id) return;
    
    try {
      const response = await fetch(`http://localhost:1337/api/msme/${user._id}/blog-posts/all`);
      const data = await response.json();
      
      if (data.success) {
        setBlogPosts(data.posts);
      }
    } catch (error) {
      console.error("Error fetching blog posts:", error);
    }
  };

  const handleBlogFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBlogFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBlogFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBlogFormData(prev => ({
        ...prev,
        mediaUrl: file
      }));
    }
  };

  const handleAddBlog = () => {
    setBlogFormData({
      title: '',
      subtitle: '',
      description: '',
      mediaType: 'image',
      mediaUrl: '',
      category: 'STORE UPDATE',
      featured: false
    });
    setEditingBlog(null);
    setShowBlogForm(true);
  };

  const handleEditBlog = (blog) => {
    setBlogFormData({
      title: blog.title,
      subtitle: blog.subtitle,
      description: blog.description,
      mediaType: blog.mediaType,
      mediaUrl: blog.mediaUrl,
      category: blog.category,
      featured: blog.featured
    });
    setEditingBlog(blog);
    setShowBlogForm(true);
  };

  const handleSaveBlog = async (e) => {
    e.preventDefault();
    setBlogFormLoading(true);

    try {
      const formData = new FormData();
      formData.append('msmeId', user._id);
      formData.append('title', blogFormData.title);
      formData.append('subtitle', blogFormData.subtitle);
      formData.append('description', blogFormData.description);
      formData.append('mediaType', blogFormData.mediaType);
      formData.append('category', blogFormData.category);
      formData.append('featured', blogFormData.featured);

      if (blogFormData.mediaType === 'youtube') {
        formData.append('mediaUrl', blogFormData.mediaUrl);
      } else if (blogFormData.mediaUrl instanceof File) {
        formData.append('media', blogFormData.mediaUrl);
      } else if (typeof blogFormData.mediaUrl === 'string' && blogFormData.mediaUrl) {
        formData.append('mediaUrl', blogFormData.mediaUrl);
      }

      const url = editingBlog 
        ? `http://localhost:1337/api/msme/blog-posts/${editingBlog._id}`
        : 'http://localhost:1337/api/msme/blog-posts';
      
      const method = editingBlog ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(editingBlog ? "Blog post updated successfully!" : "Blog post created successfully!");
        setShowBlogForm(false);
        fetchBlogPosts();
      } else {
        showError(data.error || "Failed to save blog post");
      }
    } catch (error) {
      console.error("Error saving blog post:", error);
      showError("Failed to save blog post");
    } finally {
      setBlogFormLoading(false);
    }
  };

  const handleDeleteBlog = async (blogId) => {
    const confirmed = await showConfirm(
      "This action cannot be undone. Are you sure you want to delete this blog post?",
      "Delete Blog Post"
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:1337/api/msme/blog-posts/${blogId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Blog post deleted successfully!", "Deleted");
        fetchBlogPosts();
      } else {
        showError(data.error || "Failed to delete blog post", "Delete Failed");
      }
    } catch (error) {
      console.error("Error deleting blog post:", error);
      showError("An error occurred while deleting the blog post. Please try again.", "Delete Failed");
    }
  };

  const handleViewBlog = (blog) => {
    setSelectedViewBlog(blog);
    setShowBlogViewModal(true);
  };

  const getBlogMediaUrl = (blog) => {
    if (blog.mediaType === 'youtube') {
      return blog.mediaUrl;
    }
    return `http://localhost:1337/uploads/${blog.mediaUrl}`;
  };

  const getYouTubeThumbnail = (url) => {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return null;
  };

  // Function to extract YouTube video ID from various URL formats
  const extractYouTubeId = (url) => {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Render media preview function like admin blog management
  const renderBlogMediaPreview = (blog) => {
    switch (blog.mediaType) {
      case 'youtube':
        let videoId;
        if (blog.mediaUrl.includes('youtube.com')) {
          videoId = blog.mediaUrl.split('v=')[1]?.split('&')[0];
        } else if (blog.mediaUrl.includes('youtu.be')) {
          videoId = blog.mediaUrl.split('/').pop().split('?')[0];
        } else {
          videoId = blog.mediaUrl.split('/').pop();
        }
        return (
          <div className="blog-media-preview youtube">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              frameBorder="0"
              allowFullScreen
              className="blog-thumbnail"
            ></iframe>
          </div>
        );
      case 'video':
        return (
          <div className="blog-media-preview video">
            <video controls className="blog-thumbnail">
              <source src={`http://localhost:1337/uploads/${blog.mediaUrl}`} type="video/mp4" />
            </video>
          </div>
        );
      case 'image':
      default:
        return (
          <div className="blog-media-preview image">
            <img src={`http://localhost:1337/uploads/${blog.mediaUrl}`} alt={blog.title} className="blog-thumbnail" />
          </div>
        );
    }
  };

  const handleSidebarToggle = (stateOrIsOpen, isMobile = false) => {
    if (typeof stateOrIsOpen === 'object') {
      setSidebarState({ 
        isOpen: stateOrIsOpen.isOpen, 
        isMobile: stateOrIsOpen.isMobile 
      });
    } else {
      setSidebarState({ isOpen: stateOrIsOpen, isMobile });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for Google Maps URL to automatically process iframe HTML
    if (name === 'googleMapsUrl') {
      const processResult = processGoogleMapsInput(value);
      
      // Use the processed URL
      setDashboardData(prev => ({
        ...prev,
        [name]: processResult.url
      }));
      return;
    }
    
    if (name.includes('.')) {
      const parts = name.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setDashboardData(prev => {
          const newData = {
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: type === 'checkbox' ? checked : value
            }
          };
          
          return newData;
        });
      } else if (parts.length === 3) {
        const [parent, child, subchild] = parts;
        setDashboardData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subchild]: type === 'checkbox' ? checked : value
            }
          }
        }));
      }
    } else {
      setDashboardData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError("Please select a valid image file", "Invalid File");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showError("Image file size must be less than 5MB", "File Too Large");
        return;
      }

      console.log(`📁 New ${type} file selected:`, {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type
      });

      setDashboardData(prev => ({
        ...prev,
        [type]: file
      }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        console.log(`✅ Preview created for ${type}`);
        setPreviewUrls(prev => ({
          ...prev,
          [type]: reader.result
        }));
      };
      reader.readAsDataURL(file);

      if (type === 'storeLogo') {
        showSuccess("Store logo selected! Click 'Save Changes' to upload.", "Logo Ready");
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add text fields
      formData.append('businessName', dashboardData.businessName);
      formData.append('description', dashboardData.description);
      formData.append('contactNumber', dashboardData.contactNumber);
      formData.append('location', dashboardData.location);
      formData.append('googleMapsUrl', dashboardData.googleMapsUrl);
      formData.append('coordinates', JSON.stringify(dashboardData.coordinates));
      formData.append('socialLinks', JSON.stringify(dashboardData.socialLinks));
      formData.append('ecommercePlatforms', JSON.stringify(dashboardData.ecommercePlatforms));
      formData.append('isPublic', dashboardData.isPublic);
      formData.append('msmeId', user._id);
      formData.append('userType', userType); // Add user role for server validation
      
      // Add files if they're new uploads
      if (dashboardData.coverPhoto instanceof File) {
        formData.append('coverPhoto', dashboardData.coverPhoto);
      }
      if (dashboardData.storeLogo instanceof File) {
        formData.append('storeLogo', dashboardData.storeLogo);
      }

      const response = await fetch('http://localhost:1337/api/msme/dashboard', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        const hasNewLogo = dashboardData.storeLogo instanceof File;
        const successMessage = hasNewLogo 
          ? "Dashboard and store logo updated successfully!" 
          : "Dashboard updated successfully!";
        showSuccess(successMessage, "Success");
        setEditMode(false);
        fetchDashboardData(); // Refresh data
      } else {
        showError(data.error || "Failed to update dashboard", "Error");
      }
    } catch (error) {
      console.error("Error updating dashboard:", error);
      showError("Failed to update dashboard", "Error");
    } finally {
      setLoading(false);
    }
  };

  const getProductImageUrl = (product) => {
    if (product.picture) {
      return `http://localhost:1337/uploads/${product.picture}`;
    }
    return '/default-product.jpg';
  };

  const getContentClass = () => {
    if (sidebarState.isMobile) {
      return 'msme-customize-dashboard-content msme-customize-dashboard-content--mobile';
    }
    return sidebarState.isOpen 
      ? 'msme-customize-dashboard-content sidebar-open' 
      : 'msme-customize-dashboard-content sidebar-closed';
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span key={index} className={`star ${index < rating ? 'filled' : ''}`}>
        ★
      </span>
    ));
  };

  return (
    <div className="msme-customize-dashboard-container">
      <MsmeSidebar onSidebarToggle={handleSidebarToggle} />
      <div className={getContentClass()}>
        <div className="msme-customize-dashboard-header">
          <div className="msme-customize-dashboard-header-content">
            <div className="msme-customize-dashboard-header-text">
              <h1>Customize Store Dashboard</h1>
              <p>Create your public store profile that customers will see.</p>
            </div>
            <div className="msme-customize-dashboard-actions">
              {!editMode ? (
                <button 
                  className="msme-customize-dashboard-edit-button"
                  onClick={() => setEditMode(true)}
                >
                  Edit Dashboard
                </button>
              ) : (
                <div className="edit-mode-actions">
                  <button 
                    className="msme-customize-dashboard-cancel-button"
                    onClick={() => {
                      setEditMode(false);
                      fetchDashboardData(); // Reset data
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="msme-customize-dashboard-save-button"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview/Edit Dashboard */}
        <div className="dashboard-preview-container">
          {/* Cover Photo Section */}
          <div className="cover-photo-section">
            {editMode ? (
              <div className="cover-photo-upload">
                <input
                  type="file"
                  id="coverPhoto"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'coverPhoto')}
                  style={{ display: 'none' }}
                />
                <label htmlFor="coverPhoto" className="cover-photo-upload-label">
                  {previewUrls.coverPhoto ? (
                    <img src={previewUrls.coverPhoto} alt="Cover" className="cover-photo-preview" />
                  ) : (
                    <div className="cover-photo-placeholder">
                      <span>Click to upload cover photo</span>
                    </div>
                  )}
                </label>
              </div>
            ) : (
              <div className="cover-photo-display">
                {previewUrls.coverPhoto ? (
                  <img src={previewUrls.coverPhoto} alt="Store Cover" className="cover-photo" />
                ) : (
                  <div className="cover-photo-default">
                    <span>No cover photo uploaded</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Store Info Section */}
          <div className="customize-store-info-section">
            <div className="customize-store-logo-container">
              {editMode ? (
                <div className="store-logo-upload">
                  <input
                    type="file"
                    id="storeLogo"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'storeLogo')}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="storeLogo" className="customize-store-logo-upload-label">
                    {previewUrls.storeLogo ? (
                      <div className="customize-logo-edit-container">
                        <img 
                          src={previewUrls.storeLogo} 
                          alt="Logo" 
                          className="customize-store-logo-preview"
                          onError={(e) => {
                            console.error('❌ Failed to load store logo:', previewUrls.storeLogo);
                            console.error('Error details:', e);
                            // Hide the broken image and show placeholder
                            setPreviewUrls(prev => ({ ...prev, storeLogo: null }));
                          }}
                          onLoad={() => console.log('✅ Store logo loaded successfully:', previewUrls.storeLogo)}
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '100%',
                            display: 'block'
                          }}
                        />
                        <div className="customize-logo-edit-overlay">
                          <span className="customize-edit-icon">✏️</span>
                          <span className="customize-edit-text">Click to change</span>
                        </div>
                      </div>
                    ) : (
                      <div className="customize-store-logo-placeholder">
                        <span>📷</span>
                        <span className="customize-upload-text">Upload Logo</span>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <div className="customize-store-logo-display">
                  {previewUrls.storeLogo ? (
                    <img 
                      src={previewUrls.storeLogo} 
                      alt="Store Logo" 
                      className="customize-store-logo"
                      onError={(e) => {
                        console.error('❌ Failed to load store logo in display mode:', previewUrls.storeLogo);
                        console.error('Error details:', e);
                        // Hide the broken image and show placeholder
                        setPreviewUrls(prev => ({ ...prev, storeLogo: null }));
                      }}
                      onLoad={() => console.log('✅ Store logo display loaded successfully:', previewUrls.storeLogo)}
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%',
                        display: 'block'
                      }}
                    />
                  ) : (
                    <div className="customize-store-logo-default">
                      <span>📷</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="customize-store-details">
              {editMode ? (
                <div className="customize-store-details-edit">
                  <div className="customize-business-name-with-logo">
                    <input
                      type="text"
                      name="businessName"
                      value={dashboardData.businessName}
                      onChange={userType === 'admin' ? handleInputChange : null}
                      placeholder={userType === 'admin' ? "Business Name" : "Business Name (Admin only)"}
                      className={`customize-business-name-input ${userType !== 'admin' ? 'read-only' : ''}`}
                      readOnly={userType !== 'admin'}
                      title={userType !== 'admin' ? "Only administrators can edit the business name" : ""}
                    />
                    <div className="customize-business-name-logo edit-mode">
                      {previewUrls.storeLogo ? (
                        <>
                          <img 
                            src={previewUrls.storeLogo} 
                            alt="Store Logo" 
                            className="customize-inline-store-logo"
                            onError={(e) => {
                              console.error('❌ Failed to load inline store logo in edit mode:', previewUrls.storeLogo);
                              e.target.style.display = 'none';
                            }}
                            onLoad={() => console.log('✅ Inline store logo loaded successfully in edit mode:', previewUrls.storeLogo)}
                          />
                          <div className="customize-edit-logo-overlay">
                            <input
                              type="file"
                              id="inlineStoreLogo"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, 'storeLogo')}
                              style={{ display: 'none' }}
                            />
                            <label htmlFor="inlineStoreLogo" className="customize-edit-logo-button">
                              📷
                            </label>
                          </div>
                        </>
                      ) : (
                        <div className="customize-inline-logo-placeholder">
                          <input
                            type="file"
                            id="inlineStoreLogoNew"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'storeLogo')}
                            style={{ display: 'none' }}
                          />
                          <label htmlFor="inlineStoreLogoNew" className="customize-inline-upload-button">
                            <span className="customize-upload-icon">📷</span>
                            <span className="customize-upload-label">Add Logo</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                  <textarea
                    name="description"
                    value={dashboardData.description}
                    onChange={handleInputChange}
                    placeholder="Store Description"
                    className="customize-description-input"
                    rows="3"
                  />
                </div>
              ) : (
                <div className="customize-store-details-display">
                  <div className="customize-business-name-with-logo">
                    <h2 className="customize-business-name">{dashboardData.businessName || 'Business Name'}</h2>
                    {previewUrls.storeLogo && (
                      <div className="customize-business-name-logo">
                        <img 
                          src={previewUrls.storeLogo} 
                          alt="Store Logo" 
                          className="customize-inline-store-logo"
                          onError={(e) => {
                            console.error('❌ Failed to load inline store logo:', previewUrls.storeLogo);
                            e.target.style.display = 'none';
                          }}
                          onLoad={() => console.log('✅ Inline store logo loaded successfully:', previewUrls.storeLogo)}
                        />
                      </div>
                    )}
                  </div>
                  <p className="customize-store-description">{dashboardData.description || 'Store description will appear here.'}</p>
                </div>
              )}

              {/* Rating Display */}
              <div className="customize-store-rating">
                <div className="customize-rating-stars">
                  {renderStars(dashboardData.rating || 0)}
                </div>
                <span className="customize-rating-text">
                  ({dashboardData.rating ? dashboardData.rating.toFixed(1) : '0.0'}/5.0)
                  {dashboardData.totalRatings > 0 && (
                    <span className="customize-rating-count"> • {dashboardData.totalRatings} rating{dashboardData.totalRatings !== 1 ? 's' : ''}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Contact & Social Links - Desktop optimized wrapper */}
          <div className="contact-social-wrapper">
            {/* Contact & Location Section */}
            <div className="contact-section">
              <div className="contact-grid">
                <div className="contact-item">
                  <h4>Contact Number</h4>
                  {editMode ? (
                    <input
                      type="tel"
                      name="contactNumber"
                      value={dashboardData.contactNumber}
                      onChange={handleInputChange}
                      placeholder="Contact Number"
                      className="contact-input"
                    />
                  ) : (
                    <p>{dashboardData.contactNumber || 'No contact number provided'}</p>
                  )}
                </div>
              </div>

              {/* Location Section */}
              <div className="location-enhanced-section">
                <h3>Store Location (Embedded Google Maps)</h3>
                {editMode ? (
                  <div className="location-input-group">
                  <input
                    type="url"
                    name="googleMapsUrl"
                    value={dashboardData.googleMapsUrl || ''}
                    onChange={handleInputChange}
                    placeholder="Paste your Google Maps EMBED link OR iframe HTML code here..."
                    className="specific-address-input"
                  />
                  
                  <div className="location-help-text">
                    <small>
                      � <strong>How to add your location:</strong><br/>
                      <strong>Option 1:</strong> Paste the embed URL (starts with https://www.google.com/maps/embed?pb=...)<br/>
                      <strong>Option 2:</strong> Paste the entire iframe HTML code - we'll extract the URL automatically!<br/><br/>
                      
                      <strong>To get the embed code:</strong><br/>
                      1. Go to <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer">Google Maps</a><br/>
                      2. Search and find your store location<br/>
                      3. Click "Share" button<br/>
                      4. Click "Embed a map" tab<br/>
                      5. Copy either the URL from src="" or the entire iframe code
                    </small>
                  </div>
                  {dashboardData.googleMapsUrl && (
                    <div className="location-preview">
                      <small>📍 Preview:</small>
                      <iframe
                        src={dashboardData.googleMapsUrl}
                        width="100%"
                        height="280"
                        style={{border: 0, borderRadius: '8px', marginTop: '8px',paddingLeft: '20px'}}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Location Preview"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="location-display">
                  {dashboardData.googleMapsUrl ? (
                    <div className="address-with-map">
                      <iframe
                        src={dashboardData.googleMapsUrl}
                        width="100%"
                        height="450"
                        style={{border: 0, borderRadius: '8px'}}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Store Location"
                      />
                    </div>
                  ) : (
                    <p className="no-address">No location provided. Click "Edit Profile" to add your store location.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Social Links Section */}
          <div className="social-section">
            <h2>Social Media & Links</h2>
            <div className="social-grid">
              {Object.entries(dashboardData.socialLinks)
                .filter(([platform]) => ['facebook', 'instagram'].includes(platform))
                .map(([platform, url]) => (
                <div key={platform} className="social-item">
                  <label className="social-label">
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </label>
                  {editMode ? (
                    <input
                      type="url"
                      name={`socialLinks.${platform}`}
                      value={url}
                      onChange={handleInputChange}
                      placeholder={`${platform} URL`}
                      className="social-input"
                    />
                  ) : (
                    <div className="social-display">
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="social-link">
                          {url}
                        </a>
                      ) : (
                        <span className="social-empty">Not provided</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {/* E-commerce Platforms in Social Links Style */}
              {Object.entries(dashboardData.ecommercePlatforms || {}).map(([platform, data]) => (
                <div key={platform} className="social-item">
                  <label className="social-label">
                    {platform === 'shopee' && 'Shopee'}
                    {platform === 'lazada' && 'Lazada'}
                    {platform === 'tiktok' && 'TikTok Shop'}
                  </label>
                  {editMode ? (
                    <input
                      type="url"
                      name={`ecommercePlatforms.${platform}.url`}
                      value={data?.url || ''}
                      onChange={handleInputChange}
                      placeholder={`${platform} store URL`}
                      className="social-input"
                    />
                  ) : (
                    <div className="social-display">
                      {data?.url ? (
                        <a href={data?.url} target="_blank" rel="noopener noreferrer" className="social-link">
                          {data?.url}
                        </a>
                      ) : (
                        <span className="social-empty">Not provided</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          </div>

          {/* Blog/Video Section */}
          <div className="blog-section">
            <div className="blog-section-header">
              <h2>Store Blog & Videos</h2>
              {editMode && (
                <button 
                  className="add-blog-btn"
                  onClick={handleAddBlog}
                >
                  + Add Blog Post
                </button>
              )}
            </div>
            
            {blogPosts.length > 0 ? (
              <div className="blog-grid">
                {blogPosts.map((blog) => (
                  <div key={blog._id} className="blog-card">
                    <div className="blog-media" onClick={() => handleViewBlog(blog)}>
                      {renderBlogMediaPreview(blog)}
                      <div className="blog-media-type">
                        {blog.mediaType === 'youtube' && 'Video'}
                        {blog.mediaType === 'video' && 'Video'}
                        {blog.mediaType === 'image' && 'Image'}
                      </div>
                      {blog.featured && <div className="blog-featured-badge">Featured</div>}
                    </div>
                    <div className="blog-content">
                      <div className="blog-category">{blog.category}</div>
                      <h4 className="blog-title">{blog.title}</h4>
                      <p className="blog-subtitle">{blog.subtitle}</p>
                      <p className="blog-description">{blog.description}</p>
                      <div className="blog-meta">
                        <span className="blog-date">
                          {new Date(blog.createdAt).toLocaleDateString()}
                        </span>
                        <span className="blog-views">{blog.views || 0} views</span>
                      </div>
                      {editMode && (
                        <div className="blog-actions">
                          <button 
                            className="edit-blog-btn"
                            onClick={() => handleEditBlog(blog)}
                          >
                            Edit
                          </button>
                          <button 
                            className="delete-blog-btn"
                            onClick={() => handleDeleteBlog(blog._id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-blogs">
                <p>No blog posts yet. {editMode ? 'Add your first blog post or video to engage with customers!' : 'Check back later for updates from this store.'}</p>
              </div>
            )}
          </div>

          {/* Products Section */}
          <div className="products-section">
            <h2>Store Products</h2>
            {products.length > 0 ? (
              <div className="products-grid">
                {products.map((product) => (
                  <div key={product._id} className="product-card">
                    <img 
                      src={getProductImageUrl(product)} 
                      alt={product.productName} 
                      className="product-image" 
                    />
                    <div className="product-info">
                      <h4 className="product-name">{product.productName}</h4>
                      <p className="product-price">₱{product.price}</p>
                      <p className="product-description">{product.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-products">
                <p>No products to display. Add products to showcase them here.</p>
              </div>
            )}
          </div>

          {/* Public/Private Toggle */}
          {editMode && (
            <div className="visibility-section">
              <label className="visibility-toggle">
                <input
                  type="checkbox"
                  checked={dashboardData.isPublic}
                  onChange={(e) => setDashboardData(prev => ({ ...prev, isPublic: e.target.checked }))}
                />
                <span className="visibility-text">Make this dashboard public (customers can view it)</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Blog Form Modal */}
      {showBlogForm && (
        <div className="blog-form-overlay" onClick={() => setShowBlogForm(false)}>
          <div className="blog-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="blog-form-header">
              <h3>{editingBlog ? 'Edit Blog Post' : 'Add New Blog Post'}</h3>
              <button 
                className="blog-form-close"
                onClick={() => setShowBlogForm(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSaveBlog} className="blog-form">
              <div className="blog-form-row">
                <div className="blog-form-field">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={blogFormData.title}
                    onChange={handleBlogFormChange}
                    placeholder="Enter blog post title"
                    required
                  />
                </div>
                <div className="blog-form-field">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={blogFormData.category}
                    onChange={handleBlogFormChange}
                    required
                  >
                    <option value="STORE UPDATE">Store Update</option>
                    <option value="NEW PRODUCTS">New Products</option>
                    <option value="BEHIND THE SCENES">Behind the Scenes</option>
                    <option value="CUSTOMER STORIES">Customer Stories</option>
                    <option value="BUSINESS JOURNEY">Business Journey</option>
                    <option value="PROMOTIONS">Promotions</option>
                    <option value="EVENTS">Events</option>
                    <option value="TUTORIALS">Tutorials</option>
                  </select>
                </div>
              </div>

              <div className="blog-form-field">
                <label>Subtitle *</label>
                <input
                  type="text"
                  name="subtitle"
                  value={blogFormData.subtitle}
                  onChange={handleBlogFormChange}
                  placeholder="Enter a compelling subtitle"
                  required
                />
              </div>

              <div className="blog-form-field">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={blogFormData.description}
                  onChange={handleBlogFormChange}
                  placeholder="Tell your story..."
                  rows="4"
                  required
                />
              </div>

              <div className="blog-form-row">
                <div className="blog-form-field">
                  <label>Media Type *</label>
                  <select
                    name="mediaType"
                    value={blogFormData.mediaType}
                    onChange={handleBlogFormChange}
                    required
                  >
                    <option value="image">Image</option>
                    <option value="video">Video File</option>
                    <option value="youtube">YouTube Video</option>
                  </select>
                </div>
                <div className="blog-form-field">
                  <label className="blog-form-checkbox">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={blogFormData.featured}
                      onChange={handleBlogFormChange}
                    />
                    <span>Featured Post</span>
                  </label>
                </div>
              </div>

              <div className="blog-form-field">
                {blogFormData.mediaType === 'youtube' ? (
                  <>
                    <label>YouTube URL *</label>
                    <input
                      type="url"
                      name="mediaUrl"
                      value={blogFormData.mediaUrl}
                      onChange={handleBlogFormChange}
                      placeholder="https://www.youtube.com/watch?v=..."
                      required
                    />
                    {blogFormData.mediaUrl && (
                      <div className="blog-form-preview">
                        <iframe
                          src={`https://www.youtube.com/embed/${extractYouTubeId(blogFormData.mediaUrl)}`}
                          width="200"
                          height="113"
                          frameBorder="0"
                          allowFullScreen
                          title="YouTube Preview"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <label>Upload {blogFormData.mediaType === 'video' ? 'Video' : 'Image'} *</label>
                    <input
                      type="file"
                      accept={blogFormData.mediaType === 'video' ? 'video/*' : 'image/*'}
                      onChange={handleBlogFileChange}
                      required={!editingBlog}
                    />
                    {blogFormData.mediaUrl && typeof blogFormData.mediaUrl === 'string' && (
                      <div className="blog-form-preview">
                        {blogFormData.mediaType === 'video' ? (
                          <video controls width="200">
                            <source src={`http://localhost:1337/uploads/${blogFormData.mediaUrl}`} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img 
                            src={`http://localhost:1337/uploads/${blogFormData.mediaUrl}`} 
                            alt="Current media" 
                            width="200"
                            style={{maxHeight: '150px', objectFit: 'cover'}}
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="blog-form-actions">
                <button
                  type="button"
                  className="blog-form-cancel"
                  onClick={() => setShowBlogForm(false)}
                  disabled={blogFormLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="blog-form-save"
                  disabled={blogFormLoading}
                >
                  {blogFormLoading ? 'Saving...' : (editingBlog ? 'Update Post' : 'Create Post')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blog View Modal */}
      {showBlogViewModal && selectedViewBlog && (
        <div className="blog-view-modal-overlay" onClick={() => setShowBlogViewModal(false)}>
          <div className="blog-view-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="blog-view-modal-close"
              onClick={() => setShowBlogViewModal(false)}
            >
              ×
            </button>
            
            <div className="blog-view-modal-header">
              <h2 className="blog-view-modal-title">{selectedViewBlog.title}</h2>
              <div className="blog-view-modal-meta">
                <span className="blog-view-modal-category">{selectedViewBlog.category}</span>
                <span className="blog-view-modal-date">
                  {new Date(selectedViewBlog.createdAt).toLocaleDateString()}
                </span>
                <span className="blog-view-modal-views">
                  {selectedViewBlog.views || 0} view{(selectedViewBlog.views || 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="blog-view-modal-body">
              {selectedViewBlog.mediaType === 'image' && selectedViewBlog.mediaUrl && (
                <div className="blog-view-modal-media">
                  <img 
                    src={getBlogMediaUrl(selectedViewBlog)} 
                    alt={selectedViewBlog.title}
                    className="blog-view-modal-image"
                  />
                </div>
              )}
              
              {selectedViewBlog.mediaType === 'video' && selectedViewBlog.mediaUrl && (
                <div className="blog-view-modal-media">
                  <video 
                    src={getBlogMediaUrl(selectedViewBlog)}
                    className="blog-view-modal-video"
                    controls
                  />
                </div>
              )}
              
              {selectedViewBlog.mediaType === 'youtube' && selectedViewBlog.mediaUrl && (
                <div className="blog-view-modal-media">
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(selectedViewBlog.mediaUrl)}?rel=0&modestbranding=1`}
                    title={selectedViewBlog.title}
                    className="blog-view-modal-youtube"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              )}
              
              <div className="blog-view-modal-text">
                <h3>{selectedViewBlog.subtitle}</h3>
                <p>{selectedViewBlog.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MsmeCustomizeDashboard;
