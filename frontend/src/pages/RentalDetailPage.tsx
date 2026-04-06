import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { rentalService } from '../services/rentalService';
import { Rental } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatDate, formatCurrency } from '../utils/helpers';
import { RENTAL_STATUSES } from '../utils/constants';
import { ROUTES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import './RentalDetailPage.css';

const RentalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [rental, setRental] = useState<Rental | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (id) {
      loadRental();
    }
  }, [id]);

  const loadRental = async () => {
    try {
      setIsLoading(true);
      const data = await rentalService.getRentalById(Number(id));
      setRental(data);
    } catch (error) {
      console.error('Error loading rental:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!rental) {
    return <div>Închirierea nu a fost găsită.</div>;
  }

  return (
    <div className="rental-detail-page">
      <div className="container">
        <Link to={ROUTES.MY_RENTALS} className="back-link">← Înapoi la închirieri</Link>
        
        <div className="rental-detail-card">
          <h1>Detalii Închiriere</h1>
          
          <div className="rental-detail-info">
            <div className="info-row">
              <span className="info-label">Produs:</span>
              <span className="info-value">
                {rental.productName || rental.inventoryUnit?.product?.name || 'N/A'}
              </span>
            </div>
            
            {rental.renterName && (
              <div className="info-row">
                <span className="info-label">Închiriat de:</span>
                <span className="info-value">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontWeight: 500 }}>{rental.renterName}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      @{rental.renterUsername}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                      {rental.renterEmail}
                    </span>
                  </div>
                </span>
              </div>
            )}
            
            <div className="info-row">
              <span className="info-label">Data început:</span>
              <span className="info-value">{formatDate(rental.startDate)}</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Data sfârșit:</span>
              <span className="info-value">{formatDate(rental.endDate)}</span>
            </div>
            
            {rental.actualReturnDate && (
              <div className="info-row">
                <span className="info-label">Data returnare:</span>
                <span className="info-value">{formatDate(rental.actualReturnDate)}</span>
              </div>
            )}
            
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className={`status-badge status-${rental.status.toLowerCase()}`}>
                {RENTAL_STATUSES[rental.status] || rental.status}
              </span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Preț total:</span>
              <span className="info-value price">{formatCurrency(rental.totalPrice)}</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Depozit (30%):</span>
              <span className="info-value">{formatCurrency(rental.depositAmount)}</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Status depozit:</span>
              <span className="info-value">
                {rental.depositReturned ? (
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ Returnat</span>
                ) : rental.itemCondition === 'DAMAGED' ? (
                  <span style={{ color: 'var(--error)', fontWeight: 700 }}>✗ Reținut (produs deteriorat)</span>
                ) : rental.itemCondition === 'GOOD' ? (
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ Va fi returnat</span>
                ) : (
                  <span style={{ color: 'var(--text-tertiary)' }}>În așteptare verificare</span>
                )}
              </span>
            </div>
            
            {rental.itemCondition !== 'PENDING_CHECK' && (
              <div className="info-row">
                <span className="info-label">Stare produs:</span>
                <span className="info-value">
                  {rental.itemCondition === 'GOOD' ? '✓ Stare bună' : '✗ Deteriorat'}
                </span>
              </div>
            )}
            
            {rental.conditionNotes && (
              <div className="info-row">
                <span className="info-label">Note verificare:</span>
                <span className="info-value">{rental.conditionNotes}</span>
              </div>
            )}

            {/* Delivery/Pickup Information */}
            {rental.deliveryType && (
              <>
                <div className="info-section-divider"></div>
                <h2 className="info-section-title">Informații Livrare/Preluare</h2>
                
                <div className="info-row">
                  <span className="info-label">Metodă:</span>
                  <span className="info-value">
                    {rental.deliveryType === 'PERSONAL_PICKUP' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>🚶</span>
                        <span>Ridicare personală</span>
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>🚚</span>
                        <span>Livrare la domiciliu</span>
                      </span>
                    )}
                  </span>
                </div>

                {rental.deliveryType === 'DELIVERY' && (
                  <>
                    {rental.deliveryAddress && (
                      <div className="info-row">
                        <span className="info-label">Adresă livrare:</span>
                        <span className="info-value">{rental.deliveryAddress}</span>
                      </div>
                    )}
                    
                    {rental.deliveryPhone && (
                      <div className="info-row">
                        <span className="info-label">Telefon livrare:</span>
                        <span className="info-value">{rental.deliveryPhone}</span>
                      </div>
                    )}

                    {rental.estimatedDeliveryDate && (
                      <div className="info-row">
                        <span className="info-label">Data estimată livrare:</span>
                        <span className="info-value">{formatDate(rental.estimatedDeliveryDate)}</span>
                      </div>
                    )}

                    {rental.actualDeliveryDate && (
                      <div className="info-row">
                        <span className="info-label">Data livrare efectivă:</span>
                        <span className="info-value">{formatDate(rental.actualDeliveryDate)}</span>
                      </div>
                    )}
                  </>
                )}

                {rental.deliveryType === 'PERSONAL_PICKUP' && rental.pickupDate && (
                  <div className="info-row">
                    <span className="info-label">Data preluare:</span>
                    <span className="info-value">{formatDate(rental.pickupDate)}</span>
                  </div>
                )}

                {rental.awbNumber && (
                  <div className="info-row awb-row">
                    <span className="info-label">Număr AWB:</span>
                    <span className="info-value awb-number">{rental.awbNumber}</span>
                  </div>
                )}

                {rental.deliveryStatus && (
                  <div className="info-row">
                    <span className="info-label">Status livrare:</span>
                    <span className={`status-badge status-${rental.deliveryStatus.toLowerCase().replace('_', '-')}`}>
                      {rental.deliveryStatus === 'PENDING' && '⏳ În așteptare'}
                      {rental.deliveryStatus === 'IN_TRANSIT' && '🚚 În tranzit'}
                      {rental.deliveryStatus === 'DELIVERED' && '✅ Livrat'}
                      {rental.deliveryStatus === 'RETURNED' && '↩️ Returnat'}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalDetailPage;
