import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import SearchIcon from "@mui/icons-material/Search"
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart"
import MenuIcon from "@mui/icons-material/Menu"
import logo from "../logos/Icon on dark with text.png"
import "../css/Navbar.css"
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatIcon from '@mui/icons-material/Chat';
function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          {/* Logo */}
          <div className="logo-section">
            <img
              src={logo}
              alt="MarketHub Logo"
              className="logo-img"
              style={{ height: "2.5rem" }}
            />
          </div>

          {/* Search Bar - Hidden on mobile */}
          <div className="search-section">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search for services, products, or stores..."
                className="search-input"
              />
              <button className="search-button">
                <SearchIcon fontSize="small" />
              </button>
            </div>
          </div>

          {/* Navigation - Desktop */}
          <div className="nav-section" style={{ left: '1.5rem' }}>
            <button className="nav-button nav-button-ghost">
              <NotificationsIcon fontSize="medium" />
            </button>
        
            <button className="nav-button nav-button-outline" onClick={() => navigate('/login')}>Login</button>
            <button className="nav-button nav-button-primary" onClick={() => navigate('/signup')}>Register</button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <MenuIcon fontSize="medium" />
          </button>
        </div>

        {/* Mobile Search */}
        <div className="mobile-search">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
            />
            <button className="search-button">
              <SearchIcon fontSize="small" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMenuOpen ? "open" : ""}`}>
          <div className="mobile-menu-content">
            <button className="nav-button nav-button-ghost mobile-menu-button">
              <NotificationsIcon fontSize="small" />
              Notifications
            </button>
           
            <button className="nav-button nav-button-outline mobile-menu-button" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="nav-button nav-button-primary mobile-menu-button" onClick={() => navigate('/signup')}>
              Register
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
