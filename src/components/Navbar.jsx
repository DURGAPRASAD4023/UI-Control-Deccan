import React from 'react';
import './Navbar.css';
import deccanAiLogo from '../assets/deccan-ai-logo.png';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src={deccanAiLogo} alt="Deccan AI Logo" />
      </div>
    </nav>
  );
};

export default Navbar;
