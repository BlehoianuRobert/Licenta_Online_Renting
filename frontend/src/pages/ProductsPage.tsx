import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { Product } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import ProductFilters from '../components/common/ProductFilters';
import { formatCurrency } from '../utils/helpers';
import { getImageUrl } from '../utils/imageHelper';
import { ROUTES } from '../utils/constants';
import './ProductsPage.css';

const ProductsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Read filters from URL query params
  const filters = {
    category: searchParams.get('category') || undefined,
    brand: searchParams.get('brand') || undefined,
    model: searchParams.get('model') || undefined,
    search: searchParams.get('search') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sortBy: (searchParams.get('sortBy') as 'relevance' | 'priceAsc' | 'priceDesc' | 'nameAsc' | 'newest' | null) || 'relevance',
  };

  const hasActiveServerFilters = Boolean(
    filters.category ||
      filters.brand ||
      filters.model ||
      filters.search ||
      typeof filters.minPrice === 'number' ||
      typeof filters.maxPrice === 'number' ||
      (filters.sortBy && filters.sortBy !== 'relevance')
  );

  useEffect(() => {
    loadProducts();
  }, [searchParams]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError('');
      const raw = await productService.getAllProducts({
        category: filters.category,
        brand: filters.brand,
        model: filters.model,
      });
      const data: Product[] = Array.isArray(raw)
        ? raw.map((p) => ({
            ...p,
            dailyPrice:
              typeof p.dailyPrice === 'number'
                ? p.dailyPrice
                : parseFloat(String(p.dailyPrice ?? 0)) || 0,
          }))
        : [];

      const normalizedSearch = (filters.search || '').trim().toLowerCase();
      const filtered = data.filter((product) => {
        if (
          normalizedSearch &&
          !`${product.name} ${product.description} ${product.brand || ''} ${product.model || ''}`
            .toLowerCase()
            .includes(normalizedSearch)
        ) {
          return false;
        }

        if (typeof filters.minPrice === 'number' && product.dailyPrice < filters.minPrice) {
          return false;
        }

        if (typeof filters.maxPrice === 'number' && product.dailyPrice > filters.maxPrice) {
          return false;
        }

        return true;
      });

      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'priceAsc':
            return a.dailyPrice - b.dailyPrice;
          case 'priceDesc':
            return b.dailyPrice - a.dailyPrice;
          case 'nameAsc':
            return a.name.localeCompare(b.name);
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          default:
            return 0;
        }
      });

      setProducts(filtered);
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.message || err?.message;
      setError(
        status
          ? `Eroare la încărcarea produselor (HTTP ${status}). ${detail || ''}`.trim()
          : 'Eroare la încărcarea produselor. Verifică că API-ul rulează și deschizi aplicația pe portul corect (ex. http://localhost:3000 cu Docker).'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters: {
    category?: string;
    brand?: string;
    model?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'relevance' | 'priceAsc' | 'priceDesc' | 'nameAsc' | 'newest';
  }) => {
    // Build query string
    const params = new URLSearchParams();
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.brand) params.set('brand', newFilters.brand);
    if (newFilters.model) params.set('model', newFilters.model);
    if (newFilters.search) params.set('search', newFilters.search);
    if (typeof newFilters.minPrice === 'number') params.set('minPrice', String(newFilters.minPrice));
    if (typeof newFilters.maxPrice === 'number') params.set('maxPrice', String(newFilters.maxPrice));
    if (newFilters.sortBy && newFilters.sortBy !== 'relevance') params.set('sortBy', newFilters.sortBy);
    
    const queryString = params.toString();
    const newPath = queryString ? `${ROUTES.PRODUCTS}?${queryString}` : ROUTES.PRODUCTS;
    
    // Navigate to products page with filters applied
    navigate(newPath);
  };

  const setGridView = useCallback(() => setViewMode('grid'), []);
  const setListView = useCallback(() => setViewMode('list'), []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="products-page">
      <div className="container catalog-page-inner">
        <header className="catalog-page-header">
          <div className="page-title-block">
            <div className="page-eyebrow">Platformă de închiriere</div>
            <h1>Catalog Produse</h1>
            <p className="results-count">
              <strong>{products.length}</strong>{' '}
              {products.length === 1 ? 'produs' : 'produse'}
              {hasActiveServerFilters ? ' după filtre' : ' disponibile'}
            </p>
          </div>
          <div className="view-toggles" role="group" aria-label="Vizualizare catalog">
            <button
              type="button"
              className={`view-btn${viewMode === 'grid' ? ' active' : ''}`}
              title="Grid"
              aria-pressed={viewMode === 'grid'}
              onClick={setGridView}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              type="button"
              className={`view-btn${viewMode === 'list' ? ' active' : ''}`}
              title="List"
              aria-pressed={viewMode === 'list'}
              onClick={setListView}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        <div className="products-layout">
          <div className="catalog-filters-bar">
            <ProductFilters filters={filters} onFilterChange={handleFilterChange} />
          </div>

          <main className="products-content">
            {hasActiveServerFilters && products.length === 0 && (
              <div className="results-info" role="status">
                <p>Nu s-au găsit produse pentru filtrele selectate.</p>
              </div>
            )}

            <div className={`products-grid${viewMode === 'list' ? ' products-grid--list' : ''}`}>
              {products.map((product) => (
                <Link key={product.id} to={`/products/${product.id}`} className="product-card">
                  <div className="product-image">
                    {product.imageUrl ? (
                      <img src={getImageUrl(product.imageUrl)} alt={product.name} className="card-img" />
                    ) : (
                      <div className="product-placeholder card-img-placeholder" aria-hidden>
                        📦
                      </div>
                    )}
                    <span className="availability-badge badge-available">Disponibil</span>
                  </div>
                  <div className="product-info">
                    <div className="product-tags card-tags">
                      {product.brand && <span className="tag">{product.brand}</span>}
                      {product.model && <span className="tag tag-model">{product.model}</span>}
                      <span className="tag tag-cat">{product.category}</span>
                    </div>
                    <h3 className="card-title">{product.name}</h3>
                    <p className="product-description card-desc">{product.description}</p>
                    <div className="card-footer product-card-footer">
                      <div className="price-block">
                        <span className="price-amount">{formatCurrency(product.dailyPrice)}</span>
                        <span className="price-per">/ zi</span>
                      </div>
                      <span className="btn-rent">Detalii →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {products.length === 0 && !hasActiveServerFilters && (
              <p className="no-products">Nu există produse în baza de date folosită de aplicație.</p>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
