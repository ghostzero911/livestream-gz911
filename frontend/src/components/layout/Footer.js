import React from 'react';
import { Link } from 'react-router-dom';

const footerStyle = {
  backgroundColor: 'var(--background-light)',
  color: '#888',
  textAlign: 'center',
  padding: '2rem 1rem',
  marginTop: 'auto',
};

const navStyle = {
  marginBottom: '1rem',
};

const linkStyle = {
  color: '#ddd',
  textDecoration: 'none',
  margin: '0 10px',
  fontSize: '0.9rem',
};

const copyrightStyle = {
  fontSize: '0.8rem',
};

function Footer() {
  return (
    <footer style={footerStyle}>
      <nav style={navStyle}>
        <Link to="/about" style={linkStyle}>About Us</Link>
        <Link to="/policy" style={linkStyle}>Privacy Policy</Link>
        <Link to="/disclaimer" style={linkStyle}>Disclaimer</Link>
      </nav>
      <div style={copyrightStyle}>
        &copy; {new Date().getFullYear()} TV Bolaku. All Rights Reserved.
      </div>
    </footer>
  );
}

export default Footer;