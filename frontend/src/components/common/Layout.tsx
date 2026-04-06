import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="app-layout">
      <header className="app-header">
        <nav className="app-nav">
          <div className="nav-brand">
            <Link to={ROUTES.PRODUCTS}>
              <h1>Online Rental System</h1>
            </Link>
          </div>
          <div className="nav-links">
            {isAuthenticated ? (
              <>
                <Link to={ROUTES.PRODUCTS}>Produse</Link>
                <Link to={ROUTES.MY_RENTALS}>Închirierile mele</Link>
                {(user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_SUPEROWNER') && (
                  <Link to={ROUTES.ADMIN}>Admin</Link>
                )}
                <Link to={ROUTES.HELP}>Ajutor</Link>
                <span className="user-name">{user?.username}</span>
                <button onClick={logout} className="btn btn-secondary">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to={ROUTES.PRODUCTS}>Produse</Link>
                <Link to={ROUTES.HELP}>Ajutor</Link>
                <Link to={ROUTES.LOGIN}>Login</Link>
                <Link to={ROUTES.REGISTER} className="btn btn-primary">
                  Înregistrare
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="app-main">
        {children}
      </main>
    </div>
  );
};

export default Layout;
