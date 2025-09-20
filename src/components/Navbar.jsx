import ThemeToggle from './ThemeToggle';
import deccanAiLogo from '../assets/deccan-ai-logo.png';
import './Navbar.css';

const Navbar = ({ onLogout }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src={deccanAiLogo} alt="Logo" className="navbar-logo" />
      </div>

      <div className="navbar-actions">
        <ThemeToggle />
        {onLogout && (
          <button
            onClick={onLogout}
            style={{ padding: '4px 8px', fontSize: '0.8rem', marginLeft: '10px' }}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
