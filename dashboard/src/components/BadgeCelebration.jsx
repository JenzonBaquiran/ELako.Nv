import React, { useState, useEffect } from 'react';
import { FaTrophy, FaHeart, FaCrown, FaTimes } from 'react-icons/fa';
import './BadgeCelebration.css';

const BadgeCelebration = ({ 
  badge, 
  badgeType, // 'store' or 'customer'
  isVisible, 
  onClose 
}) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Delay content appearance for balloon animation
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isVisible]);

  if (!isVisible || !badge) {
    return null;
  }

  const getTitle = () => {
    if (badgeType === 'store') {
      return 'Congratulations! 🎉';
    }
    return 'Congratulations! 🎉';
  };

  const getSubtitle = () => {
    if (badgeType === 'store') {
      return 'You are one of the Top Stores!';
    }
    return 'Badge achievement!';
  };

  const getBadgeIcon = () => {
    if (badgeType === 'store') {
      return <FaTrophy className="celebration-badge-icon store-icon" />;
    }
    return <FaTrophy className="celebration-badge-icon" />;
  };

  const getCriteriaText = () => {
    if (badgeType === 'store') {
      return [
        'Store Rating: Maintain an overall store rating of 4.5 stars or above',
        'Product Ratings: All listed products must have an average rating of 4.5 stars or above',
        'Store Profile Views: Reach at least 200 profile views during the week',
        'Blog Views (Store-authored): Achieve a minimum of 100 total views across the store\'s blog posts within the week'
      ];
    }
    return ['Badge criteria met!'];
  };

  return (
    <div className="badge-celebration-overlay">
      {/* Balloons Animation */}
      <div className="balloons-container">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className={`balloon balloon-${(i % 4) + 1}`}
            style={{ 
              left: `${10 + (i * 7)}%`,
              animationDelay: `${i * 0.2}s`
            }}
          >
            <div className="balloon-body"></div>
            <div className="balloon-string"></div>
          </div>
        ))}
      </div>

      {/* Confetti Animation */}
      <div className="confetti-container">
        {[...Array(50)].map((_, i) => (
          <div 
            key={i} 
            className={`confetti confetti-${(i % 5) + 1}`}
            style={{ 
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>

      {/* Main Celebration Modal */}
      <div className={`celebration-modal ${showContent ? 'show-content' : ''}`}>
        <div className="celebration-header">
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="celebration-content">
          {/* Badge Display */}
          <div className="celebration-badge">
            {getBadgeIcon()}
            <div className="badge-glow"></div>
          </div>

          {/* Title and Subtitle */}
          <h1 className="celebration-title">{getTitle()}</h1>
          <p className="celebration-subtitle">{getSubtitle()}</p>

          {/* Badge Type */}
          <div className="badge-type-display">
            <span className="badge-name">
              {badgeType === 'store' ? 'Weekly Top Store Badge' : 'Badge Achievement'}
            </span>
          </div>

          {/* Criteria Information */}
          <div className="criteria-section">
            <h3>Badge Criteria</h3>
            <ul className="criteria-checklist">
              {getCriteriaText().map((criterion, index) => (
                <li key={index} className="criteria-item-check">
                  <span className="checkmark">✅</span>
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Expiration Notice */}
          <div className="expiration-notice">
            <p>
              🕐 This badge will expire after one week
              {badge.expiresAt && (
                <span> (expires on {new Date(badge.expiresAt).toLocaleDateString()})</span>
              )}
            </p>
          </div>

          {/* Action Button */}
          <button className="celebration-cta" onClick={onClose}>
            Awesome! Continue Shopping 🛍️
          </button>
        </div>

        {/* Floating Elements */}
        <div className="floating-elements">
          <div className="floating-star star-1">⭐</div>
          <div className="floating-star star-2">🌟</div>
          <div className="floating-star star-3">✨</div>
          <div className="floating-trophy trophy-1">🏆</div>
          <div className="floating-trophy trophy-2">🥇</div>
          <div className="floating-heart heart-1">💖</div>
          <div className="floating-heart heart-2">💝</div>
        </div>
      </div>
    </div>
  );
};

export default BadgeCelebration;