import React from 'react'
import Navbar from './Navbar';
import Footer from './Footer';
import heroPic from '../pictures/IMG_6125.jpg';
import '../css/Home.css';

function Home() {
  // Example icons using Unicode (replace with SVG or icon library if needed)
  const starIcon = <span style={{color: "#0097a7", fontSize: "1rem", marginRight: "0.25rem"}}>★</span>;
  const arrowIcon = <span style={{marginLeft: "0.5rem", fontSize: "1rem"}}>→</span>;
  

  const cards = [
    {
      label: "Hot",
      labelClass: "hot",
      title: "Social Media Management Pro",
      desc: "Complete social media strategy and content creation",
      rating: "4.9 (234)",
      price: "$299/month"
    },
    {
      label: "Trending",
      labelClass: "trending",
      title: "SEO Optimization Suite",
      desc: "Boost your search rankings with advanced SEO tools",
      rating: "4.8 (189)",
      price: "$199/month"
    },
    {
      label: "Popular",
      labelClass: "popular",
      title: "Email Marketing Automation",
      desc: "Automated email campaigns that convert",
      rating: "4.7 (156)",
      price: "$149/month"
    },
    {
      label: "Hot",
      labelClass: "hot",
      title: "PPC Campaign Management",
      desc: "Expert Google Ads and Facebook Ads management",
      rating: "4.9 (298)",
      price: "$399/month"
    }
  ];

  return (
    <div>
      <Navbar />
      <div className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Grow Your Business<br />
              with <span className="hero-highlight">Digital Marketing</span>
            </h1>
            <p className="hero-subtitle">
              Connect with top-rated digital marketing services,<br />
              discover trending tools, and join thousands of<br />
              businesses scaling their online presence.
            </p>
            <div className="hero-cta">
              <button className="hero-button hero-button-primary">Get Started{arrowIcon}</button>
              <button className="hero-button hero-button-outline">Browse Stores</button>
            </div>
          </div>
        </div>
      </div>
      <section className="hot-picks">
        <div className="hot-picks-header" data-aos="fade-right">
          {/* <span className="hot-pick-icon">🔥</span> */}
          <h1></h1>
          <h2>Hot Picks</h2>
          <div className="hot-picks-viewall">
            <button className="hero-button hero-button-outline">
              View All 
            </button>
          </div>
        </div>
     
        <div className="hot-picks-list-container">
          <div className="hot-picks-list">
            {cards.map((card, idx) => (
              <div className="hot-pick-card" key={idx} data-aos="zoom-in">
                <img src={heroPic} alt="Service" />
                <div className={`hot-pick-label ${card.labelClass}`}>{card.label}</div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
                <div className="hot-pick-rating">
                  {starIcon}
                  <span>{card.rating}</span>
                </div>
                <div className="hot-pick-price">
                  {card.price}
                </div>
                <button className="hero-button hero-button-primary" style={{width: "100%", marginTop: "1rem"}}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="top-stores">
  <div className="top-stores-header">
    {/* <span className="top-stores-icon">🏅</span> */}
    <h1></h1>
    <h2>Top Stores</h2>
    <div className="top-stores-viewall">
      <button className="hero-button hero-button-outline">View All</button>
    </div>
  </div>
  <div className="top-stores-list-container">
    <div className="top-stores-list">
      {/* Example cards, replace with dynamic data as needed */}
      <div className="top-stores-card">
        <img src={heroPic} alt="Content Creation Studio" />
        <div className="top-stores-label content">Content</div>
        <h3>Content Creation Studio</h3>
        <p>AI-powered content generation for all platforms</p>
        <div className="top-stores-rating">★ 4.9 (412 reviews)</div>
        <button className="hero-button hero-button-outline" style={{width: "100%", marginTop: "1rem"}}>Learn More</button>
      </div>
      <div className="top-stores-card">
        <img src={heroPic} alt="Analytics Pro Dashboard" />
        <div className="top-stores-label analytics">Analytics</div>
        <h3>Analytics Pro Dashboard</h3>
        <p>Advanced marketing analytics and reporting</p>
        <div className="top-stores-rating">★ 4.8 (356 reviews)</div>
        <button className="hero-button hero-button-outline" style={{width: "100%", marginTop: "1rem"}}>Learn More</button>
      </div>
      <div className="top-stores-card">
        <img src={heroPic} alt="Influencer Connect" />
        <div className="top-stores-label influencer">Influencer</div>
        <h3>Influencer Connect</h3>
        <p>Connect with top influencers in your niche</p>
        <div className="top-stores-rating">★ 4.7 (289 reviews)</div>
        <button className="hero-button hero-button-outline" style={{width: "100%", marginTop: "1rem"}}>Learn More</button>
      </div>
      <div className="top-stores-card">
        <img src={heroPic} alt="Brand Design Suite" />
        <div className="top-stores-label design">Design</div>
        <h3>Brand Design Suite</h3>
        <p>Professional branding and design tools</p>
        <div className="top-stores-rating">★ 4.8 (234 reviews)</div>
        <button className="hero-button hero-button-outline" style={{width: "100%", marginTop: "1rem"}}>Learn More</button>
      </div>
      <div className="top-stores-card">
        <img src={heroPic} alt="Video Marketing Hub" />
        <div className="top-stores-label video">Video</div>
        <h3>Video Marketing Hub</h3>
        <p>Create and distribute engaging video content</p>
        <div className="top-stores-rating">★ 4.9 (178 reviews)</div>
        <button className="hero-button hero-button-outline" style={{width: "100%", marginTop: "1rem"}}>Learn More</button>
      </div>
      <div className="top-stores-card">
        <img src={heroPic} alt="Conversion Optimizer" />
        <div className="top-stores-label optimization">Optimization</div>
        <h3>Conversion Optimizer</h3>
        <p>A/B testing and conversion rate optimization</p>
        <div className="top-stores-rating">★ 4.6 (145 reviews)</div>
        <button className="hero-button hero-button-outline" style={{width: "100%", marginTop: "1rem"}}>Learn More</button>
      </div>
    </div>
  </div>
</section>
<section className="recently-joined">
  <div className="recently-joined-header">
    {/* <span className="recently-joined-icon">🛍️</span> */}
    <h1></h1>
    <h2>Current Stores</h2>
    <div className="recently-joined-viewall">
       <button className="hero-button hero-button-outline">View All</button>
    </div>
  </div>
 
      <div className="recently-joined-list-container">
        <div className="recently-joined-list">
          {/* Example cards with IMG_6125.jpg as profile image */}
          <div className="recently-joined-card">
            <img className="store-logo" src={heroPic} alt="Digital Growth Agency" />
            <h3>Digital Growth Agency <span className="recently-joined-label">New</span></h3>
            <p>Full-service digital marketing for startups</p>
            <div className="recently-joined-meta">
              <span>📍 San Francisco, CA</span>
              <span>⏰ Joined 2 days ago</span>
            </div>
            <div className="recently-joined-tags">
              <span className="recently-joined-tag">SEO</span>
              <span className="recently-joined-tag">PPC</span>
              <span className="recently-joined-tag">Social Media</span>
            </div>
            <button className="hero-button hero-button-outline" style={{width: "100%", marginTop: "1rem"}}>Visit Store</button>
          </div>
          <div className="recently-joined-card">
            <img className="store-logo" src={heroPic} alt="Creative Content Co." />
            <h3>Creative Content Co. <span className="recently-joined-label">New</span></h3>
            <p>Premium content creation and strategy</p>
            <div className="recently-joined-meta">
              <span>📍 San Francisco, CA</span>
              <span>⏰ Joined 3 days ago</span>
            </div>
            <div className="recently-joined-tags">
              <span className="recently-joined-tag">Content</span>
              <span className="recently-joined-tag">Video</span>
              <span className="recently-joined-tag">Design</span>
            </div>
            <button className="hero-button hero-button-outline" style={{width: "100%", marginTop: "1rem"}}>Visit Store</button>
          </div>
          <div className="recently-joined-card">
            <img className="store-logo" src={heroPic} alt="Analytics Masters" />
            <h3>Analytics Masters <span className="recently-joined-label">New</span></h3>
            <p>Data-driven marketing insights</p>
            <div className="recently-joined-meta">
              <span>📍 San Francisco, CA</span>
              <span>⏰ Joined 5 days ago</span>
            </div>
            <div className="recently-joined-tags">
              <span className="recently-joined-tag">Analytics</span>
              <span className="recently-joined-tag">Reporting</span>
              <span className="recently-joined-tag">Strategy</span>
            </div>
            <button className="hero-button hero-button-outline" style={{width: "100%", marginTop: "1rem"}}>Visit Store</button>
          </div>
          <div className="recently-joined-card">
            <img className="store-logo" src={heroPic} alt="Social Buzz Studio" />
            <h3>Social Buzz Studio</h3>
            <p>Social media management specialists</p>
            <div className="recently-joined-meta">
              <span>📍 Los Angeles, CA</span>
              <span>⏰ Joined 1 week ago</span>
            </div>
            <div className="recently-joined-tags">
              <span className="recently-joined-tag">Social Media</span>
              <span className="recently-joined-tag">Influencer</span>
              <span className="recently-joined-tag">Community</span>
            </div>
            <button className="hero-button hero-button-outline" style={{width: "100%", marginTop: "1rem"}}>Visit Store</button>
          </div>
          <div className="recently-joined-card">
            <img className="store-logo" src={heroPic} alt="Email Pro Solutions" />
            <h3>Email Pro Solutions</h3>
            <p>Email marketing automation experts</p>
            <div className="recently-joined-meta">
              <span>📍 Chicago, IL</span>
              <span>⏰ Joined 1 week ago</span>
            </div>
            <div className="recently-joined-tags">
              <span className="recently-joined-tag">Email</span>
              <span className="recently-joined-tag">Automation</span>
              <span className="recently-joined-tag">CRM</span>
            </div>
            <button className="hero-button hero-button-outline" style={{width: "100%", marginTop: "1rem"}}>Visit Store</button>
          </div>
          <div className="recently-joined-card">
            <img className="store-logo" src={heroPic} alt="Brand Builders Inc." />
            <h3>Brand Builders Inc.</h3>
            <p>Complete brand development services</p>
            <div className="recently-joined-meta">
              <span>📍 Miami, FL</span>
              <span>⏰ Joined 2 weeks ago</span>
            </div>
            <div className="recently-joined-tags">
              <span className="recently-joined-tag">Branding</span>
              <span className="recently-joined-tag">Design</span>
              <span className="recently-joined-tag">Strategy</span>
            </div>
            <button className="hero-button hero-button-outline" style={{width: "100%", marginTop: "1rem"}}>Visit Store</button>
          </div>
        </div>
      </div>
</section>
      <Footer />
    </div>
  );
}

export default Home;