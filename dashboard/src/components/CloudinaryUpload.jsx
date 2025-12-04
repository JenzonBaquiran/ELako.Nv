import React, { useState, useRef } from 'react';
import { uploadToCloudinary, CLOUDINARY_CONFIG } from '../utils/cloudinary';

const CloudinaryUpload = ({ 
  onUploadSuccess, 
  onUploadError, 
  folder = 'elako/general',
  maxFiles = 1,
  acceptedTypes = CLOUDINARY_CONFIG.allowedFormats,
  maxFileSize = CLOUDINARY_CONFIG.maxFileSize,
  disabled = false,
  className = '',
  children,
  multiple = false,
  showPreview = true
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    // Validate file count
    if (files.length > maxFiles) {
      onUploadError?.(new Error(`Maximum ${maxFiles} files allowed`));
      return;
    }
    
    // Validate file types and sizes
    for (let file of files) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!acceptedTypes.includes(fileExtension)) {
        onUploadError?.(new Error(`File type .${fileExtension} is not allowed`));
        return;
      }
      
      if (file.size > maxFileSize) {
        onUploadError?.(new Error(`File ${file.name} is too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB`));
        return;
      }
    }

    // Generate previews for images
    if (showPreview) {
      const newPreviews = [];
      for (let file of files) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            newPreviews.push({
              id: Date.now() + Math.random(),
              file,
              preview: e.target.result,
              name: file.name
            });
            if (newPreviews.length === files.filter(f => f.type.startsWith('image/')).length) {
              setPreviews(prev => [...prev, ...newPreviews]);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }

    // Upload files
    setUploading(true);
    const uploadResults = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = `${Date.now()}-${i}`;
        
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: 0
        }));
        
        try {
          const result = await uploadToCloudinary(file, folder);
          
          if (result.success) {
            uploadResults.push(result);
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: 100
            }));
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } catch (error) {
          console.error(`Upload failed for ${file.name}:`, error);
          onUploadError?.(error);
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
        }
      }
      
      if (uploadResults.length > 0) {
        onUploadSuccess?.(multiple ? uploadResults : uploadResults[0]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error);
    } finally {
      setUploading(false);
      setUploadProgress({});
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove preview
  const removePreview = (previewId) => {
    setPreviews(prev => prev.filter(p => p.id !== previewId));
  };

  // Clear all previews
  const clearPreviews = () => {
    setPreviews([]);
  };

  return (
    <div className={`cloudinary-upload ${className}`}>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes.map(type => `.${type}`).join(',')}
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        style={{ display: 'none' }}
      />
      
      {/* Upload Trigger */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="upload-trigger"
        style={{
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1
        }}
      >
        {children || (
          <div className="default-upload-area" style={{
            border: '2px dashed #ccc',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: uploading ? '#f9f9f9' : '#fafafa',
            transition: 'all 0.3s ease'
          }}>
            {uploading ? (
              <div>
                <span>Uploading...</span>
                <div style={{ marginTop: '10px' }}>
                  {Object.keys(uploadProgress).map(fileId => (
                    <div key={fileId} style={{ marginBottom: '5px' }}>
                      <div style={{
                        width: '100%',
                        height: '4px',
                        backgroundColor: '#eee',
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${uploadProgress[fileId]}%`,
                          height: '100%',
                          backgroundColor: '#4caf50',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <span>📁 Click to upload files</span>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  Max {maxFiles} files, {Math.round(maxFileSize / 1024 / 1024)}MB each
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Preview Area */}
      {showPreview && previews.length > 0 && (
        <div className="upload-previews" style={{ marginTop: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              Previews ({previews.length})
            </span>
            <button 
              type="button"
              onClick={clearPreviews}
              style={{
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear All
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
            {previews.map(preview => (
              <div key={preview.id} style={{ position: 'relative' }}>
                <img
                  src={preview.preview}
                  alt={preview.name}
                  style={{
                    width: '100%',
                    height: '100px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
                <button
                  type="button"
                  onClick={() => removePreview(preview.id)}
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
                <div style={{
                  fontSize: '10px',
                  color: '#666',
                  textAlign: 'center',
                  marginTop: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {preview.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudinaryUpload;