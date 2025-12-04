import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroPic from '../pictures/IMG_6125.jpg';
import crafts1 from '../pictures/CRAFTS1.png';
import bukoPie from '../pictures/BUKO PIE.png';
import paintings from '../pictures/PAINTINGS.png';
import weaving from '../pictures/WEAVING.png';
import '../css/BlogHero.css';

const BlogHero = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [blogPosts, setBlogPosts] = useState([]);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [selectedBlogPost, setSelectedBlogPost] = useState(null);

  // Fetch blog posts from API
  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      const response = await fetch('http://localhost:1337/api/blog-posts/published');
      const data = await response.json();
      if (data.success) {
        setBlogPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      // Fallback to default posts if API fails
      setBlogPosts([
        {
          _id: 1,
          category: "SUCCESS STORIES",
          title: "From Local Craft to Global Market",
          subtitle: "Traditional Filipino weaving meets digital innovation",
          createdAt: "2025-10-02",
          author: "ELAKO TEAM",
          readTime: "5 MIN READ",
          mediaType: "image",
          mediaUrl: "WEAVING.png",
          description: "Maria's weaving story proves that traditional crafts and digital innovation create perfect harmony for business success.",
          featured: true,
          views: 0
        }
      ]);
    }
  };

  // Auto-slide functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % blogPosts.length);
      setIsDescriptionExpanded(false); // Reset description when auto-sliding
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [blogPosts.length]);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
    setIsDescriptionExpanded(false); // Reset description when changing slides
  };

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const currentPost = blogPosts[currentSlide];
  
  // Helper function to get media URL
  const getMediaUrl = (post) => {
    if (!post) return heroPic;
    
    switch (post.mediaType) {
      case 'youtube':
        return post.mediaUrl;
      case 'video':
      case 'image':
      default:
        // Handle both Cloudinary URLs and local files
        if (!post.mediaUrl) return heroPic;
        // If it's already a full URL (Cloudinary), use it directly
        if (post.mediaUrl.startsWith('http')) {
          return post.mediaUrl;
        }
        // If it contains folder structure like 'elako/blog/...', it's a Cloudinary public ID
        if (post.mediaUrl.includes('/') && !post.mediaUrl.startsWith('uploads/')) {
          return `https://res.cloudinary.com/dk9umulxw/image/upload/${post.mediaUrl}`;
        }
        // Check if it's a local image from our pictures folder
        if (['WEAVING.png', 'BUKO PIE.png', 'CRAFTS1.png', 'PAINTINGS.png'].includes(post.mediaUrl)) {
          switch (post.mediaUrl) {
            case 'WEAVING.png': return weaving;
            case 'BUKO PIE.png': return bukoPie;
            case 'CRAFTS1.png': return crafts1;
            case 'PAINTINGS.png': return paintings;
            default: return heroPic;
          }
        }
        return `http://localhost:1337/uploads/${post.mediaUrl}`;
    }
  };

  // Helper function to get YouTube video ID
  const getYouTubeVideoId = (url) => {
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

  // Helper function to get YouTube thumbnail URL
  const getYouTubeThumbnail = (videoId) => {
    if (!videoId) return heroPic;
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };



  // Handle blog post modal click
  const handleBlogPostClick = async (post) => {
    console.log('🖱️ BlogHero: Blog post clicked:', post);
    console.log('🔢 Current views before increment:', post.views || 0);
    
    // Create a fresh copy of the clicked post
    const postCopy = {
      _id: post._id,
      title: post.title,
      subtitle: post.subtitle,
      description: post.description,
      category: post.category,
      mediaType: post.mediaType,
      mediaUrl: post.mediaUrl,
      createdAt: post.createdAt,
      views: post.views,
      author: post.author,
      readTime: post.readTime
    };
    
    console.log('📝 BlogHero: Post copy created:', postCopy);
    
    // Set the selected post and show modal
    setSelectedBlogPost(postCopy);
    setShowBlogModal(true);
    
    // Increment views in background
    incrementBlogViews(post._id);
  };

  // Increment blog post views
  const incrementBlogViews = async (postId) => {
    try {
      console.log('📈 Incrementing views for BlogHero post:', postId);
      const response = await fetch(`http://localhost:1337/api/blog-posts/${postId}/increment-views`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ BlogHero views API response:', data);
        if (data.success && data.post) {
          console.log('✅ Views incremented successfully, new count:', data.post.views);
          
          // Update the selected post with new view count
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
      } else {
        console.error('❌ BlogHero views API failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error incrementing BlogHero views:', error);
    }
  };

  // Helper function to render media
  const renderMedia = (post) => {
    if (!post) return <img src={heroPic} alt="Default" className="blog-hero-image" />;
    
    switch (post.mediaType) {
      case 'youtube':
        // For YouTube videos, show the thumbnail image to maintain consistent sizing
        // The actual video player is shown in the modal when clicked
        const videoId = getYouTubeVideoId(post.mediaUrl);
        return (
          <img
            src={getYouTubeThumbnail(videoId)}
            alt={post.title}
            className="blog-hero-image"
          />
        );
      case 'video':
        return (
          <video
            src={getMediaUrl(post)}
            className="blog-hero-image"
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
            src={getMediaUrl(post)}
            alt={post.title}
            className="blog-hero-image"
          />
        );
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).toUpperCase();
  };

  if (blogPosts.length === 0) {
    return (
      <section className="blog-hero">
        <div className="blog-hero-container">
          <div className="blog-hero-content">
            <div className="empty-hero-state">
              <h1>Welcome to ELAKO</h1>
              <p>Empowering Filipino MSMEs through digital innovation</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Get background image URL (use YouTube thumbnail for YouTube videos)
  const getBackgroundImage = (post) => {
    if (!post) return heroPic;
    
    if (post.mediaType === 'youtube') {
      const videoId = getYouTubeVideoId(post.mediaUrl);
      return getYouTubeThumbnail(videoId);
    }
    
    return getMediaUrl(post);
  };

  return (
    <section 
      className="blog-hero" 
      style={{
        backgroundImage: `url(${getBackgroundImage(currentPost)})`,
      }}
    >
      {/* Background image with overlay */}
      <div className="blog-hero-background">
        <div className="blog-hero-background-image">
          {renderMedia(currentPost)}
        </div>
      </div>
      
      <div className="blog-hero-container">
        <div className="blog-hero-content">
          <div className="blog-hero-text-section">
            <h1 className="blog-hero-title">
              {currentPost?.title || 'Discovering Local Treasures: A Spotlight on Hidden Stores in Nueva Vizcaya'}
            </h1>

            {/* Category badge positioned below the title */}
            <div className="blog-hero-badges">
              <div className="blog-hero-category-badge">
                {currentPost?.category || 'FEATURED STORES'}
              </div>
            </div>

            <h2 className="blog-hero-subtitle">
              {currentPost?.subtitle || 'Exploring unique shops that bring culture and creativity closer to the community. Nueva Vizcaya is home to a variety of hidden gems—stores that not only sell products but also tell stories. From...'}
            </h2>

            <div className="blog-hero-actions">
              <button 
                className="blog-hero-cta-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBlogPostClick(currentPost);
                }}
              >
                READ MORE
                <span className="cta-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <button 
        className="blog-hero-nav prev"
        onClick={() => handleSlideChange((currentSlide - 1 + blogPosts.length) % blogPosts.length)}
        aria-label="Previous slide"
      >
        ‹
      </button>
      <button 
        className="blog-hero-nav next"
        onClick={() => handleSlideChange((currentSlide + 1) % blogPosts.length)}
        aria-label="Next slide"
      >
        ›
      </button>

      {/* Blog Post Modal */}
      {showBlogModal && selectedBlogPost && (
        <div className="blog-hero-modal-overlay" onClick={() => setShowBlogModal(false)}>
          <div className="blog-hero-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="blog-hero-modal-close"
              onClick={() => setShowBlogModal(false)}
            >
              ×
            </button>
            
            <div className="blog-hero-modal-header">
              <h2 className="blog-hero-modal-title">{selectedBlogPost.title}</h2>
              <div className="blog-hero-modal-meta">
                <span className="blog-hero-modal-category">{selectedBlogPost.category}</span>
                <span className="blog-hero-modal-date">
                  {formatDate(selectedBlogPost.createdAt)}
                </span>
                <span className="blog-hero-modal-views">
                  {selectedBlogPost.views || 0} view{(selectedBlogPost.views || 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="blog-hero-modal-body">
              {selectedBlogPost.mediaType === 'image' && selectedBlogPost.mediaUrl && (
                <div className="blog-hero-modal-media">
                  <img 
                    src={getMediaUrl(selectedBlogPost)} 
                    alt={selectedBlogPost.title}
                    className="blog-hero-modal-image"
                    onError={(e) => {
                      console.error('Image failed to load:', e.target.src);
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {selectedBlogPost.mediaType === 'video' && selectedBlogPost.mediaUrl && (
                <div className="blog-hero-modal-media">
                  <video 
                    src={getMediaUrl(selectedBlogPost)}
                    className="blog-hero-modal-video"
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
                <div className="blog-hero-modal-media">
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedBlogPost.mediaUrl)}?rel=0&modestbranding=1&showinfo=1&controls=1&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=0`}
                    title={selectedBlogPost.title}
                    className="blog-hero-modal-youtube"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              )}
              
              <div className="blog-hero-modal-text">
                <h3>{selectedBlogPost.subtitle}</h3>
                <p>{selectedBlogPost.description}</p>
                {selectedBlogPost.author && (
                  <div className="blog-hero-modal-author">
                    <strong>By: {selectedBlogPost.author}</strong>
                    {selectedBlogPost.readTime && <span> • {selectedBlogPost.readTime}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default BlogHero;