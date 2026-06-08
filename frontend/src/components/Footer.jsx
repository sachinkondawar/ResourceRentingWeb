import React from 'react';
import { Package, Globe, Mail, MessageCircle, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer border-t border-glass">
      <div className="container footer-container">
        <div className="footer-brand">
          <Link to="/" className="navbar-logo" style={{ marginBottom: '1rem', display: 'flex' }}>
            <Package className="logo-icon" size={28} color="var(--primary)" />
            <span>Rentify</span>
          </Link>
          <p className="footer-desc">
            The premium platform to rent tools, electronics, and everyday items. Sustainable, affordable, and easy.
          </p>
          <div className="social-links">
            <a href="https://rentify.example.com" target="_blank" rel="noopener noreferrer" className="social-icon"><Globe size={20} /></a>
            <a href="mailto:support@rentify.example.com" className="social-icon"><Mail size={20} /></a>
            <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="social-icon"><MessageCircle size={20} /></a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon"><Share2 size={20} /></a>
          </div>
        </div>

        <div className="footer-links">
          <div className="link-group">
            <h4>Explore</h4>
            <Link to="/explore">All Items</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/featured">Featured</Link>
            <Link to="/near-me">Near Me</Link>
          </div>
          <div className="link-group">
            <h4>Support</h4>
            <Link to="/help">Help Center</Link>
            <Link to="/safety">Trust & Safety</Link>
            <Link to="/contact">Contact Us</Link>
            <Link to="/faq">FAQ</Link>
          </div>
          <div className="link-group">
            <h4>Legal</h4>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/cookies">Cookie Policy</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container flex justify-between items-center bottom-content">
          <p>&copy; {new Date().getFullYear()} Rentify. All rights reserved.</p>
          <p>Made with ❤️ for the Sharing Economy</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
