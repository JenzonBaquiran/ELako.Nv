import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingMessageIcon from '../components/FloatingMessageIcon';
import BlogHero from '../components/BlogHero';
import BadgeWrapper from '../components/BadgeWrapper';
// import BadgeCelebration from '../components/BadgeCelebration';
import { useAuth } from '../contexts/AuthContext';
import { recordStoreView } from '../utils/storeViewTracker';
import heroPic from '../pictures/IMG_6125.jpg';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import '../css/Home.css';

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const [newStores, setNewStores] = useState([]);
  const [topStores, setTopStores] = useState([]);
  const [hotPicks, setHotPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topStoresLoading, setTopStoresLoading] = useState(true);
  const [hotPicksLoading, setHotPicksLoading] = useState(true);

  // Fetch new stores, top stores, and hot picks from backend
  useEffect(() => {
    fetchNewStores();
    fetchTopStores();
    fetchHotPicks();
  }, [user]); // Re-fetch when user changes (login/logout)

  const fetchNewStores = async () => {
    try {
      // Use the stores endpoint that properly filters for approved and visible stores
      const storesResponse = await fetch('http://localhost:1337/api/stores');
      const storesData = await storesResponse.json();
      
      if (storesData.success) {
        // Sort by creation date (newest first) and take first 6
        const sortedStores = storesData.stores.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
        
        setNewStores(sortedStores);
      } else {
        console.error('Failed to fetch stores:', storesData.error);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopStores = async () => {
    try {
      // Fetch top stores with 4.5-5.0 rating, limit to 3
      // Include customer ID if user is logged in for follow status
      const url = user && user._id 
        ? `http://localhost:1337/api/top-stores?limit=3&customerId=${user._id}`
        : 'http://localhost:1337/api/top-stores?limit=3';
      
      const topStoresResponse = await fetch(url);
      const topStoresData = await topStoresResponse.json();
      
      if (topStoresData.success) {
        setTopStores(topStoresData.stores);
      } else {
        console.error('Failed to fetch top stores:', topStoresData.error);
      }
    } catch (error) {
      console.error('Error fetching top stores:', error);
    } finally {
      setTopStoresLoading(false);
    }
  };

  const fetchHotPicks = async () => {
    try {
      // Fetch hot picks products with 4.5-5.0 rating, limit to 4
      // Include customer ID if user is logged in for favorite status
      const url = user && user._id 
        ? `http://localhost:1337/api/hot-picks?limit=4&customerId=${user._id}`
        : 'http://localhost:1337/api/hot-picks?limit=4';
      
      const hotPicksResponse = await fetch(url);
      const hotPicksData = await hotPicksResponse.json();
      
      if (hotPicksData.success) {
        setHotPicks(hotPicksData.products);
      } else {
        console.error('Failed to fetch hot picks:', hotPicksData.error);
      }
    } catch (error) {
      console.error('Error fetching hot picks:', error);
    } finally {
      setHotPicksLoading(false);
    }
  };

  // Calculate days since joining
  const getDaysAgo = (dateString) => {
    const createdDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 14) return "1 week ago";
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  // Example icons using Unicode (replace with SVG or icon library if needed)
  const starIcon = <span style={{color: "#0097a7", fontSize: "1rem", marginRight: "0.25rem"}}>★</span>;
  const arrowIcon = <span style={{marginLeft: "0.5rem", fontSize: "1rem"}}>→</span>;
  
  // Helper function to get product label based on rating
  const getProductLabel = (rating, index) => {
    if (rating === 5) return { label: "Hot", labelClass: "hot" };
    if (rating >= 4.8) return { label: "HOT", labelClass: "trending" };
    if (rating >= 4.5) return { label: "Popular", labelClass: "popular" };
    return { label: "Featured", labelClass: "hot" };
  };

  // Helper function to format price
  const formatPrice = (price) => {
    return `₱${price.toLocaleString()}`;
  };

  return (
    <div>
      <Navbar />
      <BlogHero />
      <section className="hot-picks">
        <div className="hot-picks-header" data-aos="fade-right">
          {/* <span className="top-rated-icon">⭐</span> */}
          <h1></h1>
          <h2> HOT PICKS</h2>
          <div className="hot-picks-viewall">
            <button 
              className="hero-button hero-button-outline"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                navigate('/customer/hot-picks');
              }}
            >
              View All 
            </button>
          </div>
        </div>
     
        <div className="hot-picks-list-container">
          <div className="hot-picks-list">
            {hotPicksLoading ? (
              // Loading state
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '1.1rem', color: '#666' }}>Loading hot picks...</p>
              </div>
            ) : hotPicks.length === 0 ? (
              // No hot picks state
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '1.1rem', color: '#666' }}>No hot picks found.</p>
              </div>
            ) : (
              // Display fetched hot picks
              hotPicks.map((product, idx) => {
                const productLabel = getProductLabel(product.rating, idx);
                const productImage = product.imageUrl || heroPic;
                
                return (
                  <div className="hot-pick-card" key={product._id} data-aos="zoom-in">
                    <img 
                      src={productImage} 
                      alt={product.productName}
                      onError={(e) => {
                        e.target.src = heroPic; // Fallback to default image if product image fails
                      }}
                    />
                    <div className={`hot-pick-label ${productLabel.labelClass}`}>
                      {productLabel.label}
                    </div>
                    <div className="hot-pick-content">
                      <div className="hot-pick-info">
                        <h3>{product.productName}</h3>
                        <p>{product.description}</p>
                        <div className="hot-pick-rating">
                          {starIcon}
                          <span>{product.rating.toFixed(1)} ({product.totalReviews})</span>
                        </div>
                      </div>
                      <button 
                        className="hero-button hero-button-primary hot-pick-button" 
                        onClick={() => {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          navigate(`/product/${product._id}`);
                        }}
                      >
                        View Product
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
      <section className="top-stores">
  <div className="top-stores-header">
    {/* <span className="top-stores-icon">🏅</span> */}
    <h1></h1>
    <h2>TOP STORES</h2>
    <div className="top-stores-viewall">
      <button 
        className="hero-button hero-button-outline"
        onClick={() => navigate('/customer/top-stores')}
      >
        View All
      </button>
    </div>
  </div>
  <div className="top-stores-list-container">
    <div className="top-stores-list">
      {topStoresLoading ? (
        // Loading state
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', gridColumn: '1 / -1' }}>
          <p style={{ fontSize: '1.1rem', color: '#666' }}>Loading top stores...</p>
        </div>
      ) : topStores.length === 0 ? (
        // No top stores state
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', gridColumn: '1 / -1' }}>
          <p style={{ fontSize: '1.1rem', color: '#666' }}>No top-rated stores found.</p>
        </div>
      ) : (
        // Display fetched top stores with existing card structure
        topStores.map((store) => {
          const dashboard = store.dashboard;
          const storeImage = dashboard?.coverPhoto 
            ? getImageUrl(dashboard.coverPhoto) 
            : (dashboard?.storeLogo 
                ? getImageUrl(dashboard.storeLogo) 
                : heroPic);
          const businessName = dashboard?.businessName || store.businessName;
          const description = dashboard?.description || 'High-quality MSME products and services';
          const rating = store.averageRating || 0;
          const totalRatings = store.totalRatings || 0;
          const category = store.category || 'business';
          
          return (
            <BadgeWrapper key={store._id} userType="store" userId={store._id}>
              <div className="top-stores-card">
                <img 
                  src={storeImage} 
                  alt={businessName}
                  onError={(e) => {
                    e.target.src = heroPic; // Fallback to default image if store image fails to load
                  }}
                />
                <div className={`top-stores-label ${category.toLowerCase().replace(/\s+/g, '')}`}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </div>
                <div className="top-stores-content">
                  <div className="top-stores-info">
                    <h3>{businessName}</h3>
                    <p>{description}</p>
                    <div className="top-stores-rating">
                      ★ {rating.toFixed(1)} ({totalRatings} review{totalRatings !== 1 ? 's' : ''})
                    </div>
                  </div>
                  <button 
                    className="hero-button hero-button-outline top-stores-button" 
                    onClick={() => {
                      recordStoreView(store._id, user?._id, navigate);
                    }}
                  >
                    Visit Store
                  </button>
                </div>
              </div>
            </BadgeWrapper>
          );
        })
      )}
    </div>
  </div>
</section>
<section className="service-providers-section">
  <div className="service-providers-header">
    <div className="service-providers-title">
      <h2>NEW STORES</h2>
    </div>
    <div className="recently-joined-viewall">
       <button 
         className="hero-button hero-button-outline"
         onClick={() => navigate('/customer/stores')}
       >
         View All
       </button>
    </div>
  </div>
 
  <div className="service-providers-grid">
    {loading ? (
      // Loading state
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', gridColumn: '1 / -1' }}>
        <p style={{ fontSize: '1.1rem', color: '#666' }}>Loading new stores...</p>
      </div>
    ) : newStores.length === 0 ? (
      // No stores state
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', gridColumn: '1 / -1' }}>
        <p style={{ fontSize: '1.1rem', color: '#666' }}>No new stores found.</p>
      </div>
    ) : (
      // Display fetched stores with new card design
      newStores.map((store) => {
        const dashboard = store.dashboard;
        const storeLogo = dashboard?.storeLogo 
          ? getImageUrl(dashboard.storeLogo) 
          : heroPic;
        const businessName = dashboard?.businessName || store.businessName;
        const description = dashboard?.description || 'MSME business services';
        const location = dashboard?.location || store.address || 'Philippines';
        const joinedDays = getDaysAgo(store.createdAt);
        // Calculate if store is new (created within last 7 days)
        const isNew = (() => {
          if (!store.createdAt) return false;
          const createdDate = new Date(store.createdAt);
          const now = new Date();
          const diffTime = Math.abs(now - createdDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        })();
        
        // Temporary: Force first store to be "new" for testing
        const isNewForTesting = (store === newStores[0] || isNew);
        
        // Debug: Log store data for badges (Home page)
        console.log(`Home - Store: ${businessName}`);
        console.log(`- Created: ${store.createdAt}`);
        console.log(`- Days Ago Text: ${joinedDays}`);
        console.log(`- Is New: ${isNew}`);
        console.log(`- Is New (Testing): ${isNewForTesting}`);
        console.log('---');
        
        return (
          <BadgeWrapper key={store.id || store._id} userType="store" userId={store._id}>
            <div className="new-store-card">
              <div className="store-image-section">
                <img 
                  className="store-main-image" 
                  src={storeLogo} 
                  alt={businessName}
                  onError={(e) => {
                    e.target.src = heroPic; // Fallback to default image if logo fails to load
                  }}
                />
                <div className={`store-category-badge ${store.category?.toLowerCase().replace(/\s+/g, '') || 'default'}`}>
                  {store.category || 'Business'}
                </div>
                {isNewForTesting && (
                  <div className="store-new-badge">New</div>
                )}
              </div>
              
              <div className="store-content">
                <h3 className="store-title">{businessName}</h3>
                <p className="store-description">{description}</p>
                
                <div className="store-rating">
                  <div className="stars">
                    {dashboard?.rating ? (
                      <>
                        {Array.from({ length: 5 }, (_, index) => (
                          <span
                            key={index}
                            className={`star ${index < Math.floor(dashboard.rating) ? 'filled' : 'empty'}`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="rating-text">({dashboard.rating.toFixed(1)})</span>
                      </>
                    ) : (
                      <>
                        {Array.from({ length: 5 }, (_, index) => (
                          <span key={index} className="star empty">★</span>
                        ))}
                        <span className="rating-text">(0.0)</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="store-joined">
                  Joined {joinedDays}
                </div>
                
                <div className="store-location">
                  <LocationOnIcon className="location-icon" />
                  <span>{location}</span>
                </div>
                
                <button 
                  className="store-learn-btn"
                  onClick={() => {
                    recordStoreView(store._id, user?._id, navigate);
                  }}
                >
                  Visit Store
                </button>
              </div>
            </div>
          </BadgeWrapper>
        );
      })
    )}
  </div>
</section>

      <Footer />
      <FloatingMessageIcon />
      {/* <BadgeCelebration /> */}
    </div>
  );
}

export default Home;