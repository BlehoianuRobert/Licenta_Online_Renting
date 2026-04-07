import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { rentalService } from '../services/rentalService';
import { Rental } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatDate, formatCurrency } from '../utils/helpers';
import { RENTAL_STATUSES } from '../utils/constants';
import { ROUTES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageHelper';
import './RentalDetailPage.css';

const RentalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [rental, setRental] = useState<Rental | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const [handoverFiles, setHandoverFiles] = useState<File[]>([]);
  const [preReturnFiles, setPreReturnFiles] = useState<File[]>([]);
  const [photoBusy, setPhotoBusy] = useState<'handover' | 'preReturn' | null>(null);
  const [compareBusy, setCompareBusy] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);

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

  const isRenter = currentUser != null && Number(currentUser.id) === Number(rental.userId);
  const canRunAiCompare =
    isRenter ||
    currentUser?.role === 'ROLE_ADMIN' ||
    currentUser?.role === 'ROLE_SUPEROWNER';

  const uploadHandover = async () => {
    if (handoverFiles.length === 0) return;
    setPhotoMsg(null);
    setPhotoBusy('handover');
    try {
      await rentalService.uploadRentalPhotos(rental.id, 'HANDOVER', handoverFiles);
      setHandoverFiles([]);
      await loadRental();
      setPhotoMsg('Fotografiile la predare au fost încărcate.');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPhotoMsg(msg || 'Eroare la încărcarea fotografiilor (predare).');
    } finally {
      setPhotoBusy(null);
    }
  };

  const uploadPreReturn = async () => {
    if (preReturnFiles.length === 0) return;
    setPhotoMsg(null);
    setPhotoBusy('preReturn');
    try {
      await rentalService.uploadRentalPhotos(rental.id, 'PRE_RETURN', preReturnFiles);
      setPreReturnFiles([]);
      await loadRental();
      setPhotoMsg('Fotografiile înainte de returnare au fost încărcate.');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPhotoMsg(msg || 'Eroare la încărcarea fotografiilor (returnare).');
    } finally {
      setPhotoBusy(null);
    }
  };

  const runCompare = async () => {
    setPhotoMsg(null);
    setCompareBusy(true);
    try {
      await rentalService.compareRentalPhotos(rental.id);
      await loadRental();
      setPhotoMsg('Comparația AI a fost rulată. Vezi rezultatul mai jos.');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPhotoMsg(msg || 'Eroare la comparația AI.');
    } finally {
      setCompareBusy(false);
    }
  };

  let aiDisplay: string | null = null;
  if (rental.aiComparisonJson) {
    try {
      const parsed = JSON.parse(rental.aiComparisonJson) as unknown;
      aiDisplay = JSON.stringify(parsed, null, 2);
    } catch {
      aiDisplay = rental.aiComparisonJson;
    }
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

          <div className="rental-photos-section">
            <h2 className="info-section-title">Fotografii închiriere</h2>
            <p className="rental-photos-intro">
              Ca <strong>chiriaș</strong>, încarcă poze la <strong>predare</strong> (când primești produsul) și{' '}
              <strong>înainte de returnare</strong>. Proprietarul/adminul poate rula comparația AI după ce există ambele seturi.
            </p>
            {photoMsg && <div className="rental-photos-banner">{photoMsg}</div>}

            <div className="rental-photo-grid">
              <div>
                <h3>La predare (HANDOVER)</h3>
                <div className="rental-photo-thumbs">
                  {(rental.handoverPhotoUrls || []).map((url) => (
                    <a key={url} href={getImageUrl(url)} target="_blank" rel="noreferrer">
                      <img src={getImageUrl(url)} alt="Predare" />
                    </a>
                  ))}
                  {(rental.handoverPhotoUrls || []).length === 0 && (
                    <span className="rental-photo-empty">Nicio fotografie încă</span>
                  )}
                </div>
                {isRenter && (
                  <div className="rental-photo-upload">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setHandoverFiles(Array.from(e.target.files || []))}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={photoBusy === 'handover' || handoverFiles.length === 0}
                      onClick={uploadHandover}
                    >
                      {photoBusy === 'handover' ? 'Se încarcă…' : 'Încarcă la predare'}
                    </button>
                  </div>
                )}
              </div>
              <div>
                <h3>Înainte de returnare (PRE_RETURN)</h3>
                <div className="rental-photo-thumbs">
                  {(rental.preReturnPhotoUrls || []).map((url) => (
                    <a key={url} href={getImageUrl(url)} target="_blank" rel="noreferrer">
                      <img src={getImageUrl(url)} alt="Înainte de returnare" />
                    </a>
                  ))}
                  {(rental.preReturnPhotoUrls || []).length === 0 && (
                    <span className="rental-photo-empty">Nicio fotografie încă</span>
                  )}
                </div>
                {isRenter && (
                  <div className="rental-photo-upload">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setPreReturnFiles(Array.from(e.target.files || []))}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={photoBusy === 'preReturn' || preReturnFiles.length === 0}
                      onClick={uploadPreReturn}
                    >
                      {photoBusy === 'preReturn' ? 'Se încarcă…' : 'Încarcă înainte de returnare'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {canRunAiCompare && (
              <div className="rental-ai-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={compareBusy}
                  onClick={runCompare}
                >
                  {compareBusy ? 'Se analizează…' : 'Compară fotografiile cu AI'}
                </button>
              </div>
            )}

            {aiDisplay && (
              <div className="rental-ai-result">
                <h3>Rezultat comparație AI</h3>
                {rental.aiComparisonAt && (
                  <p className="rental-ai-meta">
                    {new Date(rental.aiComparisonAt).toLocaleString('ro-RO')}
                  </p>
                )}
                <pre>{aiDisplay}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalDetailPage;
