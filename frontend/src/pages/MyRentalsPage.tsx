import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { rentalService } from '../services/rentalService';
import { Rental } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatDate, formatCurrency } from '../utils/helpers';
import { RENTAL_STATUSES } from '../utils/constants';
import { ROUTES } from '../utils/constants';
import './MyRentalsPage.css';

const MyRentalsPage: React.FC = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    try {
      setIsLoading(true);
      const data = await rentalService.getMyRentals();
      setRentals(data);
    } catch (error) {
      console.error('Error loading rentals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="my-rentals-page">
      <div className="container">
        <h1>Închirierile mele</h1>
        
        {rentals.length === 0 ? (
          <div className="no-rentals">
            <p>Nu aveți închirieri.</p>
            <Link to={ROUTES.PRODUCTS} className="btn btn-primary">
              Vezi produse disponibile
            </Link>
          </div>
        ) : (
          <div className="rentals-list">
            {rentals.map((rental) => (
              <Link
                key={rental.id}
                to={`/rentals/${rental.id}`}
                className="rental-card"
              >
                <div className="rental-info">
                  <h3>
                    {rental.inventoryUnit?.product?.name || 'Produs'}
                  </h3>
                  <p className="rental-dates">
                    {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                  </p>
                  
                  {/* Delivery & AWB Info */}
                  {rental.deliveryType && (
                    <div style={{ 
                      marginTop: '0.75rem',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      backgroundColor: rental.deliveryType === 'DELIVERY' 
                        ? 'rgba(99, 102, 241, 0.08)' 
                        : 'rgba(107, 114, 128, 0.08)',
                      border: `1px solid ${rental.deliveryType === 'DELIVERY' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(107, 114, 128, 0.2)'}`
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: rental.deliveryType === 'DELIVERY' ? 'var(--primary)' : 'var(--text-secondary)',
                        marginBottom: rental.awbNumber ? '0.5rem' : '0'
                      }}>
                        <span>{rental.deliveryType === 'DELIVERY' ? '🚚' : '🚶'}</span>
                        <span>{rental.deliveryType === 'DELIVERY' ? 'Livrare la domiciliu' : 'Ridicare personală'}</span>
                      </div>
                      
                      {rental.awbNumber && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          backgroundColor: 'var(--success-light)',
                          border: '2px solid var(--success)',
                          marginTop: '0.5rem'
                        }}>
                          <span style={{ fontSize: '1.125rem' }}>📦</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: '#065f46',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Număr AWB
                            </span>
                            <span style={{ 
                              fontFamily: 'monospace',
                              fontSize: '0.875rem',
                              color: '#065f46',
                              fontWeight: 700,
                              letterSpacing: '0.05em'
                            }}>
                              {rental.awbNumber}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {rental.deliveryStatus && (
                        <div style={{
                          marginTop: '0.5rem',
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          backgroundColor: rental.deliveryStatus === 'DELIVERED' 
                            ? 'var(--success-light)' 
                            : rental.deliveryStatus === 'IN_TRANSIT'
                            ? 'var(--info-light)'
                            : 'rgba(107, 114, 128, 0.1)',
                          color: rental.deliveryStatus === 'DELIVERED'
                            ? '#065f46'
                            : rental.deliveryStatus === 'IN_TRANSIT'
                            ? '#1e40af'
                            : 'var(--text-secondary)',
                          fontWeight: 600,
                          display: 'inline-block'
                        }}>
                          {rental.deliveryStatus === 'PENDING' && '⏳ În așteptare'}
                          {rental.deliveryStatus === 'IN_TRANSIT' && '🚚 În tranzit'}
                          {rental.deliveryStatus === 'DELIVERED' && '✅ Livrat'}
                          {rental.deliveryStatus === 'RETURNED' && '↩️ Returnat'}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <p className="rental-price">{formatCurrency(rental.totalPrice)}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Depozit: {formatCurrency(rental.depositAmount)}
                      {rental.depositReturned && (
                        <span style={{ color: 'var(--success)', marginLeft: '0.5rem' }}>✓ Returnat</span>
                      )}
                      {rental.itemCondition === 'DAMAGED' && !rental.depositReturned && (
                        <span style={{ color: 'var(--error)', marginLeft: '0.5rem' }}>✗ Reținut</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="rental-meta">
                  <span className={`status-badge status-${rental.status.toLowerCase()}`}>
                    {RENTAL_STATUSES[rental.status] || rental.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRentalsPage;
