import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/constants';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate(ROUTES.PRODUCTS);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Eroare la autentificare');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="auth-header">
          <p className="auth-kicker">Bine ai revenit</p>
          <h2>Autentificare</h2>
          <p className="auth-subtitle">Conecteaza-te pentru a continua catre catalogul de produse.</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="form-error">{error}</div>}
          
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Introdu username-ul tau"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Parolă</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Introdu parola"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? 'Se conectează...' : 'Conectare'}
          </button>
        </form>

        <p className="register-link">
          Nu ai cont? <Link to={ROUTES.REGISTER}>Înregistrează-te</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
