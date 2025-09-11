import ThemeToggle from './ThemeToggle';
import deccanAiLogo from '../assets/deccan-ai-logo.png';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src={deccanAiLogo} alt="Logo" className="navbar-logo" />
      </div>
      <ThemeToggle />
    </nav>
  );
};

export default Navbar;
