import React, { useEffect, useState } from 'react';
import { superOwnerService } from '../services/superOwnerService';
import { SuperOwnerStatistics } from '../types';
import { formatCurrency } from '../utils/helpers';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import './SuperOwnerStatisticsPage.css';

const SuperOwnerStatisticsPage: React.FC = () => {
  const [data, setData] = useState<SuperOwnerStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setIsLoading(true);
      setError('');
      const stats = await superOwnerService.getStatistics();
      setData(stats);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Eroare la incarcare statistici.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!data) {
    return <div className="error-message">Nu exista date disponibile.</div>;
  }

  return (
    <div className="superowner-stats-page">
      <div className="container">
        <h1>Statistici SuperOwner</h1>

        <div className="stats-overview-grid">
          <div className="stats-box">
            <span className="stats-label">Venit total</span>
            <strong>{formatCurrency(data.totalIncome)}</strong>
          </div>
          <div className="stats-box">
            <span className="stats-label">Cheltuieli totale</span>
            <strong>{formatCurrency(data.totalExpenses)}</strong>
          </div>
          <div className="stats-box">
            <span className="stats-label">Profit net</span>
            <strong>{formatCurrency(data.totalNetProfit)}</strong>
          </div>
          <div className="stats-box">
            <span className="stats-label">Inchirieri contorizate</span>
            <strong>{data.totalRentals}</strong>
          </div>
        </div>

        <div className="stats-table-wrapper">
          <h2>Statistici pe fiecare produs</h2>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Produs</th>
                <th>Categorie</th>
                <th>Inchirieri</th>
                <th>Venit</th>
                <th>Cheltuieli</th>
                <th>Profit net</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((product) => (
                <tr key={product.productId}>
                  <td>{product.productName}</td>
                  <td>{product.category || '-'}</td>
                  <td>{product.rentalCount}</td>
                  <td>{formatCurrency(product.income)}</td>
                  <td>{formatCurrency(product.expenses)}</td>
                  <td>{formatCurrency(product.netProfit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperOwnerStatisticsPage;
