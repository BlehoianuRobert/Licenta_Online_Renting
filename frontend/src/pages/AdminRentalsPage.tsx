import React, { useEffect, useState } from 'react';
import { rentalService } from '../services/rentalService';
import { Rental, RentalStatus, ItemCondition, ConditionCheckRequest } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatDate, formatCurrency } from '../utils/helpers';
import { RENTAL_STATUSES } from '../utils/constants';
import ConfirmModal from '../components/common/ConfirmModal';
import './AdminRentalsPage.css';

const AdminRentalsPage: React.FC = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteRental, setDeleteRental] = useState<Rental | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [checkingCondition, setCheckingCondition] = useState<number | null>(null);
  const [conditionModal, setConditionModal] = useState<Rental | null>(null);
  const [conditionNotes, setConditionNotes] = useState('');
  const [generatingAwb, setGeneratingAwb] = useState<number | null>(null);

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    try {
      setIsLoading(true);
      const data = await rentalService.getAllRentals();
      setRentals(data);
    } catch (error) {
      console.error('Error loading rentals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (rentalId: number, newStatus: RentalStatus) => {
    try {
      setUpdatingStatus(rentalId);
      await rentalService.updateRentalStatus(rentalId, newStatus);
      await loadRentals();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Eroare la actualizarea statusului');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteRental = (rental: Rental) => {
    setDeleteRental(rental);
  };

  const confirmDeleteRental = async () => {
    if (!deleteRental) return;

    try {
      await rentalService.deleteRental(deleteRental.id);
      await loadRentals();
      setDeleteRental(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Eroare la ștergerea închirierii');
    }
  };

  const handleCheckCondition = (rental: Rental) => {
    setConditionModal(rental);
    setConditionNotes('');
  };

  const confirmConditionCheck = async (condition: ItemCondition) => {
    if (!conditionModal) return;

    try {
      setCheckingCondition(conditionModal.id);
      const request: ConditionCheckRequest = {
        condition,
        notes: conditionNotes.trim() || undefined,
      };
      await rentalService.checkItemCondition(conditionModal.id, request);
      await loadRentals();
      setConditionModal(null);
      setConditionNotes('');
      alert('Starea produsului a fost verificată și depozitul a fost procesat!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Eroare la verificarea stării produsului');
    } finally {
      setCheckingCondition(null);
    }
  };

  const handleGenerateAwb = async (rentalId: number) => {
    try {
      setGeneratingAwb(rentalId);
      const response = await rentalService.generateAwb(rentalId);
      // Extract AWB number from message (format: "AWB generat cu succes: RENT-YYYYMMDD-XXXX")
      const awbMatch = response.message?.match(/RENT-\d{8}-\d{4}/);
      const awbNumber = awbMatch ? awbMatch[0] : 'AWB generat';
      alert(`✅ AWB generat cu succes!\n\n📦 Număr AWB: ${awbNumber}\n\nAcest număr poate fi folosit pentru urmărirea livrării.`);
      await loadRentals();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Eroare la generarea AWB';
      alert(`❌ Eroare: ${errorMessage}`);
      console.error('AWB generation error:', error);
    } finally {
      setGeneratingAwb(null);
    }
  };

  const getConditionLabel = (condition: ItemCondition): string => {
    switch (condition) {
      case 'PENDING_CHECK':
        return 'În așteptare verificare';
      case 'GOOD':
        return 'Stare bună';
      case 'DAMAGED':
        return 'Deteriorat';
      default:
        return condition;
    }
  };

  const statusOptions: RentalStatus[] = [
    'PENDING',
    'CONFIRMED',
    'ACTIVE',
    'RETURNED',
    'COMPLETED',
    'CANCELED',
    'OVERDUE',
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="admin-rentals-page">
      <div className="container">
        <h1>Gestionare Închirieri</h1>
        
        <div className="rentals-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Produs</th>
                <th>Închiriat de</th>
                <th>Perioadă</th>
                <th>Preț Total</th>
                <th>Depozit</th>
                <th>Status</th>
                <th>Livrare</th>
                <th>Stare Produs</th>
                <th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map((rental) => (
                <tr key={rental.id}>
                  <td>{rental.id}</td>
                  <td>{rental.productName || rental.inventoryUnit?.product?.name || 'N/A'}</td>
                  <td>
                    {rental.renterName ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontWeight: '500' }}>{rental.renterName}</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          @{rental.renterUsername}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {rental.renterEmail}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>N/A</span>
                    )}
                  </td>
                  <td>
                    {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                  </td>
                  <td>{formatCurrency(rental.totalPrice)}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span>{formatCurrency(rental.depositAmount)}</span>
                      {rental.depositReturned ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>✓ Returnat</span>
                      ) : rental.itemCondition === 'DAMAGED' ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--error)' }}>✗ Reținut</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>În așteptare</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <select
                      className="status-select"
                      value={rental.status}
                      onChange={(e) => handleStatusChange(rental.id, e.target.value as RentalStatus)}
                      disabled={updatingStatus === rental.id}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {RENTAL_STATUSES[status] || status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {rental.status === 'RETURNED' && rental.itemCondition === 'PENDING_CHECK' ? (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleCheckCondition(rental)}
                        disabled={checkingCondition === rental.id}
                      >
                        Verifică Stare
                      </button>
                    ) : (
                      <span style={{ 
                        fontSize: '0.875rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        backgroundColor: rental.itemCondition === 'GOOD' 
                          ? 'var(--success-light)' 
                          : rental.itemCondition === 'DAMAGED'
                          ? 'var(--error-light)'
                          : 'var(--bg-tertiary)',
                        color: rental.itemCondition === 'GOOD'
                          ? '#065f46'
                          : rental.itemCondition === 'DAMAGED'
                          ? '#991b1b'
                          : 'var(--text-secondary)'
                      }}>
                        {getConditionLabel(rental.itemCondition)}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {/* Delivery Type */}
                      {rental.deliveryType && (
                        <div style={{ 
                          fontSize: '0.875rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          backgroundColor: rental.deliveryType === 'DELIVERY' 
                            ? 'rgba(99, 102, 241, 0.1)' 
                            : 'rgba(107, 114, 128, 0.1)',
                          color: rental.deliveryType === 'DELIVERY'
                            ? 'var(--primary)'
                            : 'var(--text-secondary)',
                          fontWeight: 600
                        }}>
                          {rental.deliveryType === 'DELIVERY' ? '🚚 Livrare' : '🚶 Ridicare'}
                        </div>
                      )}
                      
                      {/* AWB Section */}
                      {rental.deliveryType === 'DELIVERY' && (
                        <>
                          {rental.awbNumber ? (
                            <div style={{ 
                              fontSize: '0.875rem',
                              padding: '0.5rem',
                              borderRadius: '0.25rem',
                              backgroundColor: 'var(--success-light)',
                              color: '#065f46',
                              fontWeight: 700,
                              border: '2px solid var(--success)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <span>📦</span>
                              <span style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                                {rental.awbNumber}
                              </span>
                            </div>
                          ) : (
                            <button 
                              className="btn btn-primary btn-sm" 
                              onClick={() => handleGenerateAwb(rental.id)}
                              disabled={generatingAwb === rental.id}
                              style={{ width: '100%' }}
                              title="Generează număr AWB pentru livrare"
                            >
                              {generatingAwb === rental.id ? '⏳ Generare...' : '📦 Generează AWB'}
                            </button>
                          )}
                        </>
                      )}
                      
                      {rental.deliveryStatus && (
                        <div style={{ 
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          backgroundColor: rental.deliveryStatus === 'DELIVERED' 
                            ? 'var(--success-light)' 
                            : rental.deliveryStatus === 'IN_TRANSIT'
                            ? 'var(--info-light)'
                            : 'var(--bg-tertiary)',
                          color: rental.deliveryStatus === 'DELIVERED'
                            ? '#065f46'
                            : rental.deliveryStatus === 'IN_TRANSIT'
                            ? '#1e40af'
                            : 'var(--text-secondary)',
                          fontWeight: 600
                        }}>
                          {rental.deliveryStatus === 'PENDING' && '⏳ În așteptare'}
                          {rental.deliveryStatus === 'IN_TRANSIT' && '🚚 În tranzit'}
                          {rental.deliveryStatus === 'DELIVERED' && '✅ Livrat'}
                          {rental.deliveryStatus === 'RETURNED' && '↩️ Returnat'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleDeleteRental(rental)}
                      >
                        Șterge
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rentals.length === 0 && (
            <div className="empty-state">
              <p>Nu există închirieri.</p>
            </div>
          )}
        </div>
      </div>

      {deleteRental && (
        <ConfirmModal
          title="Șterge Închiriere"
          message={`Ești sigur că vrei să ștergi închirierea #${deleteRental.id}? Această acțiune nu poate fi anulată.`}
          confirmText="Șterge"
          cancelText="Anulează"
          onConfirm={confirmDeleteRental}
          onCancel={() => setDeleteRental(null)}
          variant="danger"
        />
      )}

      {conditionModal && (
        <div className="condition-check-modal-overlay" onClick={() => setConditionModal(null)}>
          <div className="condition-check-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Verificare Stare Produs</h2>
              <button className="close-btn" onClick={() => setConditionModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>Produs:</strong> {conditionModal.inventoryUnit?.product?.name}</p>
              <p><strong>Depozit:</strong> {formatCurrency(conditionModal.depositAmount)}</p>
              <p style={{ marginBottom: '1.5rem' }}>
                <strong>Notă:</strong> Dacă produsul este în stare bună, depozitul va fi returnat. 
                Dacă este deteriorat, depozitul va fi reținut.
              </p>
              
              <div className="form-group">
                <label className="form-label">Starea produsului</label>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <button
                    className="btn btn-success"
                    onClick={() => confirmConditionCheck('GOOD')}
                    disabled={checkingCondition === conditionModal.id}
                  >
                    ✓ Stare Bună (Returnare depozit)
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => confirmConditionCheck('DAMAGED')}
                    disabled={checkingCondition === conditionModal.id}
                  >
                    ✗ Deteriorat (Reținere depozit)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Note (opțional)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  placeholder="Descrieți starea produsului sau eventuale daune..."
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRentalsPage;
