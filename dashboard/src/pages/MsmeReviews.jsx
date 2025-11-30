import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MsmeSidebar from './MsmeSidebar';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../components/NotificationProvider';
import '../css/MsmeReviews.css';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import RateReviewIcon from '@mui/icons-material/RateReview';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { maskCustomerFromObject } from '../utils/nameUtils';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import GridViewIcon from '@mui/icons-material/GridView';

const MsmeReviews = () => {
  const { user, userType, isAuthenticated } = useAuth();
  const { showError, showSuccess } = useNotification();
  const navigate = useNavigate();
  
  const [sidebarState, setSidebarState] = useState({
    isOpen: true,
    isMobile: false,
    isCollapsed: false
  });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [togglingVisibility, setTogglingVisibility] = useState({});
  


  // Fetch store products on component mount (reviews are embedded in products)
  useEffect(() => {
    if (isAuthenticated && userType === 'msme' && user?._id) {
      fetchStoreProducts();
    }
  }, [isAuthenticated, userType, user]);

  // Calculate stats from products with feedback (like ProductDetails does)
  const calculateStatsFromProducts = (products) => {
    let allReviews = [];
    
    // Extract all feedback from all products
    products.forEach(product => {
      if (product.feedback && Array.isArray(product.feedback)) {
        product.feedback.forEach(feedback => {
          allReviews.push({
            ...feedback,
            productId: product._id,
            productName: product.productName
          });
        });
      }
    });
    
    // Calculate overall stats
    const stats = {
      totalReviews: allReviews.length,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
      stats.averageRating = Math.round((totalRating / allReviews.length) * 10) / 10;
      
      // Count rating distribution
      allReviews.forEach(review => {
        if (review.rating >= 1 && review.rating <= 5) {
          stats.ratingDistribution[review.rating]++;
        }
      });
    }

    setStats(stats);
    setReviews(allReviews);
    return allReviews;
  };

  const fetchStoreProducts = async () => {
    setLoadingProducts(true);
    try {
      // Try MongoDB _id first
      let userIdToUse = user._id || user.id;
      
      let response = await fetch(`http://localhost:1337/api/products?msmeId=${userIdToUse}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      let data = await response.json();
      
      // If no products found and we have a different ID to try
      if (data.success && (!data.products || data.products.length === 0) && user._id !== user.id) {
        userIdToUse = user.id;
        const altResponse = await fetch(`http://localhost:1337/api/products?msmeId=${userIdToUse}`);
        if (altResponse.ok) {
          data = await altResponse.json();
        }
      }
      
      if (data.success && data.products) {
        setProducts(data.products);
        
        // Calculate stats from the fetched products with embedded feedback
        calculateStatsFromProducts(data.products);
      } else {
        setProducts([]);
        setStats({
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching store products:', error);
      showError('Failed to load your store products', 'Error');
      setProducts([]);
      setStats({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
      setReviews([]);
    } finally {
      setLoadingProducts(false);
    }
  };



  const handleSidebarToggle = (state) => {
    setSidebarState(state);
  };

  const getContentClass = () => {
    if (sidebarState.isMobile) {
      return 'msme-reviews__content msme-reviews__content--mobile';
    }
    return sidebarState.isOpen 
      ? 'msme-reviews__content msme-reviews__content--sidebar-open' 
      : 'msme-reviews__content msme-reviews__content--sidebar-collapsed';
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index} className="msme-reviews__star">
        {index < rating ? (
          <StarIcon className="msme-reviews__star--filled" />
        ) : (
          <StarBorderIcon className="msme-reviews__star--empty" />
        )}
      </span>
    ));
  };

  const handleViewProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  const getProductImageUrl = (product) => {
    if (!product) return null;
    
    // Handle new multiple images format (like ProductDetails)
    if (product.pictures && product.pictures.length > 0) {
      return `http://localhost:1337/uploads/${product.pictures[0]}`;
    }
    // Fallback to single picture format
    else if (product.picture) {
      return `http://localhost:1337/uploads/${product.picture}`;
    }
    return null;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getRatingPercentage = (rating) => {
    if (stats.totalReviews === 0) return 0;
    return Math.round((stats.ratingDistribution[rating] / stats.totalReviews) * 100);
  };

  const handleProductClick = (product) => {
    // Get reviews from product's embedded feedback array (like ProductDetails does)
    const productReviews = product.feedback ? product.feedback.map((feedback, index) => ({
      _id: feedback._id || `feedback_${product._id}_${index}_${Date.now()}`,
      productId: product._id,
      product: {
        productName: product.productName,
        picture: product.picture,
      },
      customer: feedback.userId ? null : { 
        firstname: feedback.user ? feedback.user.split(' ')[0] : 'Anonymous', 
        lastname: feedback.user ? feedback.user.split(' ').slice(1).join(' ') : '' 
      },
      rating: feedback.rating,
      comment: feedback.comment,
      createdAt: feedback.createdAt || new Date(),
      selectedVariant: feedback.selectedVariant || null,
      selectedSize: feedback.selectedSize || null,
      hidden: feedback.hidden || false, // Include the hidden property
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
    

    
    // Calculate product-specific stats
    const productStats = {
      totalReviews: productReviews.length,
      averageRating: productReviews.length > 0 
        ? Math.round((productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length) * 10) / 10
        : 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    productReviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        productStats.ratingDistribution[review.rating]++;
      }
    });



    setSelectedProduct({
      ...product,
      reviews: productReviews,
      stats: productStats
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const getProductRatingPercentage = (rating, productStats) => {
    if (productStats.totalReviews === 0) return 0;
    return Math.round((productStats.ratingDistribution[rating] / productStats.totalReviews) * 100);
  };

  const handleToggleReviewVisibility = async (reviewId, currentHiddenStatus) => {
    setTogglingVisibility(prev => ({ ...prev, [reviewId]: true }));
    
    try {
      const msmeId = user._id || user.id;
      console.log('Toggling review visibility:', { reviewId, currentHiddenStatus, msmeId, newStatus: !currentHiddenStatus });
      
      const response = await fetch(`http://localhost:1337/api/reviews/${reviewId}/visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          msmeId: msmeId,
          hidden: !currentHiddenStatus, // Toggle the current status
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the review in the selectedProduct state
        setSelectedProduct(prev => ({
          ...prev,
          reviews: prev.reviews.map(review => 
            review._id === reviewId 
              ? { ...review, hidden: data.hidden }
              : review
          )
        }));

        // Refresh the products data to get updated stats
        await fetchStoreProducts();
        
        showSuccess(
          `Review ${data.hidden ? 'hidden' : 'shown'} successfully`,
          'Review Updated'
        );
      } else {
        showError(data.error || 'Failed to update review visibility', 'Error');
      }
    } catch (error) {
      console.error('Error toggling review visibility:', error);
      showError('Failed to update review visibility', 'Error');
    } finally {
      setTogglingVisibility(prev => ({ ...prev, [reviewId]: false }));
    }
  };



  // Show login message if not authenticated
  if (!isAuthenticated || userType !== 'msme') {
    return (
      <div className="msme-reviews">
        <MsmeSidebar onSidebarToggle={handleSidebarToggle} />
        <div className={getContentClass()}>
          <div className="msme-reviews__container">
            <div className="msme-reviews__auth-message">
              <h2>Please log in as an MSME to view your store reviews</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="msme-reviews">
      <MsmeSidebar onSidebarToggle={handleSidebarToggle} />
      <div className={getContentClass()}>
        <div className="msme-reviews__header">
          <div className="msme-reviews__header-content">
            <div className="msme-reviews__header-text">
              <h1>Review's and Ratings</h1>
              <p>Click on any product to view its reviews and ratings</p>
            </div>
          </div>
        </div>

        {/* Products Gallery Section */}
        <div className="msme-reviews__products-section">
          
          {loadingProducts ? (
            <div className="msme-reviews__loading">
              <p>Loading your products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="msme-reviews__empty">
              <GridViewIcon className="msme-reviews__empty-icon" />
              <h3>No products found</h3>
              <p>You haven't added any products yet. Add products to see their reviews here.</p>
            </div>
          ) : (
            <div className="msme-reviews__products-grid">
              {products.map((product, index) => {

                
                // Calculate average rating from feedback
                const feedbackRatings = product.feedback || [];
                const avgRating = feedbackRatings.length > 0 
                  ? feedbackRatings.reduce((sum, fb) => sum + fb.rating, 0) / feedbackRatings.length
                  : 0;
                
                return (
                  <div 
                    key={product._id || `product-${index}`} 
                    className="msme-reviews__product-card"
                  >
                    {/* Product Image */}
                    <div className="msme-reviews__product-image-container">
                      {getProductImageUrl(product) ? (
                        <img 
                          src={getProductImageUrl(product)} 
                          alt={product.productName || 'Product'}
                          className="msme-reviews__product-card-img"
                        />
                      ) : (
                        <div className="msme-reviews__product-image-placeholder">No Image</div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="msme-reviews__product-card-content">
                      <h4 className="msme-reviews__product-card-name">{product.productName || 'Unnamed Product'}</h4>
                      <p className="msme-reviews__product-card-store">{user?.businessName || 'Your Store'}</p>
                      
                      {/* Rating Stars */}
                      <div className="msme-reviews__product-card-rating">
                        <div className="msme-reviews__product-card-stars">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span 
                              key={star} 
                              className={`msme-reviews__product-card-star ${star <= Math.round(avgRating) ? 'filled' : ''}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="msme-reviews__product-card-rating-text">
                          ({avgRating > 0 ? avgRating.toFixed(1) : '0.0'})
                        </span>
                      </div>

                      {/* Product Description */}
                      <p className="msme-reviews__product-card-description">
                        {product.description}
                      </p>

                      {/* Category Tag */}
                      {product.category && (
                        <div className="msme-reviews__product-card-category">
                          {product.category.toUpperCase()}
                        </div>
                      )}

                      {/* View Product Button */}
                      <button 
                        className="msme-reviews__product-card-button"
                        onClick={() => handleProductClick(product)}
                      >
                        View Product Reviews & Rating
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>


      </div>

      {/* Product Review Modal */}
      {isModalOpen && selectedProduct && (
        <div className="msme-reviews__modal-overlay" onClick={closeModal}>
          <div className="msme-reviews__modal" onClick={(e) => e.stopPropagation()}>
            <div className="msme-reviews__modal-header">
              <h2>{selectedProduct.productName}</h2>
              <button className="msme-reviews__modal-close" onClick={closeModal}>
                <CloseIcon />
              </button>
            </div>
            
            <div className="msme-reviews__modal-content">
              <div className="msme-reviews__modal-product-info">
                <div className="msme-reviews__modal-image">
                  {getProductImageUrl(selectedProduct) ? (
                    <img 
                      src={getProductImageUrl(selectedProduct)} 
                      alt={selectedProduct.productName || 'Product'}
                      className="msme-reviews__modal-img"
                    />
                  ) : (
                    <div className="msme-reviews__modal-image-placeholder">No Image</div>
                  )}
                </div>
                
                <div className="msme-reviews__modal-details">
                  <h3>{selectedProduct.productName}</h3>
                  <p className="msme-reviews__modal-description">{selectedProduct.description}</p>
                  <p className="msme-reviews__modal-price">₱{selectedProduct.price}</p>
                  <p className="msme-reviews__modal-availability">
                    Status: {selectedProduct.availability === true ? 'Available' : selectedProduct.availability === false ? 'Unavailable' : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Product-specific Stats */}
              <div className="msme-reviews__modal-stats">
                <div className="msme-reviews__modal-rating-summary">
                  <div className="msme-reviews__modal-overall-rating">
                    <div className="msme-reviews__modal-rating-number">{selectedProduct.stats.averageRating}</div>
                    <div className="msme-reviews__modal-rating-stars">
                      {renderStars(Math.round(selectedProduct.stats.averageRating))}
                    </div>
                    <div className="msme-reviews__modal-rating-count">
                      {selectedProduct.stats.totalReviews} review{selectedProduct.stats.totalReviews !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className="msme-reviews__modal-rating-breakdown">
                    {[5, 4, 3, 2, 1].map(rating => (
                      <div key={rating} className="msme-reviews__modal-rating-row">
                        <span className="msme-reviews__modal-rating-label">{rating} star</span>
                        <div className="msme-reviews__modal-rating-bar">
                          <div 
                            className="msme-reviews__modal-rating-fill" 
                            style={{ width: `${getProductRatingPercentage(rating, selectedProduct.stats)}%` }}
                          ></div>
                        </div>
                        <span className="msme-reviews__modal-rating-percentage">
                          {getProductRatingPercentage(rating, selectedProduct.stats)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Reviews */}
              <div className="msme-reviews__modal-reviews">
                <h3>Customer Reviews</h3>
                {selectedProduct.reviews.length === 0 ? (
                  <div className="msme-reviews__modal-no-reviews">
                    <RateReviewIcon className="msme-reviews__empty-icon" />
                    <p>No reviews for this product yet.</p>
                  </div>
                ) : (
                  <div className="msme-reviews__modal-reviews-list">
                    {selectedProduct.reviews.map((review) => (
                      <div key={review._id} className={`msme-reviews__modal-review-card ${review.hidden ? 'msme-reviews__modal-review-card--hidden' : ''}`}>
                        <div className="msme-reviews__modal-review-header">
                          <div className="msme-reviews__modal-customer-info">
                            <div className="msme-reviews__modal-customer-avatar">
                              <PersonIcon />
                            </div>
                            <div className="msme-reviews__modal-customer-details">
                              <h4 className="msme-reviews__modal-customer-name">
                                {/* Customer names are masked for privacy protection */}
                                {review.customer?.firstname && review.customer?.lastname 
                                  ? (review.customer.maskedName || maskCustomerFromObject(review.customer))
                                  : 'Anonymous Customer'
                                }
                                {review.hidden && (
                                  <span className="msme-reviews__hidden-indicator">(Hidden from customers)</span>
                                )}
                              </h4>
                              <div className="msme-reviews__modal-review-rating">
                                {renderStars(review.rating)}
                              </div>
                            </div>
                          </div>
                          <div className="msme-reviews__modal-review-actions">
                            <div className="msme-reviews__modal-review-date">
                              {formatDate(review.createdAt)}
                            </div>
                            <button
                              className={`msme-reviews__visibility-button ${review.hidden ? 'msme-reviews__visibility-button--hidden' : 'msme-reviews__visibility-button--visible'}`}
                              onClick={() => handleToggleReviewVisibility(review._id, review.hidden)}
                              disabled={togglingVisibility[review._id]}
                              title={review.hidden ? 'Show this review to customers' : 'Hide this review from customers'}
                            >
                              {togglingVisibility[review._id] ? (
                                <span className="msme-reviews__loading-spinner">⏳</span>
                              ) : review.hidden ? (
                                <VisibilityIcon />
                              ) : (
                                <VisibilityOffIcon />
                              )}
                              <span className="msme-reviews__visibility-text">
                                {review.hidden ? 'Show' : 'Hide'}
                              </span>
                            </button>
                          </div>
                        </div>
                        
                        {/* Display variant and size information */}
                        {(review.selectedVariant || review.selectedSize) && (
                          <div className="msme-reviews__modal-review-selection">
                            {review.selectedVariant && (
                              <span className="msme-reviews__modal-variant-badge">
                                <strong>Variant:</strong> {review.selectedVariant.name}
                              </span>
                            )}
                            {review.selectedSize && (
                              <span className="msme-reviews__modal-size-badge">
                                <strong>Size:</strong> {review.selectedSize.size} {review.selectedSize.unit}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="msme-reviews__modal-review-content">
                          <p>"{review.comment}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MsmeReviews;
