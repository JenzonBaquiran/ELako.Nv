import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Navbar';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../components/NotificationProvider';
import FollowButton from '../components/FollowButton';
import '../css/CustomerStoreView.css';
import defaultStoreImg from '../assets/PAINTINGS.png';
import foodStoreImg from '../assets/shakshouka.jpg';
import doleLogo from '../pictures/DOLE.png';
import dostLogo from '../pictures/DOST.png';
import fdaLogo from '../pictures/FDA.png';
import dtiLogo from '../pictures/DTI.png';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhoneIcon from '@mui/icons-material/Phone';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';

import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ChatIcon from '@mui/icons-material/Chat';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import { processGoogleMapsInput } from '../utils/googleMapsProcessor';


// Helper function to handle embedded Google Maps URLs
const handleEmbedUrl = (url) => {
  if (!url) return null;

  console.log('Processing embed URL:', url);

  // Use the new processing utility for consistency
  const processResult = processGoogleMapsInput(url);
  
  if (processResult.isValid) {
    console.log('URL processed successfully:', processResult.url);
    return processResult.url;
  }

  // For invalid URLs, let them know they need to use embed format
  console.warn('URL is not in valid embed format. MSME owner should use embedded Google Maps URL.');
  return null;
};

const CustomerStoreView = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user, userType } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Helper function to generate proper URLs for images
  const getImageUrl = (imageValue) => {
    if (!imageValue) return null;
    
    // If it's already a full URL (Cloudinary or other), use it directly
    if (imageValue.startsWith('http')) {
      return imageValue;
    }
    
    // If it contains folder structure like 'elako/products/...', it's a Cloudinary public ID
    if (imageValue.includes('/') && !imageValue.startsWith('uploads/')) {
      return `https://res.cloudinary.com/dk9umulxw/image/upload/${imageValue}`;
    }
    
    // Otherwise, it's a legacy local file
    return `http://localhost:1337/uploads/${imageValue}`;
  };

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [blogPosts, setBlogPosts] = useState([]);
  const [selectedBlogPost, setSelectedBlogPost] = useState(null);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [currentBlogSlide, setCurrentBlogSlide] = useState(0);
  const [blogPostsLoading, setBlogPostsLoading] = useState(true);

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [hasExistingRating, setHasExistingRating] = useState(false);
  const [loadingExistingRating, setLoadingExistingRating] = useState(false);

  // Top rated products state
  const [topRatedProducts, setTopRatedProducts] = useState([]);

  // Product feedbacks state
  const [productFeedbacks, setProductFeedbacks] = useState([]);

  useEffect(() => {
    console.log('🔄 Component mounted/updated with storeId:', storeId);
    if (storeId) {
      console.log('🚀 Starting data fetch for store:', storeId);
      fetchStoreDetails();
      fetchStoreProducts();
      fetchTopRatedProducts();
      fetchProductFeedbacks();
      fetchBlogPosts();
      // Scroll to top when component mounts or storeId changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      console.log('❌ No storeId provided');
    }
  }, [storeId]);

  // Auto-slide functionality like BlogHero
  useEffect(() => {
    if (blogPosts.length > 1) {
      const timer = setInterval(() => {
        setCurrentBlogSlide((prevSlide) => (prevSlide + 1) % blogPosts.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(timer);
    }
  }, [blogPosts.length]);

  const fetchStoreDetails = async () => {
    try {
      const response = await fetch(`http://localhost:1337/api/stores/${storeId}`);
      const data = await response.json();

      if (data.success) {
        setStore(data.store);
      } else {
        showError("Store not found", "Error");
        navigate('/customer/stores');
      }
    } catch (error) {
      console.error("Error fetching store details:", error);
      showError("Failed to load store details", "Error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreProducts = async () => {
    try {
      const response = await fetch(`http://localhost:1337/api/msme/${storeId}/products`);
      const data = await response.json();

      if (data.success) {
        // Only show visible products to customers
        const visibleProducts = data.products.filter(product => product.visible === true);
        setProducts(visibleProducts);
      }
    } catch (error) {
      console.error("Error fetching store products:", error);
    }
  };

  const fetchTopRatedProducts = async () => {
    try {
      const response = await fetch(`http://localhost:1337/api/msme/${storeId}/products/top-rated`);
      const data = await response.json();

      if (data.success) {
        setTopRatedProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching top rated products:", error);
    }
  };

  const fetchProductFeedbacks = async () => {
    try {
      const response = await fetch(`http://localhost:1337/api/msme/${storeId}/products/feedbacks`);
      const data = await response.json();

      if (data.success) {
        console.log('Received feedbacks:', data.feedbacks);
        setProductFeedbacks(data.feedbacks || []);
      }
    } catch (error) {
      console.error("Error fetching product feedbacks:", error);
    }
  };

  const fetchExistingRating = async () => {
    if (!user) return;

    setLoadingExistingRating(true);
    try {
      const userId = user.id || user._id;
      const response = await fetch(`http://localhost:1337/api/stores/${storeId}/rating/${userId}`);
      const data = await response.json();

      if (data.success) {
        if (data.hasRated) {
          setRating(data.rating);
          setHasExistingRating(true);
        } else {
          setRating(0);
          setHasExistingRating(false);
        }
      }
    } catch (error) {
      console.error('Error fetching existing rating:', error);
    } finally {
      setLoadingExistingRating(false);
    }
  };

  const fetchBlogPosts = async () => {
    setBlogPostsLoading(true);
    try {
      console.log('🔄 Fetching blog posts for store:', storeId);
      const response = await fetch(`http://localhost:1337/api/msme/${storeId}/blog-posts`);
      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Blog posts response:', data);

      if (data.success) {
        console.log('✅ Blog posts found:', data.blogPosts?.length || 0);
        console.log('📝 First blog post sample:', data.blogPosts?.[0]);
        setBlogPosts(data.blogPosts || []);
      } else {
        console.log('❌ Blog posts fetch failed:', data.error);
        setBlogPosts([]);
      }
    } catch (error) {
      console.error('💥 Error fetching blog posts:', error);
      setBlogPosts([]);
    } finally {
      setBlogPostsLoading(false);
    }
  };

  // Function to extract YouTube video ID from various URL formats (matching MSME dashboard)
  const extractYouTubeId = (url) => {
    if (!url) return null;

    // If the value passed is already a 11-character video id, accept it
    if (typeof url === 'string' && url.length === 11 && !url.includes('http')) {
      return url;
    }

    const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|[&?]v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return (match && match[1] && match[1].length === 11) ? match[1] : null;
  };

  // Get blog media URL function (matching MSME dashboard)
  const getBlogMediaUrl = (blog) => {
    if (blog.mediaType === 'youtube') {
      return blog.mediaUrl;
    }
    // Use the getImageUrl helper to handle both Cloudinary and local files
    return getImageUrl(blog.mediaUrl);
  };

  // Get YouTube thumbnail function (matching MSME dashboard)
  const getYouTubeThumbnail = (url) => {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }

    // If no video id could be extracted, return a safe fallback
    return defaultStoreImg;
  };

  // Calculate product rating from feedback
  const getProductRating = (product) => {
    // If product has a direct rating field, use it
    if (product.rating && typeof product.rating === 'number') {
      return product.rating;
    }

    // If no direct rating but has feedback, calculate from feedback
    if (product.feedback && product.feedback.length > 0) {
      const validRatings = product.feedback.filter(fb => fb.rating && typeof fb.rating === 'number');
      if (validRatings.length > 0) {
        const sum = validRatings.reduce((acc, fb) => acc + fb.rating, 0);
        return sum / validRatings.length;
      }
    }

    // Default to 0 if no rating data
    return 0;
  };

  // Blog slider navigation handlers
  const handleNextBlogSlide = () => {
    setCurrentBlogSlide((prevSlide) => (prevSlide + 1) % blogPosts.length);
  };

  const handlePrevBlogSlide = () => {
    setCurrentBlogSlide((prevSlide) =>
      prevSlide === 0 ? blogPosts.length - 1 : prevSlide - 1
    );
  };

  // Auto-slide functionality for blog posts
  useEffect(() => {
    if (blogPosts.length > 1) {
      const timer = setInterval(() => {
        setCurrentBlogSlide((prevSlide) => (prevSlide + 1) % blogPosts.length);
      }, 8000); // Change slide every 8 seconds (slower)

      return () => clearInterval(timer);
    }
  }, [blogPosts.length]);

  // Keyboard navigation for blog slides
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (blogPosts.length > 1) {
        if (event.key === 'ArrowLeft') {
          handlePrevBlogSlide();
        } else if (event.key === 'ArrowRight') {
          handleNextBlogSlide();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [blogPosts.length]);

  // Touch/swipe support for mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && blogPosts.length > 1) {
      handleNextBlogSlide();
    }
    if (isRightSwipe && blogPosts.length > 1) {
      handlePrevBlogSlide();
    }
  };

  // Handle blog post modal click - structured like BlogHero
  const handleBlogPostClick = async (clickedPost) => {
    console.log('🖱️ Blog post clicked:', clickedPost);
    console.log('🎬 Media type:', clickedPost.mediaType);
    console.log('🔗 Media URL:', clickedPost.mediaUrl);
    console.log('📄 Post content:', {
      title: clickedPost.title,
      subtitle: clickedPost.subtitle,
      description: clickedPost.description,
      category: clickedPost.category,
      createdAt: clickedPost.createdAt,
      views: clickedPost.views,
      _id: clickedPost._id
    });

    // Create a fresh copy of the clicked post to avoid reference issues
    const postCopy = {
      _id: clickedPost._id,
      title: clickedPost.title,
      subtitle: clickedPost.subtitle,
      description: clickedPost.description,
      category: clickedPost.category,
      mediaType: clickedPost.mediaType,
      mediaUrl: clickedPost.mediaUrl,
      createdAt: clickedPost.createdAt,
      views: clickedPost.views,
      msmeId: clickedPost.msmeId
    };

    console.log('📝 Post copy created:', postCopy);

    // Immediately set the selected post and show modal
    setSelectedBlogPost(postCopy);
    setShowBlogModal(true);

    // Increment views in background (don't wait for it)
    incrementMsmeBlogViews(clickedPost._id);
  };

  // Increment MSME blog post views - structured like BlogHero
  const incrementMsmeBlogViews = async (postId) => {
    try {
      console.log('📈 Incrementing views for MSME blog post:', postId);
      const response = await fetch(`http://localhost:1337/api/msme/blog-posts/${postId}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.post) {
          console.log('✅ Views incremented successfully, new count:', data.post.views);

          // Update the selected post with new view count if it's still the same post
          setSelectedBlogPost(prevSelected => {
            if (prevSelected && prevSelected._id === postId) {
              return { ...prevSelected, views: data.post.views };
            }
            return prevSelected;
          });

          // Update the blog posts list
          setBlogPosts(prevPosts =>
            prevPosts.map(p =>
              p._id === postId ? { ...p, views: data.post.views } : p
            )
          );
        }
      }
    } catch (error) {
      console.error('❌ Error incrementing MSME blog post views:', error);
    }
  };

  // BlogHero-style helper functions for MSME blogs
  const currentPost = blogPosts[currentBlogSlide];

  // Handle slide change like BlogHero
  const handleSlideChange = (index) => {
    setCurrentBlogSlide(index);
  };

  // Get background image URL for blog (like BlogHero)
  const getBackgroundImageForBlog = (post) => {
    if (!post) return defaultStoreImg;

    if (post.mediaType === 'youtube') {
      return getYouTubeThumbnail(post.mediaUrl);
    }

    return getBlogMediaUrl(post);
  };

  // Render blog media like BlogHero
  const renderBlogMedia = (post) => {
    if (!post) return <img src={defaultStoreImg} alt="Default" className="store-blog-hero-image" />;

    switch (post.mediaType) {
      case 'youtube':
        // For YouTube videos, show the thumbnail image to maintain consistent sizing
        // The actual video player is shown in the modal when clicked
        return (
          <img
            src={getYouTubeThumbnail(post.mediaUrl)}
            alt={post.title}
            className="store-blog-hero-image"
          />
        );
      case 'video':
        return (
          <video
            src={getBlogMediaUrl(post)}
            className="store-blog-hero-image"
            autoPlay
            muted
            loop
            playsInline
          />
        );
      case 'image':
      default:
        return (
          <img
            src={getBlogMediaUrl(post)}
            alt={post.title}
            className="store-blog-hero-image"
          />
        );
    }
  };

  // Format date for modal like BlogHero
  const formatDateForModal = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).toUpperCase();
  };

  const submitStoreRating = async () => {
    if (!user) {
      showError('Please log in to rate this store', 'Login Required');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const userName = `${user.firstname} ${user.lastname}`.trim();
      const userId = user.id || user._id;

      const response = await fetch(`http://localhost:1337/api/stores/${storeId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          user: userName,
          userId: userId,
          userType: userType
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update state to reflect that user has now rated
        setHasExistingRating(true);
        setSubmitSuccess(true);
        setShowRatingModal(false);

        // Refresh store details
        fetchStoreDetails();

        // Show appropriate notification message
        const actionMessage = hasExistingRating ? 'updated' : 'rated';
        showSuccess(`You ${actionMessage} ${store.businessName} with ${rating} star${rating > 1 ? 's' : ''}!`, 'Rating Submitted');

        // Hide success message after 3 seconds
        setTimeout(() => setSubmitSuccess(false), 3000);
      } else {
        setSubmitError(data.error || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setSubmitError('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChatClick = () => {
    console.log('🔍 Chat button clicked - Debug info:', {
      user: !!user,
      userDetails: user ? { id: user._id || user.id, name: `${user.firstname} ${user.lastname}` } : null,
      storeId: storeId,
      storeName: store?.businessName,
      storeExists: !!store
    });

    if (!user) {
      console.log('❌ User not authenticated');
      showError('Please log in to chat with this store', 'Login Required');
      return;
    }

    if (!storeId) {
      console.log('❌ Store ID not available');
      showError('Store information not available', 'Error');
      return;
    }

    if (!store) {
      console.log('❌ Store data not loaded');
      showError('Store information not loaded', 'Error');
      return;
    }

    console.log('✅ Starting conversation with store:', {
      storeId: storeId,
      storeName: store.businessName,
      customerId: user._id || user.id
    });

    // Show loading indicator while navigating
    showSuccess(`Starting conversation with ${store?.businessName || 'store'}...`, 'Chat');

    // Navigate to customer messages with store ID (matches App.jsx route)
    navigate(`/customer-message/${storeId}`);
  };

  const handleFollowToggle = async () => {
    if (!user) {
      showError('Please log in to follow stores', 'Login Required');
      return;
    }

    const action = isFollowing ? 'unfollow' : 'follow';

    try {
      const response = await fetch(`http://localhost:1337/api/stores/${storeId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: user._id,
          action: action
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsFollowing(!isFollowing);
        showSuccess(data.message, 'Success');
      } else {
        showError(data.error || 'Failed to update follow status', 'Error');
      }
    } catch (error) {
      console.error('Error following store:', error);
      showError('Failed to update follow status', 'Error');
    }
  };



  const getStoreImageUrl = (store) => {
    if (store?.dashboard?.storeLogo) {
      return getImageUrl(store.dashboard.storeLogo);
    }

    if (store?.dashboard?.coverPhoto) {
      return getImageUrl(store.dashboard.coverPhoto);
    }

    if (store?.category === 'food') {
      return foodStoreImg;
    } else if (store?.category === 'artisan') {
      return defaultStoreImg;
    }

    return defaultStoreImg;
  };

  const getProductImageUrl = (product) => {
    if (product.picture) {
      return getImageUrl(product.picture);
    }
    return foodStoreImg; // Default product image
  };

  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }

    return (
      <div className="rating-container">
        <div className="stars">{stars}</div>
        <span className="rating-value">({rating > 0 ? rating.toFixed(1) : '0.0'})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="customer-store-view-container">
        <Header />
        <div className="customer-store-view-content">
          <div className="loading-state">
            <p>Loading store...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="customer-store-view-container">
        <Header />
        <div className="customer-store-view-content">
          <div className="error-state">
            <p>Store not found</p>
            <button onClick={() => navigate('/customer/stores')} className="back-button">
              Back to Stores
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dashboard = store.dashboard || {};

  return (
    <div className="customer-store-view-container">
      <Header />

      {/* Full Width Cover Photo Hero Section */}
      <section className="store-cover-hero">
        <div className="cover-hero-image">
          <img
            src={dashboard.coverPhoto ? getImageUrl(dashboard.coverPhoto) : getStoreImageUrl(store)}
            alt={store.businessName}
            className="cover-hero-img"
            onError={(e) => {
              e.target.src = store.category === 'food' ? foodStoreImg : defaultStoreImg;
            }}
          />
          <div className="cover-hero-overlay"></div>
        </div>
      </section>

      <div className="customer-store-view-content">
        {/* Back Button */}
        <button
          className="back-to-stores-btn"
          onClick={() => navigate('/customer/stores')}
          style={{ marginTop: '0' }}
        >
          <ArrowBackIcon /> Back to Stores
        </button>

        {/* Store Info Section */}
        <div className="store-cover-section">
          {/* Store Logo and Info Section - Rearranged Layout */}
          <div className="store-info-section">
            {/* Left Column - Logo, Header, Buttons & Store Details */}
            <div className="store-left-column">
              {/* Store Header with Logo, Name and Username */}
              <div className="store-header-left">
                <div className="store-name-with-logo-left">
                  <div className="store-logo-container-left">

                    <img
                      src={getStoreImageUrl(store)}
                      alt={store.businessName}
                      className="store-logo-main"
                      onError={(e) => {
                        e.target.src = store.category === 'food' ? foodStoreImg : defaultStoreImg;
                      }}
                    />
                  </div>
                  <div className="store-name-username-container">
                    <h1 className="store-name-left">{store.businessName}</h1>
                    <div className="username-row-left">
                      <PersonIcon className="detail-icon username-icon" />
                      <span className="username-text">@{store.username}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Below Header in Left Column */}
              <div className="store-actions-left">
                <FollowButton
                  storeId={storeId}
                  storeName={store?.businessName}
                  onFollowChange={(isFollowing) => {
                    setIsFollowing(isFollowing);
                  }}
                />
                {/* Only show rate button for customers */}
                {userType === 'customer' && (
                  <button
                    className="rate-btn-header"
                    onClick={() => {
                      setShowRatingModal(true);
                      fetchExistingRating();
                    }}
                    title="Rate this store"
                  >
                    <RateReviewIcon />
                    RATE
                  </button>
                )}
                {/* Only show chat button for customers */}
                {userType === 'customer' && (
                  <button
                    className="chat-btn-header"
                    onClick={handleChatClick}
                    title="Chat with store"
                  >
                    <ChatIcon />
                    CHAT
                  </button>
                )}
              </div>
              <div className="store-rating-bottom">
                {renderStarRating(store.averageRating || 0)}
                {store.totalRatings > 0 && (
                  <span className="total-ratings">({store.totalRatings} rating{store.totalRatings !== 1 ? 's' : ''})</span>
                )}
              </div>
              {/* Store Details - Below Buttons in Left Column */}
              <div className="store-details-left">
                {/* Description */}
                {dashboard.description && (
                  <p className="store-description">{dashboard.description}</p>
                )}

                <div className="store-meta">
                  {/* Contact Number */}
                  {(dashboard.contactNumber || store.contactNumber) && (
                    <div className="store-detail-row">
                      <PhoneIcon className="detail-icon contact-icon" />
                      <span>{dashboard.contactNumber || store.contactNumber}</span>
                    </div>
                  )}

                  {/* Social Media Links */}
                  {dashboard.socialLinks?.facebook && (
                    <div className="store-detail-row">
                      <FacebookIcon className="detail-icon facebook-icon" />
                      <a href={dashboard.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="social-link">
                        Facebook
                      </a>
                    </div>
                  )}

                  {dashboard.socialLinks?.instagram && (
                    <div className="store-detail-row">
                      <InstagramIcon className="detail-icon instagram-icon" />
                      <a href={dashboard.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="social-link">
                        Instagram
                      </a>
                    </div>
                  )}





                  {/* E-commerce Platforms */}
                  {dashboard.ecommercePlatforms?.shopee?.url && (
                    <div className="store-detail-row">
                      <ShoppingBagIcon className="detail-icon shopee-icon" />
                      <a href={dashboard.ecommercePlatforms.shopee.url} target="_blank" rel="noopener noreferrer" className="social-link">
                        Shopee Store
                      </a>
                    </div>
                  )}

                  {dashboard.ecommercePlatforms?.lazada?.url && (
                    <div className="store-detail-row">
                      <ShoppingCartIcon className="detail-icon lazada-icon" />
                      <a href={dashboard.ecommercePlatforms.lazada.url} target="_blank" rel="noopener noreferrer" className="social-link">
                        Lazada Store
                      </a>
                    </div>
                  )}

                  {dashboard.ecommercePlatforms?.tiktok?.url && (
                    <div className="store-detail-row">
                      <AudiotrackIcon className="detail-icon tiktok-icon" />
                      <a href={dashboard.ecommercePlatforms.tiktok.url} target="_blank" rel="noopener noreferrer" className="social-link">
                        TikTok Shop
                      </a>
                    </div>
                  )}

                </div>

                {/* Store Rating - Bottom of left column */}

              </div>
            </div>

            {/* Right Column - Google Maps */}
            <div className="store-right-column">
              {/* Google Maps */}
              {dashboard.googleMapsUrl && handleEmbedUrl(dashboard.googleMapsUrl) ? (
                <div className="store-location-embed-right">
                  <iframe
                    src={handleEmbedUrl(dashboard.googleMapsUrl)}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Store Location"
                    className="google-maps-embed"
                  />
                </div>
              ) : dashboard.googleMapsUrl && !handleEmbedUrl(dashboard.googleMapsUrl) ? (
                <div className="store-location-embed-right" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '2px dashed #ddd',
                  height: '100%'
                }}>
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>📍 Location URL needs to be in embed format</p>
                    <small>Store owner should use embedded Google Maps link</small>
                  </div>
                </div>
              ) : (
                <div className="store-location-embed-right" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '2px dashed #ddd',
                  height: '100%'
                }}>
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>📍 No location provided</p>
                    <small>Store location will appear here</small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Store Reels Section - Replace Government Approvals */}


        {/* Products Section */}
        <div className="store-products">
          <h2>Products</h2>
          {products.length === 0 ? (
            <div className="no-products">
              <p>No products available at the moment.</p>
            </div>
          ) : (
            <div className="customer-store-products-grid">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="product-card"
                >
                  <div className="product-price-tag">
                    ₱{product.price}
                  </div>
                  <img
                    src={getProductImageUrl(product)}
                    alt={product.productName}
                    className="product-image"
                  />
                  <div className="product-content">
                    <h3 className="product-name">{product.productName}</h3>
                    <div className="product-rating">
                      <div className="product-stars">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const rating = getProductRating(product);
                          return (
                            <span
                              key={star}
                              className={`product-star ${star <= Math.round(rating) ? 'filled' : 'empty'}`}
                            >
                              ★
                            </span>
                          );
                        })}
                      </div>
                      <span className="product-rating-score">
                        ({getProductRating(product).toFixed(1)})
                      </span>
                    </div>
                    <button
                      className="product-view-btn"
                      onClick={() => navigate(`/product/${product._id}`)}
                    >
                      View Product
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Reviews Section */}
        <div className="store-reviews">
          {/* Product Feedbacks Section */}
          <div className="product-feedbacks-section">
            <h2>Customer Reviews</h2>
            {productFeedbacks.length > 0 ? (
              <div className="feedbacks-list">
                {productFeedbacks.slice(0, 5).map((feedback, index) => (
                  <div key={index} className="feedback-item">
                    <div className="feedback-header">
                      <div className="reviewer-info">
                        <div className="reviewer-avatar">
                          {/* Customer names are masked on server-side for privacy */}
                          {(feedback.userName || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div className="reviewer-details">
                          {/* Customer names are masked on server-side for privacy (e.g., "N**o*a") */}
                          <strong>{feedback.userName || 'Anonymous'}</strong>
                          <span className="review-date">
                            {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="review-rating">
                        <div className="stars">
                          {'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)}
                        </div>
                      </div>
                    </div>

                    {/* Review text */}
                    <p className="review-text">"{feedback.feedback}"</p>

                    {/* Product name and variant */}
                    <div className="reviewed-product-info">
                      <div className="reviewed-product-name">
                        <span className="product-label">Product: </span>
                        <span className="product-name-text">{feedback.productName}</span>
                      </div>
                      {(feedback.variant || feedback.productVariant || feedback.size || feedback.color) && (
                        <div className="reviewed-product-variant">
                          <span className="variant-label">Variant: </span>
                          <span className="variant-text">
                            {feedback.variant || feedback.productVariant ||
                              (feedback.size && feedback.color ? `${feedback.size}, ${feedback.color}` :
                                feedback.size || feedback.color || 'Not specified')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-reviews">
                <p>No product reviews yet. Be the first to review a product from this store!</p>
              </div>
            )}
          </div>
        </div>

        <div className="store-reels-section">
          {blogPostsLoading ? (
            <div className="reels-loading">
              <p>Loading blogs and videos...</p>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="no-reels">
              <p>No store reels available at the moment.</p>
            </div>
          ) : (
            <div className="reels-grid">
              {blogPosts.map((post, index) => (
                <div
                  key={post._id}
                  className="reel-card"
                  onClick={() => handleBlogPostClick(post)}
                >
                  <div className="reel-media">
                    <div className="reel-category-tag">{post.category}</div>
                    {post.mediaType === 'youtube' ? (
                      <div className="reel-youtube-thumb">
                        <img
                          src={getYouTubeThumbnail(post.mediaUrl)}
                          alt={post.title}
                          className="reel-thumbnail"
                        />
                        <div className="play-button-overlay">
                          <div className="play-icon">▶</div>
                        </div>
                      </div>
                    ) : post.mediaType === 'video' ? (
                      <div className="reel-video-thumb">
                        <video
                          src={getBlogMediaUrl(post)}
                          className="reel-thumbnail"
                          preload="metadata"
                        />
                        <div className="play-button-overlay">
                          <div className="play-icon">▶</div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={getBlogMediaUrl(post)}
                        alt={post.title}
                        className="reel-thumbnail"
                      />
                    )}
                  </div>


                </div>
              ))}
            </div>
          )}
        </div>
        {/* Rating Modal - Simplified to stars only */}
        {showRatingModal && (
          <div className="rating-modal-overlay" onClick={() => {
            setShowRatingModal(false);
            // Reset modal state
            setRating(0);
            setHoverRating(0);
            setHasExistingRating(false);
            setSubmitError(null);
            setSubmitSuccess(false);
          }}>
            <div className="rating-modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="rating-modal-close"
                onClick={() => {
                  setShowRatingModal(false);
                  // Reset modal state
                  setRating(0);
                  setHoverRating(0);
                  setHasExistingRating(false);
                  setSubmitError(null);
                  setSubmitSuccess(false);
                }}
              >
                ×
              </button>

              <h3>
                {loadingExistingRating
                  ? `Loading rating for ${store?.businessName}...`
                  : hasExistingRating
                    ? `Update your rating for ${store?.businessName}`
                    : `Rate ${store?.businessName}`
                }
              </h3>

              {!user ? (
                <div className="auth-message">
                  <p>Please log in to rate this store.</p>
                </div>
              ) : loadingExistingRating ? (
                <div className="loading-rating">
                  <p>Loading your previous rating...</p>
                </div>
              ) : (
                <div className="modal-rating-section">
                  {hasExistingRating && (
                    <div className="existing-rating-info">
                      <p>You previously rated this store {rating} star{rating > 1 ? 's' : ''}. You can update your rating below.</p>
                    </div>
                  )}

                  <div className="rating-input">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        className={`star-input ${(hoverRating || rating) >= star ? 'filled' : 'empty'}`}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                      >
                        {(hoverRating || rating) >= star ? (
                          <StarIcon className="star-icon filled" />
                        ) : (
                          <StarBorderIcon className="star-icon empty" />
                        )}
                      </span>
                    ))}
                    {rating > 0 && <span className="rating-label">{rating} Star{rating > 1 ? 's' : ''}</span>}
                  </div>

                  <button
                    onClick={submitStoreRating}
                    disabled={submitting || rating === 0}
                    className="submit-rating-button"
                  >
                    {submitting
                      ? 'Submitting...'
                      : hasExistingRating
                        ? 'Update Rating'
                        : 'Submit Rating'
                    }
                  </button>

                  {submitError && <div className="error-message">{submitError}</div>}
                  {submitSuccess && <div className="success-message">Rating submitted successfully!</div>}
                </div>
              )}
            </div>
          </div>
        )}



        {/* Blog Post Modal - BlogHero Style for MSME Data */}
        {showBlogModal && selectedBlogPost && (
          <div className="store-blog-hero-modal-overlay" onClick={() => setShowBlogModal(false)}>
            <div className="store-blog-hero-modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="store-blog-hero-modal-close"
                onClick={() => setShowBlogModal(false)}
              >
                ×
              </button>

              <div className="store-blog-hero-modal-header">
                <h2 className="store-blog-hero-modal-title">{selectedBlogPost.title}</h2>
                <div className="store-blog-hero-modal-meta">
                  <span className="store-blog-hero-modal-category">{selectedBlogPost.category}</span>
                  <span className="store-blog-hero-modal-date">
                    {formatDateForModal(selectedBlogPost.createdAt)}
                  </span>
                  <span className="store-blog-hero-modal-views">
                    {selectedBlogPost.views || 0} view{(selectedBlogPost.views || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="store-blog-hero-modal-body">
                {selectedBlogPost.mediaType === 'image' && selectedBlogPost.mediaUrl && (
                  <div className="store-blog-hero-modal-media">
                    <img
                      src={getBlogMediaUrl(selectedBlogPost)}
                      alt={selectedBlogPost.title}
                      className="store-blog-hero-modal-image"
                      onError={(e) => {
                        console.error('Image failed to load:', e.target.src);
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {selectedBlogPost.mediaType === 'video' && selectedBlogPost.mediaUrl && (
                  <div className="store-blog-hero-modal-media">
                    <video
                      src={getBlogMediaUrl(selectedBlogPost)}
                      className="store-blog-hero-modal-video"
                      controls
                      preload="metadata"
                      onError={(e) => {
                        console.error('Video failed to load:', e.target.src);
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {selectedBlogPost.mediaType === 'youtube' && selectedBlogPost.mediaUrl && (
                  <div className="store-blog-hero-modal-media">
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYouTubeId(selectedBlogPost.mediaUrl)}?rel=0&modestbranding=1&showinfo=1&controls=1&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=0`}
                      title={selectedBlogPost.title}
                      className="store-blog-hero-modal-youtube"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="store-blog-hero-modal-text">
                  <h3>{selectedBlogPost.subtitle}</h3>
                  <p>{selectedBlogPost.description}</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CustomerStoreView;