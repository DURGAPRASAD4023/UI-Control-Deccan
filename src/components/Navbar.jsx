import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import deccanAiLogo from '../assets/deccan-ai-logo.png';
import './Navbar.css';

const Navbar = ({ onLogout, userProfile }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src={deccanAiLogo} alt="Logo" className="navbar-logo" />
      </div>

      <div className="navbar-actions">
        <ThemeToggle />
        {userProfile && (
          <div className="profile-container">
            <img 
              src={userProfile.picture} 
              alt="Profile" 
              className="profile-picture" 
              onClick={() => setIsPanelOpen(true)}
            />
            <div className={`profile-panel ${isPanelOpen ? 'open' : ''}`}>
              <button className="close-panel" onClick={() => setIsPanelOpen(false)}>x</button>
              <div className="panel-content">
                <img src={userProfile.picture} alt="Profile" className="panel-profile-pic" />
                <p className="panel-name">{userProfile.name}</p>
                <p className="panel-email">{userProfile.email}</p>
                <button onClick={onLogout} className="logout-button-panel">
                  Logout
                </button>
              </div>
            </div>
            {isPanelOpen && <div className="overlay" onClick={() => setIsPanelOpen(false)}></div>}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
