import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService, UserResponse } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/constants';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [promotingUser, setPromotingUser] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const { isSuperOwner, user: currentUser } = useAuth();

  useEffect(() => {
    if (isSuperOwner) {
      loadUsers();
    }
  }, [isSuperOwner]);

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const data = await authService.getAllUsers();
      setUsers(data);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Eroare la încărcarea utilizatorilor');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handlePromoteToSuperOwner = async (username: string) => {
    if (!confirm(`Ești sigur că vrei să promovezi utilizatorul "${username}" la SuperOwner?`)) {
      return;
    }

    setPromotingUser(username);
    setMessage('');

    try {
      const response = await authService.promoteToSuperOwner(username);
      setMessage(response.message);
      await loadUsers(); // Reload users list
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Eroare la promovarea utilizatorului');
    } finally {
      setPromotingUser(null);
    }
  };

  const getRoleDisplay = (roles: string[]): string => {
    if (roles.includes('ROLE_SUPEROWNER')) return 'SuperOwner';
    if (roles.includes('ROLE_ADMIN')) return 'Vendor';
    return 'Client';
  };

  const isSuperOwnerUser = (roles: string[]): boolean => {
    return roles.includes('ROLE_SUPEROWNER');
  };

  return (
    <div className="admin-dashboard">
      <div className="container">
        <h1>Panou de Control Admin</h1>
        
        <div className="admin-cards">
          <Link to={ROUTES.ADMIN_PRODUCTS} className="admin-card">
            <h2>Gestionare Produse</h2>
            <p>Adaugă, editează sau șterge produse și unități de inventar</p>
          </Link>
          
          <Link to={ROUTES.ADMIN_RENTALS} className="admin-card">
            <h2>Gestionare Închirieri</h2>
            <p>Vizualizează și gestionează toate închirierile</p>
          </Link>
          {isSuperOwner && (
            <Link to={ROUTES.SUPEROWNER_STATS} className="admin-card">
              <h2>Statistici Financiare</h2>
              <p>Venituri și cheltuieli globale + pe fiecare dispozitiv</p>
            </Link>
          )}
        </div>

        {isSuperOwner && (
          <div className="admin-section">
            <h2>Gestionare Utilizatori</h2>
            <p className="section-description">
              Vizualizează și promovează utilizatori la SuperOwner
            </p>
            
            {message && (
              <div className={`message ${message.includes('Eroare') ? 'error' : 'success'}`}>
                {message}
              </div>
            )}

            {isLoadingUsers ? (
              <LoadingSpinner />
            ) : (
              <div className="users-table-wrapper">
                {users.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <p>Nu există utilizatori în sistem.</p>
                  </div>
                ) : (
                  <div className="users-table-container">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Nume</th>
                          <th>Email</th>
                          <th>Rol</th>
                          <th>Status</th>
                          <th>Acțiuni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="username-cell">
                              <span className="username-text">{user.username}</span>
                            </td>
                            <td className="name-cell">
                              {user.firstName} {user.lastName}
                            </td>
                            <td className="email-cell">{user.email}</td>
                            <td>
                              <span className={`role-badge ${isSuperOwnerUser(user.roles) ? 'role-superowner' : user.roles.includes('ROLE_ADMIN') ? 'role-vendor' : 'role-client'}`}>
                                {getRoleDisplay(user.roles)}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${user.verified ? 'status-verified' : 'status-unverified'}`}>
                                {user.verified ? (
                                  <>
                                    <span className="status-icon">✓</span>
                                    <span>Verificat</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="status-icon">⏳</span>
                                    <span>Neconfirmat</span>
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="actions-cell">
                              {!isSuperOwnerUser(user.roles) && user.username !== currentUser?.username && (
                                <button
                                  className="btn-promote"
                                  onClick={() => handlePromoteToSuperOwner(user.username)}
                                  disabled={promotingUser === user.username}
                                >
                                  {promotingUser === user.username ? (
                                    <>
                                      <span className="spinner-small"></span>
                                      <span>Se procesează...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>⭐</span>
                                      <span>Promovează la SuperOwner</span>
                                    </>
                                  )}
                                </button>
                              )}
                              {isSuperOwnerUser(user.roles) && (
                                <span className="action-text">Deja SuperOwner</span>
                              )}
                              {user.username === currentUser?.username && (
                                <span className="action-text current-user">Tu</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
