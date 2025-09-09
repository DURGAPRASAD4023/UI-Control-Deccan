import React from 'react';
import './Loader.css';
import deccanAiLogo from '../assets/deccan-ai-logo.png';

const Loader = () => {
  return (
    <div className="loader-container">
      <img src={deccanAiLogo} alt="Deccan AI Loader" className="loader-logo" />
    </div>
  );
};

export default Loader;
