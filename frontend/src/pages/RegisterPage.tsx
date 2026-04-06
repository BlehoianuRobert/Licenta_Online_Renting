import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/constants';
import './RegisterPage.css';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    accountType: 'client' as 'client' | 'vendor',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate(ROUTES.LOGIN);
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Eroare la înregistrare');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="register-page">
        <div className="register-container">
          <div className="success-message">
            <h2>✓ Înregistrare reușită!</h2>
            <p>Un email de confirmare a fost trimis la adresa {formData.email}</p>
            <p>Vă rugăm să vă verificați email-ul pentru a activa contul.</p>
            <p>Veți fi redirecționat la pagina de login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="auth-header">
          <p className="auth-kicker">Cont nou</p>
          <h2>Înregistrare</h2>
          <p className="auth-subtitle">Completeaza datele de mai jos pentru a crea un cont.</p>
        </div>
        <form onSubmit={handleSubmit} className="register-form">
          {error && <div className="form-error">{error}</div>}
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Prenume</label>
              <input
                type="text"
                name="firstName"
                className="form-input"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Prenume"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nume</label>
              <input
                type="text"
                name="lastName"
                className="form-input"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Nume"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              placeholder="Alege un username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="exemplu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Parolă</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minim 6 caractere"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tip Cont</label>
            <select
              name="accountType"
              className="form-input"
              value={formData.accountType}
              onChange={handleChange}
              required
            >
              <option value="client">Client</option>
              <option value="vendor">Vendor</option>
            </select>
            <p className="form-hint">
              {formData.accountType === 'vendor' 
                ? 'Ca vendor, vei putea lista produse pentru închiriere și totodată vei putea închiria produse de la alți vânzători.'
                : 'Ca client, vei putea doar închiria produse.'}
            </p>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? 'Se înregistrează...' : 'Înregistrare'}
          </button>
        </form>

        <p className="login-link">
          Ai deja cont? <Link to={ROUTES.LOGIN}>Conectează-te</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
