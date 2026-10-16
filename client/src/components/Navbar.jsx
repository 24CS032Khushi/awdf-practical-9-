import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SITE } from '../data/site';

const linkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

export default function Navbar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');

  const close = () => setOpen(false);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch { /* ignore */ }
  };

  const handleLogout = () => {
    logout();
    close();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-logo">✓</span> {SITE.name}
        </Link>

        <button className="menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? '✕' : '☰'}
        </button>

        <nav className={`nav ${open ? 'open' : ''}`}>
          <NavLink to="/" end className={linkClass} onClick={close}>Home</NavLink>
          <NavLink to="/projects" className={linkClass} onClick={close}>Projects</NavLink>
          <NavLink to="/tasks" className={linkClass} onClick={close}>My Tasks</NavLink>
          <NavLink to="/contact" className={linkClass} onClick={close}>Contact</NavLink>

          <div className="nav-actions">
            <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode" title="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {user ? (
              <>
                <span className="user-chip" title={user.email}>
                  <span className="avatar">{(user.name || user.email)[0].toUpperCase()}</span>
                  {user.name || user.email.split('@')[0]}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm" onClick={close}>Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={close}>Sign up</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
