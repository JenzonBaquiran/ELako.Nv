import React, { useState } from 'react';
import CloudinaryImage from '../components/CloudinaryImage';
import CloudinaryUpload from '../components/CloudinaryUpload';
import { CLOUDINARY_CONFIG } from '../utils/cloudinary';
import '../css/Cloudinary.css';

const CloudinaryDemo = () => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [notification, setNotification] = useState(null);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle successful image uploads
  const handleImageUploadSuccess = (results) => {
    const newImages = Array.isArray(results) ? results : [results];
    setUploadedImages(prev => [...prev, ...newImages]);
    showNotification(`Successfully uploaded ${newImages.length} image(s)`, 'success');
  };

  // Handle successful document uploads
  const handleDocumentUploadSuccess = (results) => {
    const newDocs = Array.isArray(results) ? results : [results];
    setUploadedDocuments(prev => [...prev, ...newDocs]);
    showNotification(`Successfully uploaded ${newDocs.length} document(s)`, 'success');
  };

  // Handle upload errors
  const handleUploadError = (error) => {
    console.error('Upload error:', error);
    showNotification(error.message || 'Upload failed', 'error');
  };

  // Clear all uploads
  const clearAllUploads = () => {
    setUploadedImages([]);
    setUploadedDocuments([]);
    showNotification('All uploads cleared', 'info');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ color: '#333', marginBottom: '10px' }}>
          🌟 Cloudinary Integration Demo
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Advanced image and file management for ELako.Nv platform
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div style={{
          padding: '12px 20px',
          borderRadius: '6px',
          marginBottom: '20px',
          backgroundColor: notification.type === 'success' ? '#d4edda' : 
                          notification.type === 'error' ? '#f8d7da' : '#d1ecf1',
          color: notification.type === 'success' ? '#155724' : 
                 notification.type === 'error' ? '#721c24' : '#0c5460',
          border: `1px solid ${notification.type === 'success' ? '#c3e6cb' : 
                                notification.type === 'error' ? '#f5c6cb' : '#bee5eb'}`
        }}>
          {notification.message}
        </div>
      )}

      {/* Configuration Info */}
      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>Configuration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <strong>Cloud Name:</strong> {CLOUDINARY_CONFIG.cloudName}
          </div>
          <div>
            <strong>Max File Size:</strong> {Math.round(CLOUDINARY_CONFIG.maxFileSize / 1024 / 1024)}MB
          </div>
          <div>
            <strong>Max Files:</strong> {CLOUDINARY_CONFIG.maxFiles}
          </div>
          <div>
            <strong>Allowed Formats:</strong> {CLOUDINARY_CONFIG.allowedFormats.slice(0, 5).join(', ')}{CLOUDINARY_CONFIG.allowedFormats.length > 5 ? '...' : ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
        
        {/* Product Images Upload */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#495057', display: 'flex', alignItems: 'center' }}>
            📸 Product Images Upload
            <span style={{ 
              fontSize: '12px', 
              background: '#007bff', 
              color: 'white', 
              padding: '2px 8px', 
              borderRadius: '12px',
              marginLeft: '10px'
            }}>
              Multiple
            </span>
          </h3>
          
          <CloudinaryUpload
            onUploadSuccess={handleImageUploadSuccess}
            onUploadError={handleUploadError}
            folder={CLOUDINARY_CONFIG.folders.products}
            maxFiles={10}
            acceptedTypes={['jpg', 'jpeg', 'png', 'webp', 'gif']}
            multiple={true}
            showPreview={true}
          />
        </div>

        {/* Certificate Upload */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#495057', display: 'flex', alignItems: 'center' }}>
            📋 Business Certificates
            <span style={{ 
              fontSize: '12px', 
              background: '#28a745', 
              color: 'white', 
              padding: '2px 8px', 
              borderRadius: '12px',
              marginLeft: '10px'
            }}>
              PDF + Images
            </span>
          </h3>
          
          <CloudinaryUpload
            onUploadSuccess={handleDocumentUploadSuccess}
            onUploadError={handleUploadError}
            folder={CLOUDINARY_CONFIG.folders.certificates}
            maxFiles={3}
            acceptedTypes={['pdf', 'jpg', 'jpeg', 'png']}
            multiple={true}
            showPreview={true}
          />
        </div>
      </div>

      {/* Uploaded Images Gallery */}
      {uploadedImages.length > 0 && (
        <div style={{
          marginTop: '40px',
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#495057' }}>
              🖼️ Uploaded Images ({uploadedImages.length})
            </h3>
            <button
              onClick={clearAllUploads}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Clear All
            </button>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '20px' 
          }}>
            {uploadedImages.map((image, index) => (
              <div key={index} style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #e9ecef'
              }}>
                <CloudinaryImage
                  src={image.url}
                  alt={`Uploaded image ${index + 1}`}
                  width={200}
                  height={200}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>
                    <strong>Original:</strong> {image.originalName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>
                    <strong>Size:</strong> {Math.round(image.size / 1024)}KB
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d', wordBreak: 'break-all' }}>
                    <strong>URL:</strong> {image.url.substring(0, 50)}...
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Documents */}
      {uploadedDocuments.length > 0 && (
        <div style={{
          marginTop: '30px',
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>
            📄 Uploaded Documents ({uploadedDocuments.length})
          </h3>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            {uploadedDocuments.map((doc, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '15px',
                background: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '6px',
                  background: doc.mimetype === 'application/pdf' ? '#dc3545' : '#007bff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  marginRight: '15px'
                }}>
                  {doc.mimetype === 'application/pdf' ? 'PDF' : 'IMG'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                    {doc.originalName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {Math.round(doc.size / 1024)}KB • {doc.mimetype}
                  </div>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#007bff',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                >
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features List */}
      <div style={{
        marginTop: '40px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '12px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', textAlign: 'center' }}>
          ✨ Cloudinary Features Implemented
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <h4 style={{ margin: '0 0 10px 0' }}>🚀 Performance</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Automatic format optimization (WebP, AVIF)</li>
              <li>Smart compression and quality</li>
              <li>Responsive image generation</li>
              <li>CDN delivery worldwide</li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ margin: '0 0 10px 0' }}>🔧 Features</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Multiple file upload support</li>
              <li>Real-time upload progress</li>
              <li>Image preview before upload</li>
              <li>File type and size validation</li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ margin: '0 0 10px 0' }}>📁 Organization</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Organized folder structure</li>
              <li>Automatic file naming</li>
              <li>Backup and redundancy</li>
              <li>Easy file management</li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ margin: '0 0 10px 0' }}>🔒 Security</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Secure file upload</li>
              <li>File type validation</li>
              <li>Size limit enforcement</li>
              <li>Access control</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudinaryDemo;