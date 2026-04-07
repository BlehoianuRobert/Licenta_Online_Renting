import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { APP_DISPLAY_NAME, ROUTES } from '../../utils/constants';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return isActive ? 'active' : '';
}

function userInitials(username?: string): string {
  if (!username) return '?';
  const parts = username.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('layout-menu-open');
    } else {
      document.body.classList.remove('layout-menu-open');
    }
    return () => document.body.classList.remove('layout-menu-open');
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <nav
          className={`app-nav${menuOpen ? ' nav-open' : ''}`}
          aria-label="Principal"
        >
          <Link className="logo" to={ROUTES.HOME} onClick={closeMenu}>
            <span className="logo-dot" aria-hidden />
            <span className="logo-text">{APP_DISPLAY_NAME}</span>
          </Link>

          <button
            type="button"
            className={`nav-menu-toggle${menuOpen ? ' is-open' : ''}`}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            aria-label={menuOpen ? 'Închide meniul' : 'Deschide meniul'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="nav-menu-toggle-bar" aria-hidden />
            <span className="nav-menu-toggle-bar" aria-hidden />
            <span className="nav-menu-toggle-bar" aria-hidden />
          </button>

          <div
            className={`nav-backdrop${menuOpen ? ' is-visible' : ''}`}
            aria-hidden
            onClick={closeMenu}
          />

          <div className="nav-cluster" id="primary-navigation">
            <ul className="nav-links">
              {isAuthenticated ? (
                <>
                  <li>
                    <NavLink to={ROUTES.PRODUCTS} className={navLinkClass} onClick={closeMenu}>
                      Produse
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to={ROUTES.MY_RENTALS} className={navLinkClass} onClick={closeMenu}>
                      Închirierile mele
                    </NavLink>
                  </li>
                  {(user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUPEROWNER') && (
                    <li>
                      <NavLink to={ROUTES.ADMIN} className={navLinkClass} onClick={closeMenu}>
                        Admin
                      </NavLink>
                    </li>
                  )}
                  <li>
                    <NavLink to={ROUTES.HELP} className={navLinkClass} onClick={closeMenu}>
                      Ajutor
                    </NavLink>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <NavLink to={ROUTES.PRODUCTS} className={navLinkClass} onClick={closeMenu}>
                      Produse
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to={ROUTES.HELP} className={navLinkClass} onClick={closeMenu}>
                      Ajutor
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to={ROUTES.LOGIN} className={navLinkClass} onClick={closeMenu}>
                      Login
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to={ROUTES.REGISTER}
                      className="btn btn-primary btn-nav-register"
                      onClick={closeMenu}
                    >
                      Înregistrare
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
            {isAuthenticated && (
              <div className="nav-right">
                <div className="nav-user">
                  <div className="avatar" aria-hidden>
                    {userInitials(user?.username)}
                  </div>
                  <span className="nav-username">{user?.username}</span>
                </div>
                <button type="button" onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main className="app-main">{children}</main>
    </div>
  );
};

export default Layout;
