import React from 'react';
import '../css/Footer.css';
import logoDarkText from '../logos/Icon on dark with text.png';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import EmailIcon from '@mui/icons-material/Email';

function Footer() {
  return (
 <footer class="footer">
  <div class="footer-container">

    <div class="footer-brand">
      <img src={logoDarkText} alt="ELako.NV Logo" class="footer-logo" />
      <p> Digital Marketing  Solution For The Micro, Small, and 
        Medium Enterprises MSME’s in Nueva Vizcaya</p>
        
        <div style={{  gap: '30px', marginTop: 10 }}>
          <FacebookIcon style={{ color: 'white', fontSize: 30, cursor: 'pointer' }} />
          <InstagramIcon style={{ color: 'white', fontSize: 30, cursor: 'pointer' }} />
          <EmailIcon style={{ color: 'white', fontSize: 30, cursor: 'pointer' }} />
        </div>

    </div>

    <div class="footer-links">
      <div class="footer-col">
        <h4>Services</h4>
        <ul>
          <li><a href="#">SEO Optimization</a></li>
          <li><a href="#">Social Media</a></li>
          <li><a href="#">PPC Advertising</a></li>
          <li><a href="#">Content Marketing</a></li>
          <li><a href="#">Email Marketing</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Company</h4>
        <ul>
          <li><a href="#">About Us</a></li>
          <li><a href="#">Careers</a></li>
          <li><a href="#">Press</a></li>
          <li><a href="#">Blog</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4>Contact</h4> 
        <ul>
          <li>Email: <a href="mailto:hello@elako.com">hello@elako.com</a></li>
          <li>Phone: +1 (555) 123-4567</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="footer-bottom">
    © 2025 ELako.NV. All rights reserved.
  </div>
</footer>

  );
}

export default Footer;