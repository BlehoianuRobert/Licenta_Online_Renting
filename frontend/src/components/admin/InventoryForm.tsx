import React, { useState } from 'react';
import { InventoryRequest } from '../../types';
import { productService } from '../../services/productService';
import './InventoryForm.css';

interface InventoryFormProps {
  productId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const InventoryForm: React.FC<InventoryFormProps> = ({ productId, onSuccess, onCancel }) => {
  const [serialNumber, setSerialNumber] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const request: InventoryRequest = {
        productId,
        serialNumber: serialNumber.trim(),
      };
      await productService.addInventoryUnit(request);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Eroare la adăugarea unității de inventar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="inventory-form-overlay" onClick={onCancel}>
      <div className="inventory-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2>Adaugă Unitate de Inventar</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="inventory-form">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Număr de Serie *</label>
            <input
              type="text"
              className="form-input"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="SN-001"
              required
              maxLength={50}
            />
            <small className="form-hint">Numărul de serie trebuie să fie unic</small>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Anulează
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Se adaugă...' : 'Adaugă'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryForm;
