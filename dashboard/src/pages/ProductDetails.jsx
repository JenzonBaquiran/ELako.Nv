import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../components/NotificationProvider';
import Header from './Navbar';
import FavoriteButton from '../components/FavoriteButton';
import CloudinaryImage from '../components/CloudinaryImage';
import { isCloudinaryUrl } from '../utils/cloudinary';
import '../css/ProductDetails.css';

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user, userType, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Image gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  // Feedback form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Photo upload state
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  // Scroll to top when component mounts or productId changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productId]);

  // Helper function to get all available images
  const getAllImages = () => {
    if (!product) return [];
    
    let images = [];
    
    // Add images from pictures array (new multiple image system)
    if (product.pictures && product.pictures.length > 0) {
      images = product.pictures.map(pic => {
        // If it's already a Cloudinary URL, use it directly
        if (isCloudinaryUrl(pic)) {
          console.log('Using Cloudinary URL:', pic);
          return pic;
        }
        // Otherwise, assume it's a local upload and prepend the server URL
        const localUrl = `http://localhost:1337/uploads/${pic}`;
        console.log('Using local URL:', localUrl);
        return localUrl;
      });
    } 
    // Fallback to single picture (backward compatibility)
    else if (product.picture) {
      const picUrl = isCloudinaryUrl(product.picture) 
        ? product.picture 
        : `http://localhost:1337/uploads/${product.picture}`;
      console.log('Using fallback picture URL:', picUrl);
      images = [picUrl];
    }
    
    console.log('Final images array:', images);
    return images;
  };

  // Handle variant selection
  const handleVariantSelection = (variant) => {
    setSelectedVariant(variant);
    
    // If variant has specific image index, switch to that image
    if (variant.imageIndex !== undefined && variant.imageIndex >= 0) {
      const images = getAllImages();
      if (variant.imageIndex < images.length) {
        setSelectedImageIndex(variant.imageIndex);
      }
    }
  };

  const fetchProductDetails = async () => {
    try {
      const response = await fetch(`http://localhost:1337/api/products/${productId}`);
      const data = await response.json();
      if (data.success) {
        setProduct(data.product);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  // Handle chat with store functionality
  const handleChatWithStore = async () => {
    if (!isAuthenticated || userType !== 'customer') {
      showError('Please log in as a customer to chat with stores', 'Login Required');
      return;
    }

    if (!user) {
      showError('User information not available', 'Error');
      return;
    }

    if (!product?.msmeId?._id) {
      showError('Store information not available', 'Error');
      return;
    }

    // Get the main product image
    const productImages = getAllImages();
    const mainImage = productImages.length > 0 ? productImages[0].replace('http://localhost:1337/uploads/', '') : (product.picture || '');

    console.log('✅ Starting conversation with store from product page:', {
      storeId: product.msmeId._id,
      storeName: product.msmeId.businessName,
      customerId: user._id || user.id,
      productName: product.productName,
      productImage: mainImage
    });

    // Show success message
    showSuccess(`Starting conversation with ${product.msmeId.businessName || 'store'}...`, 'Chat');

    // Navigate to customer messages with store ID and product context
    navigate(`/customer-message/${product.msmeId._id}?productId=${product._id}&productName=${encodeURIComponent(product.productName)}&productDescription=${encodeURIComponent(product.description || '')}&productImage=${encodeURIComponent(mainImage)}&productPrice=${product.price}`);
  };

  // Handle photo selection for feedback
  const handlePhotoSelection = (e) => {
    const files = Array.from(e.target.files);
    
    // Reset input if no files selected
    if (files.length === 0) {
      return;
    }
    
    // Limit to 5 photos max
    if (files.length > 5) {
      showError('You can upload a maximum of 5 photos', 'Upload Limit');
      e.target.value = ''; // Reset file input
      return;
    }

    // Define allowed image types
    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/svg+xml'
    ];

    // Validate file types and sizes
    const validFiles = [];
    const previews = [];
    let hasInvalidFiles = false;
    
    for (let file of files) {
      // Check if file type is an image
      if (!file.type.startsWith('image/')) {
        showError(`"${file.name}" is not an image file. Only image files are allowed.`, 'Invalid File Type');
        hasInvalidFiles = true;
        continue;
      }
      
      // Check specific image type
      if (!allowedImageTypes.includes(file.type.toLowerCase())) {
        showError(`"${file.name}" has unsupported format. Supported formats: JPEG, PNG, GIF, WebP, BMP, SVG`, 'Unsupported Format');
        hasInvalidFiles = true;
        continue;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showError(`"${file.name}" is too large. Each photo must be under 5MB`, 'File Too Large');
        hasInvalidFiles = true;
        continue;
      }
      
      // Check for minimum file size (1KB to avoid empty files)
      if (file.size < 1024) {
        showError(`"${file.name}" is too small. Please select a valid image file`, 'File Too Small');
        hasInvalidFiles = true;
        continue;
      }
      
      validFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        previews.push(e.target.result);
        if (previews.length === validFiles.length) {
          setPhotoPreviews([...previews]);
        }
      };
      reader.readAsDataURL(file);
    }
    
    // If there were invalid files, reset the input
    if (hasInvalidFiles && validFiles.length === 0) {
      e.target.value = '';
      return;
    }
    
    setSelectedPhotos(validFiles);
  };

  // Remove a selected photo
  const removePhoto = (index) => {
    const newPhotos = selectedPhotos.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    setSelectedPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
  };

  if (loading) {
    return <div className="product-details-container"><Header /><div className="loading-state">Loading...</div></div>;
  }
  if (error || !product) {
    return <div className="product-details-container"><Header /><div className="error-state">{error || 'Product not found'}</div></div>;
  }

  return (
    <div className="product-details-container">
      <Header />
      
      <div className="product-details-content">
        <button className="product-details-back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        
        {/* Main Product Card - Image and Details */}
        <div className="product-details-main-card">
          <div className="product-details-image-section">
            {/* Main Image Display */}
            <div className="product-details-main-image-container">
              <img
                src={getAllImages()[selectedImageIndex] || (product.picture ? (isCloudinaryUrl(product.picture) ? product.picture : `http://localhost:1337/uploads/${product.picture}`) : '')} 
                alt={product.productName} 
                className="product-details-image"
                onError={(e) => {
                  console.log('Image failed to load:', e.target.src);
                  e.target.src = '/placeholder-image.jpg';
                }}
                onLoad={(e) => {
                  console.log('Image loaded successfully:', e.target.src);
                }}
              />
              
              {/* Image Counter */}
              {getAllImages().length > 1 && (
                <div className="product-details-image-counter">
                  {selectedImageIndex + 1} / {getAllImages().length}
                </div>
              )}
              
              {/* Image Navigation Arrows */}
              {getAllImages().length > 1 && (
                <>
                  <button 
                    className="product-details-image-nav prev"
                    onClick={() => setSelectedImageIndex(prev => 
                      prev > 0 ? prev - 1 : getAllImages().length - 1
                    )}
                  >
                    ‹
                  </button>
                  <button 
                    className="product-details-image-nav next"
                    onClick={() => setSelectedImageIndex(prev => 
                      prev < getAllImages().length - 1 ? prev + 1 : 0
                    )}
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            
            {/* Image Thumbnails */}
            {getAllImages().length > 1 && (
              <div className="product-details-thumbnails">
                {getAllImages().map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.productName} ${index + 1}`}
                    className={`product-details-thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                    onClick={() => setSelectedImageIndex(index)}
                    onError={(e) => {
                      console.log('Thumbnail failed to load:', e.target.src);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          
          <div className="product-details-info-section">
            <div className="product-details-header">
              <h1 className="product-details-title">{product.productName}</h1>
              {/* Inline favorite button for desktop */}
              {isAuthenticated && userType === 'customer' && (
                <FavoriteButton
                  productId={productId}
                  productName={product.productName}
                  className="product-details-favorite-inline"
                  size="large"
                  variant="inline"
                />
              )}
            </div>
            
            {/* Artist Name - Only show for artworks */}
            {product.artistName && (
              <div className="product-details-artist">
                <span className="product-details-artist-label">Artist: </span>
                <span className="product-details-artist-name">{product.artistName}</span>
              </div>
            )}
            
            <p className="product-details-description">{product.description}</p>
            
            <div className="product-details-price">
              ₱{selectedVariant?.price || selectedSize?.price || product.price}
              {selectedVariant && (
                <span className="product-details-price-note">
                  {selectedVariant.name} variant
                </span>
              )}
              {!selectedVariant && selectedSize && (
                <span className="product-details-price-note">
                  {selectedSize.size} {selectedSize.unit}
                </span>
              )}
            </div>
            
            <div className="product-details-meta">
              <span className="product-details-availability-status">
                {product.availability ? '✓ Available' : '✗ Unavailable'}
              </span>
              <span className="product-details-category">Category: {product.category || 'N/A'}</span>
            </div>
            
            {/* Product Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="product-details-variants">
                <h4>Available Variants:</h4>
                <div className="product-details-variants-list">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      className={`product-details-variant-btn ${selectedVariant?.id === variant.id ? 'selected' : ''}`}
                      onClick={() => handleVariantSelection(variant)}
                    >
                      <span className="variant-name">{variant.name}</span>
                      {variant.price && <span className="variant-price">₱{variant.price}</span>}
                    </button>
                  ))}
                </div>
                {selectedVariant && (
                  <div className="product-details-selected-variant">
                    Selected: <strong>{selectedVariant.name}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Size Options */}
            {product.sizeOptions && product.sizeOptions.length > 0 && (
              <div className="product-details-sizes">
                <h4>Available Sizes:</h4>
                <div className="product-details-sizes-list">
                  {product.sizeOptions.map((size) => (
                    <button
                      key={size.id}
                      className={`product-details-size-btn ${selectedSize?.id === size.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      <span className="size-name">{size.size} {size.unit}</span>
                      {size.price !== undefined && <span className="size-price">₱{size.price}</span>}
                    </button>
                  ))}
                </div>
                {selectedSize && (
                  <div className="product-details-selected-size">
                    Selected Size: <strong>{selectedSize.size} {selectedSize.unit}</strong>
                    {selectedSize.price !== undefined && <span> - ₱{selectedSize.price}</span>}
                  </div>
                )}
              </div>
            )}
            
            <div className="product-details-rating">
              <span className="product-details-rating-stars">
                {product.rating ? (
                  '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating))
                ) : '☆☆☆☆☆'}
              </span>
              <span className="product-details-rating-text">
                {product.rating ? product.rating.toFixed(1) : 'No rating yet'}
              </span>
            </div>

            {/* Store Information */}
            {product.msmeId && (
              <div className="product-details-store-info">
                <h4>From Store</h4>
                <div className="product-details-store-card">
                  <div className="product-details-store-details">
                    <div className="product-details-store-name">
                      {product.msmeId.businessName || 'Store Name'}
                    </div>
                    <div className="product-details-store-category">
                      {product.msmeId.category === 'artisan' ? '🎨 Artist' : '🍽️ Food Store'}
                    </div>
                    {product.msmeId.averageRating > 0 && (
                      <div className="product-details-store-rating">
                        ★ {product.msmeId.averageRating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div className="product-details-store-actions">
                    <button 
                      className="product-details-view-store-btn"
                      onClick={() => navigate(`/store/${product.msmeId._id}`)}
                    >
                      View Store
                    </button>
                    {isAuthenticated && userType === 'customer' && (
                      <button 
                        className="product-details-chat-btn"
                        onClick={handleChatWithStore}
                      >
                        Chat with Store
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="product-details-reviews-section">
          <h3>Customer Reviews</h3>
          {(product.feedback && Array.isArray(product.feedback) && product.feedback.filter(fb => !fb.hidden).length > 0) ? (
            <div className="product-details-reviews-list">
              {product.feedback.filter(fb => !fb.hidden).map((fb, idx) => (
                <div key={idx} className="product-details-feedback-item">
                  <div className="product-details-feedback-header">
                    <div className="product-details-feedback-avatar">
                      {/* Customer names are masked on server-side for privacy */}
                      {fb.user.charAt(0).toUpperCase()}
                    </div>
                    <div className="product-details-feedback-content">
                      <div className="product-details-feedback-user-info">
                        {/* Customer names are masked on server-side for privacy (e.g., "N**o*a") */}
                        <strong className="product-details-feedback-user">{fb.user}</strong>
                        <span className="product-details-feedback-date">
                          {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : ''}
                        </span>
                      </div>
                      <div className="product-details-feedback-rating">
                        {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Display variant and size information */}
                  {(fb.selectedVariant || fb.selectedSize) && (
                    <div className="product-details-feedback-selection">
                      {fb.selectedVariant && (
                        <span className="product-details-feedback-variant">
                          <strong>Variant:</strong> {fb.selectedVariant.name}
                        </span>
                      )}
                      {fb.selectedSize && (
                        <span className="product-details-feedback-size">
                          <strong>Size:</strong> {fb.selectedSize.size} {fb.selectedSize.unit}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <p className="product-details-feedback-comment">"{fb.comment}"</p>
                  
                  {/* Display feedback photos */}
                  {fb.photos && fb.photos.length > 0 && (
                    <div className="product-details-feedback-photos">
                      {fb.photos.map((photo, photoIdx) => (
                        <img
                          key={photoIdx}
                          src={`http://localhost:1337/uploads/feedback-photos/${photo}`}
                          alt={`Feedback photo ${photoIdx + 1}`}
                          className="product-details-feedback-photo"
                          onClick={(e) => {
                            // Simple image preview on click
                            const img = new Image();
                            img.src = e.target.src;
                            const newWindow = window.open();
                            newWindow.document.write(`<img src="${img.src}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />`);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="product-details-no-feedback">No reviews yet. Be the first to leave a review!</p>
          )}
        </div>

        {/* Rate Product Section */}
        <div className="product-details-rate-section">
          <h3>Rate this Product</h3>
          
          {!isAuthenticated || userType !== 'customer' ? (
            <div className="product-details-auth-message">
              <p>Please log in as a customer to leave a review.</p>
            </div>
          ) : (
            <>
              {/* Variant Selection for Review (if product has variants) */}
              {product.variants && product.variants.length > 0 && (
                <div className="product-details-review-variant-selection">
                  <h4>Select Variant to Review (Optional):</h4>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                    You can select a specific variant or leave unselected for general product feedback.
                  </p>
                  <div className="product-details-review-variants-list">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        className={`product-details-review-variant-btn ${selectedVariant?.id === variant.id ? 'selected' : ''}`}
                        onClick={() => setSelectedVariant(selectedVariant?.id === variant.id ? null : variant)}
                      >
                        {variant.name}
                      </button>
                    ))}
                  </div>
                  {selectedVariant && (
                    <div className="product-details-selected-variant-review">
                      Selected: <strong>{selectedVariant.name}</strong>
                      <button 
                        onClick={() => setSelectedVariant(null)}
                        style={{ marginLeft: '10px', fontSize: '12px', padding: '2px 8px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Size Selection for Review (if product has sizes) */}
              {product.sizeOptions && product.sizeOptions.length > 0 && (
                <div className="product-details-review-size-selection">
                  <h4>Select Size to Review (Optional):</h4>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                    You can select a specific size or leave unselected for general product feedback.
                  </p>
                  <div className="product-details-review-sizes-list">
                    {product.sizeOptions.map((size) => (
                      <button
                        key={size.id}
                        className={`product-details-review-size-btn ${selectedSize?.id === size.id ? 'selected' : ''}`}
                        onClick={() => setSelectedSize(selectedSize?.id === size.id ? null : size)}
                      >
                        {size.size} {size.unit}
                      </button>
                    ))}
                  </div>
                  {selectedSize && (
                    <div className="product-details-selected-size-review">
                      Selected: <strong>{selectedSize.size} {selectedSize.unit}</strong>
                      <button 
                        onClick={() => setSelectedSize(null)}
                        style={{ marginLeft: '10px', fontSize: '12px', padding: '2px 8px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="product-details-rating-input">
                {[1,2,3,4,5].map(star => (
                  <span
                    key={star}
                    className={`product-details-star ${(hoverRating || rating) >= star ? 'active' : ''}`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >★</span>
                ))}
                {rating > 0 && <span className="product-details-rating-label">{rating} Star{rating > 1 ? 's' : ''}</span>}
              </div>
              
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={4}
                placeholder="Write your feedback..."
                className="product-details-feedback-textarea"
                disabled={submitting}
              />
              
              {/* Photo Upload Section */}
              <div className="product-details-photo-upload">
                <label className="product-details-photo-label">
                  Add Photos (Optional - Up to 5 photos):
                </label>
                <div className="product-details-photo-help">
                  Supported formats: JPEG, PNG, GIF, WebP, BMP, SVG • Max 5MB each • Up to 5 photos
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml"
                  onChange={handlePhotoSelection}
                  className="product-details-photo-input"
                  disabled={submitting}
                  title="Select up to 5 image files (JPEG, PNG, GIF, WebP, BMP, SVG) - Max 5MB each"
                />
                
                {/* Photo Previews */}
                {photoPreviews.length > 0 && (
                  <div className="product-details-photo-previews">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="product-details-photo-preview">
                        <img src={preview} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="product-details-photo-remove"
                          disabled={submitting}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={async () => {
                  // Validation: Check if variant is required but not selected
                  // Only enforce variant selection if it's explicitly required by the product configuration
                  if (product.variants && product.variants.length > 0 && !selectedVariant) {
                    // Allow feedback without variant selection, but show a warning
                    const confirmSubmit = window.confirm(
                      'This product has variants available. Are you sure you want to submit feedback without selecting a specific variant? Your feedback will apply to the product in general.'
                    );
                    if (!confirmSubmit) {
                      return;
                    }
                  }

                  setSubmitting(true);
                  setSubmitError(null);
                  setSubmitSuccess(false);
                  
                  try {
                    const userName = `${user.firstname} ${user.lastname}`.trim();
                    const userId = user.id || user._id;
                    
                    // Create FormData for file upload
                    const formData = new FormData();
                    formData.append('rating', rating);
                    formData.append('comment', comment);
                    formData.append('user', userName);
                    formData.append('userId', userId);
                    
                    if (selectedVariant) {
                      formData.append('selectedVariant', JSON.stringify(selectedVariant));
                    }
                    if (selectedSize) {
                      formData.append('selectedSize', JSON.stringify(selectedSize));
                    }
                    
                    // Add photos to FormData
                    selectedPhotos.forEach(photo => {
                      formData.append('photos', photo);
                    });
                    
                    console.log('Submitting feedback with photos:', selectedPhotos.length);
                    console.log('Product ID:', productId);
                    
                    const res = await fetch(`http://localhost:1337/api/products/${productId}/feedback`, {
                      method: 'POST',
                      body: formData // No Content-Type header needed for FormData
                    });
                    
                    console.log('Response status:', res.status);
                    console.log('Response status text:', res.statusText);
                    
                    const data = await res.json();
                    console.log('Response data:', data);
                    
                    if (data.success) {
                      // Re-fetch product data to get updated rating and feedback
                      await fetchProductDetails();
                      
                      // Reset form
                      setRating(0);
                      setComment("");
                      setSelectedVariant(null);
                      setSelectedSize(null);
                      setSelectedPhotos([]);
                      setPhotoPreviews([]);
                      setSubmitSuccess(true);
                      
                      // Hide success message after 3 seconds
                      setTimeout(() => setSubmitSuccess(false), 3000);
                      
                    } else {
                      setSubmitError(data.error || 'Failed to submit feedback');
                    }
                  } catch (err) {
                    console.error('Error submitting feedback:', err);
                    setSubmitError('Failed to submit feedback. Please try again.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={submitting || rating === 0 || comment.trim() === ""}
                className="product-details-submit-button"
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
              
              {submitError && <div className="product-details-error-message">{submitError}</div>}
              {submitSuccess && <div className="product-details-success-message">Feedback submitted successfully!</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
