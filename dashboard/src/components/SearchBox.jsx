import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BrushIcon from '@mui/icons-material/Brush';
import TagIcon from '@mui/icons-material/Tag';
import SearchService from '../utils/searchService';
import '../css/SearchBox.css';

const SearchBox = ({ placeholder = "Search for services, products, or stores... (Use #hashtag for variations)", className = "", isMobile = false }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const navigate = useNavigate();
  const searchBoxRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search function
  const debouncedSearch = (searchQuery) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (searchQuery.length > 0) {
        setIsLoading(true);
        try {
          const suggestions = await SearchService.getSuggestions(searchQuery, 8);
          setSuggestions(suggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      setSelectedIndex(-1);
    }, 300); // 300ms debounce delay
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleInputFocus = () => {
    if (query.length > 0 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    // Navigate based on suggestion type
    if (suggestion.type === 'product') {
      navigate(`/products/${suggestion.id}`);
    } else if (suggestion.type === 'store' || suggestion.type === 'artist') {
      navigate(`/store/${suggestion.id}`);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Disabled search functionality - Enter key will not trigger search
    return;
    
    if (query.trim()) {
      setShowSuggestions(false);
      // Search results page has been removed
      alert(`Search functionality is currently unavailable. You searched for: "${query.trim()}"`);
      setQuery('');
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault(); // Prevent Enter key functionality
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault(); // Disable Enter key functionality entirely
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        // Removed: else { handleSearch(e); }
        break;
      
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'product':
        return <ShoppingCartIcon className="suggestion-icon" />;
      case 'store':
        return <StorefrontIcon className="suggestion-icon" />;
      case 'artist':
        return <BrushIcon className="suggestion-icon" />;
      default:
        return <TrendingUpIcon className="suggestion-icon" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'product':
        return 'Product';
      case 'store':
        return 'Store';
      case 'artist':
        return 'Artist';
      default:
        return 'Result';
    }
  };

  return (
    <div className={`search-box ${className} ${isMobile ? 'search-box--mobile' : ''}`} ref={searchBoxRef}>
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-container">
          {query.startsWith('#') && (
            <div className="hashtag-indicator">
              <TagIcon className="hashtag-icon" />
            </div>
          )}
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`search-input ${query.startsWith('#') ? 'search-input--hashtag' : ''}`}
            autoComplete="off"
          />
          
          {query && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="search-clear-button"
              aria-label="Clear search"
            >
              <ClearIcon />
            </button>
          )}
          
          <button type="submit" className="search-submit-button" aria-label="Search">
            <SearchIcon />
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="search-suggestions" ref={suggestionsRef}>
          {isLoading ? (
            <div className="search-suggestions-loading">
              <div className="search-loading-spinner"></div>
              <span>Searching...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.type}-${suggestion.id}`}
                  className={`search-suggestion-item ${
                    index === selectedIndex ? 'search-suggestion-item--selected' : ''
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="search-suggestion-icon">
                    {suggestion.imageUrl ? (
                      <img 
                        src={suggestion.imageUrl} 
                        alt={suggestion.title}
                        className="suggestion-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="suggestion-icon-fallback" style={{ display: suggestion.imageUrl ? 'none' : 'flex' }}>
                      {getTypeIcon(suggestion.type)}
                    </div>
                  </div>
                  
                  <div className="search-suggestion-content">
                    <div className="search-suggestion-title">{suggestion.title}</div>
                    <div className="search-suggestion-subtitle">
                      <span className="suggestion-type-label">{getTypeLabel(suggestion.type)}</span>
                      {suggestion.subtitle && (
                        <>
                          <span className="suggestion-separator">•</span>
                          <span>{suggestion.subtitle}</span>
                        </>
                      )}
                      {suggestion.matchingVariant && (
                        <div className="search-suggestion-variant">
                          <span className="variant-highlight">Matching: {suggestion.matchingVariant.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            </>
          ) : query.length > 0 ? (
            <div className="search-suggestions-empty">
              <SearchIcon className="empty-icon" />
              <div className="empty-text">
                <div>No results found</div>
                <div className="empty-subtext">Try different keywords</div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBox;