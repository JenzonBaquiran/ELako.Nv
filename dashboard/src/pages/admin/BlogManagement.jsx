import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../AdminSidebar';
import Notification from '../../components/Notification';
import '../../css/BlogManagement.css';

const BlogManagement = () => {
  const navigate = useNavigate();
  const [sidebarState, setSidebarState] = useState({
    isOpen: true,
    isMobile: false,
    isCollapsed: false
  });
  const [blogPosts, setBlogPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    subtitle: '',
    description: '',
    author: '',
    readTime: '',
    mediaType: 'image', // 'image', 'video', 'youtube'
    mediaUrl: '',
    featured: false,
    status: 'draft' // 'draft', 'published'
  });
  const [readTimeError, setReadTimeError] = useState('');
  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'info',
    title: '',
    message: '',
    showConfirmButtons: false,
    onConfirm: null,
    onCancel: null
  });

  const categories = [
    'SUCCESS STORIES',
    'BUSINESS GROWTH',
    'FEATURED STORES',
    'ART & CULTURE',
    'DIGITAL MARKETING',
    'ENTREPRENEURSHIP',
    'TECHNOLOGY',
    'INNOVATION'
  ];

  // Fetch blog posts
  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const handleSidebarToggle = (state) => {
    setSidebarState(state);
  };

  const getContentClass = () => {
    if (sidebarState.isMobile) {
      return 'blog-management__content blog-management__content--mobile';
    }
    return sidebarState.isOpen 
      ? 'blog-management__content blog-management__content--sidebar-open' 
      : 'blog-management__content blog-management__content--sidebar-collapsed';
  };

  const fetchBlogPosts = async () => {
    try {
      const response = await fetch('http://localhost:1337/api/blog-posts');
      const data = await response.json();
      if (data.success) {
        setBlogPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for readTime to ensure only positive numbers (> 0)
    if (name === 'readTime') {
      const numValue = parseFloat(value);
      if (value === '') {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
        setReadTimeError('');
      } else if (numValue > 0 && !isNaN(numValue)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
        setReadTimeError('');
      } else {
        setReadTimeError('0 and negative numbers not allowed');
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('media', file);

    try {
      const response = await fetch('http://localhost:1337/api/upload', {
        method: 'POST',
        body: formDataUpload
      });
      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          mediaUrl: data.filename
        }));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingPost 
        ? `http://localhost:1337/api/blog-posts/${editingPost._id}`
        : 'http://localhost:1337/api/blog-posts';
      
      const method = editingPost ? 'PUT' : 'POST';
      
      // Format the readTime for submission
      const submissionData = {
        ...formData,
        readTime: formData.readTime ? `${formData.readTime} MIN READ` : ''
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      const data = await response.json();
      if (data.success) {
        fetchBlogPosts();
        resetForm();
        setShowForm(false);
        
        // Show success notification
        setNotification({
          isVisible: true,
          type: 'success',
          title: 'Success',
          message: editingPost 
            ? `Blog post "${formData.title}" updated successfully`
            : `Blog post "${formData.title}" created successfully`,
          showConfirmButtons: false,
          onConfirm: null,
          onCancel: null
        });
      }
    } catch (error) {
      console.error('Error saving blog post:', error);
      setNotification({
        isVisible: true,
        type: 'error',
        title: 'Error',
        message: editingPost 
          ? 'Failed to update blog post'
          : 'Failed to create blog post',
        showConfirmButtons: false,
        onConfirm: null,
        onCancel: null
      });
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    
    // Extract numeric value from readTime (e.g., "5 MIN READ" -> "5")
    const extractReadTimeNumber = (readTimeString) => {
      if (!readTimeString) return '';
      const match = readTimeString.match(/(\d+)/);
      return match ? match[1] : '';
    };
    
    setFormData({
      category: post.category,
      title: post.title,
      subtitle: post.subtitle,
      description: post.description,
      author: post.author,
      readTime: extractReadTimeNumber(post.readTime),
      mediaType: post.mediaType,
      mediaUrl: post.mediaUrl,
      featured: post.featured,
      status: post.status
    });
    setShowForm(true);
  };

  const handleDelete = (post) => {
    setNotification({
      isVisible: true,
      type: 'confirm',
      title: 'Confirm Delete',
      message: `Are you sure you want to delete '${post.title}'?`,
      showConfirmButtons: true,
      onConfirm: () => confirmDelete(post._id),
      onCancel: () => closeNotification()
    });
  };

  const confirmDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:1337/api/blog-posts/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        fetchBlogPosts();
        setNotification({
          isVisible: true,
          type: 'success',
          title: 'Success',
          message: 'Blog post deleted successfully',
          showConfirmButtons: false,
          onConfirm: null,
          onCancel: null
        });
      }
    } catch (error) {
      console.error('Error deleting blog post:', error);
      setNotification({
        isVisible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to delete blog post',
        showConfirmButtons: false,
        onConfirm: null,
        onCancel: null
      });
    }
  };

  const closeNotification = () => {
    setNotification({
      isVisible: false,
      type: 'info',
      title: '',
      message: '',
      showConfirmButtons: false,
      onConfirm: null,
      onCancel: null
    });
  };

  const resetForm = () => {
    setFormData({
      category: '',
      title: '',
      subtitle: '',
      description: '',
      author: '',
      readTime: '',
      mediaType: 'image',
      mediaUrl: '',
      featured: false,
      status: 'draft'
    });
    setEditingPost(null);
    setReadTimeError('');
  };

  // Helper function to extract YouTube video ID
  const extractYouTubeId = (url) => {
    if (!url) return null;
    
    let videoId;
    if (url.includes('youtube.com')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be')) {
      videoId = url.split('/').pop().split('?')[0];
    } else {
      videoId = url.split('/').pop();
    }
    return videoId;
  };

  const renderMediaPreview = (post) => {
    switch (post.mediaType) {
      case 'youtube':
        const videoId = extractYouTubeId(post.mediaUrl);
        return (
          <div className="media-preview youtube">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </div>
        );
      case 'video':
        const videoUrl = post.mediaUrl?.startsWith('http') 
          ? post.mediaUrl 
          : (post.mediaUrl?.includes('/') && !post.mediaUrl?.startsWith('uploads/')
            ? `https://res.cloudinary.com/dk9umulxw/image/upload/${post.mediaUrl}`
            : `http://localhost:1337/uploads/${post.mediaUrl}`);
        return (
          <div className="media-preview video">
            <video controls>
              <source src={videoUrl} type="video/mp4" />
            </video>
          </div>
        );
      case 'image':
      default:
        const imageUrl = post.mediaUrl?.startsWith('http') 
          ? post.mediaUrl 
          : (post.mediaUrl?.includes('/') && !post.mediaUrl?.startsWith('uploads/')
            ? `https://res.cloudinary.com/dk9umulxw/image/upload/${post.mediaUrl}`
            : `http://localhost:1337/uploads/${post.mediaUrl}`);
        return (
          <div className="media-preview image">
            <img src={imageUrl} alt={post.title} />
          </div>
        );
    }
  };

  return (
    <div className="blog-management">
      <AdminSidebar onSidebarToggle={handleSidebarToggle} />
      <div className={getContentClass()}>
        <div className="blog-management-header">
          <div className="blog-management__header-text">
            <h1>Blog Management</h1>
            <p>Create and manage blog posts for the hero section</p>
          </div>
          <button 
            className="add-blog-btn"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Add New Blog Post
          </button>
        </div>

        {showForm ? (
          <div className="blog-form-container">
            <div className="blog-form-header">
              <h2>{editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="blog-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>CATEGORY</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>AUTHOR</label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder="Ferylene Valentin"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>READ TIME (MINUTES)</label>
                  <input
                    type="number"
                    name="readTime"
                    value={formData.readTime}
                    onChange={handleInputChange}
                    placeholder="Enter read time in minutes (e.g., 5)"
                    min="1"
                    step="1"
                    required
                  />
                  {readTimeError && (
                    <div style={{
                      color: '#dc3545',
                      fontSize: '12px',
                      marginTop: '5px',
                      fontFamily: 'Poppins, sans-serif'
                    }}>
                      {readTimeError}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>STATUS</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>TITLE</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Blog post title"
                  required
                />
              </div>

              <div className="form-group">
                <label>SUBTITLE</label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  placeholder="Brief description or subtitle"
                  required
                />
              </div>

              <div className="form-group">
                <label>DESCRIPTION</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Full description of the blog post"
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label>MEDIA TYPE</label>
                <select
                  name="mediaType"
                  value={formData.mediaType}
                  onChange={handleInputChange}
                >
                  <option value="image">Image</option>
                  <option value="video">Video File</option>
                  <option value="youtube">YouTube Video</option>
                </select>
              </div>

              {formData.mediaType === 'youtube' ? (
                <div className="form-group">
                  <label>YOUTUBE URL</label>
                  <input
                    type="url"
                    name="mediaUrl"
                    value={formData.mediaUrl}
                    onChange={handleInputChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                  {formData.mediaUrl && (
                    <div className="preview">
                      <iframe
                        src={`https://www.youtube.com/embed/${extractYouTubeId(formData.mediaUrl)}`}
                        width="200"
                        height="113"
                        frameBorder="0"
                        allowFullScreen
                        title="YouTube Preview"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label>UPLOAD {formData.mediaType === 'video' ? 'VIDEO' : 'IMAGE'}</label>
                  <input
                    type="file"
                    accept={formData.mediaType === 'video' ? 'video/*' : 'image/*'}
                    onChange={handleFileUpload}
                    required={!editingPost}
                  />
                  {formData.mediaUrl && (
                    <div className="preview">
                      {formData.mediaType === 'video' ? (
                        <video controls width="200">
                          <source src={formData.mediaUrl?.startsWith('http') 
                            ? formData.mediaUrl 
                            : (formData.mediaUrl?.includes('/') && !formData.mediaUrl?.startsWith('uploads/')
                              ? `https://res.cloudinary.com/dk9umulxw/image/upload/${formData.mediaUrl}`
                              : `http://localhost:1337/uploads/${formData.mediaUrl}`)} />
                        </video>
                      ) : (
                        <img 
                          src={formData.mediaUrl?.startsWith('http') 
                            ? formData.mediaUrl 
                            : (formData.mediaUrl?.includes('/') && !formData.mediaUrl?.startsWith('uploads/')
                              ? `https://res.cloudinary.com/dk9umulxw/image/upload/${formData.mediaUrl}`
                              : `http://localhost:1337/uploads/${formData.mediaUrl}`)} 
                          alt="Preview" 
                          width="200"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                  />
                  FEATURED POST
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="create-btn">
                  {editingPost ? 'UPDATE POST' : 'CREATE POST'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="blog-posts-grid">
              {blogPosts.map(post => (
                <div key={post._id} className="blog-post-card">
                  <div className="blog-post-media">
                    {renderMediaPreview(post)}
                    <div className="blog-post-badges">
                      <span className={`status-badge ${post.status}`}>
                        {post.status}
                      </span>
                      {post.featured && (
                        <span className="featured-badge">Featured</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="blog-post-content">
                    <div className="blog-post-meta">
                      <span className="category">{post.category}</span>
                      <span className="read-time">{post.readTime}</span>
                      <span className="view-count">
                        👁 {post.views || 0} view{(post.views || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <h3 className="blog-post-title">{post.title}</h3>
                    <p className="blog-post-subtitle">{post.subtitle}</p>
                    <p className="blog-post-description">
                      {post.description.length > 100 
                        ? `${post.description.substring(0, 100)}...`
                        : post.description
                      }
                    </p>
                    
                    <div className="blog-post-footer">
                      <span className="author">By {post.author}</span>
                      <div className="blog-post-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => handleEdit(post)}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete(post)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {blogPosts.length === 0 && (
              <div className="empty-state">
                <h3>No blog posts yet</h3>
                <p>Create your first blog post to get started</p>
              </div>
            )}
          </>
        )}
      </div>

      <Notification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        isVisible={notification.isVisible}
        showConfirmButtons={notification.showConfirmButtons}
        onConfirm={notification.onConfirm}
        onCancel={notification.onCancel}
        onClose={closeNotification}
      />
    </div>
  );
};

export default BlogManagement;