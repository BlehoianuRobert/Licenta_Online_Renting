import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    loadProducts();
  }, [searchParams]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await productService.getAllProducts({
        category: filters.category,
        brand: filters.brand,
        model: filters.model,
      });

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
      setError('Eroare la încărcarea produselor');
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


  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="products-page">
      <div className="container">
        <h1>Catalog Produse</h1>
        
        <div className="products-layout">
          <aside className="filters-sidebar">
            <ProductFilters filters={filters} onFilterChange={handleFilterChange} />
          </aside>
          
          <main className="products-content">
            {isLoading ? (
              <LoadingSpinner />
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <>
                {Object.keys(filters).some(key => filters[key as keyof typeof filters]) && (
                  <div className="results-info">
                    <p>
                      {products.length === 0 
                        ? 'Nu s-au găsit produse pentru filtrele selectate'
                        : `Găsite ${products.length} ${products.length === 1 ? 'produs' : 'produse'}`
                      }
                    </p>
                  </div>
                )}
                
                <div className="products-grid">
                  {products.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      className="product-card"
                    >
                      <div className="product-image">
                        {product.imageUrl ? (
                          <img src={getImageUrl(product.imageUrl)} alt={product.name} />
                        ) : (
                          <div className="product-placeholder">Fără imagine</div>
                        )}
                      </div>
                      <div className="product-info">
                        <h3>{product.name}</h3>
                        <div className="product-meta">
                          {product.brand && (
                            <span className="product-brand">{product.brand}</span>
                          )}
                          {product.model && (
                            <span className="product-model">{product.model}</span>
                          )}
                        </div>
                        <p className="product-category">{product.category}</p>
                        <p className="product-description">{product.description}</p>
                        <p className="product-price">{formatCurrency(product.dailyPrice)}/zi</p>
                      </div>
                    </Link>
                  ))}
                </div>
                
                {products.length === 0 && !Object.keys(filters).some(key => filters[key as keyof typeof filters]) && (
                  <p className="no-products">Nu există produse disponibile.</p>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
