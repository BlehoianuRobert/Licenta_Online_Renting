import React, { useEffect, useState } from 'react';
import { productService } from '../../services/productService';
import './ProductFilters.css';

interface ProductFiltersProps {
  filters: {
    category?: string;
    brand?: string;
    model?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'relevance' | 'priceAsc' | 'priceDesc' | 'nameAsc' | 'newest';
  };
  onFilterChange: (filters: {
    category?: string;
    brand?: string;
    model?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'relevance' | 'priceAsc' | 'priceDesc' | 'nameAsc' | 'newest';
  }) => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({ filters, onFilterChange }) => {
  const [pendingFilters, setPendingFilters] = useState(filters);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setPendingFilters(filters);
  }, [filters]);

  useEffect(() => {
    if (filters.category) {
      loadBrands(filters.category, filters);
    } else {
      setBrands([]);
      setModels([]);
    }
  }, [filters.category, filters.brand, filters.model]);

  // Auto-select brand if only one brand is available
  useEffect(() => {
    if (brands.length === 1 && !pendingFilters.brand && pendingFilters.category && !loadingBrands) {
      const singleBrand = brands[0];
      setPendingFilters({
        ...pendingFilters,
        category: pendingFilters.category,
        brand: singleBrand, 
        model: undefined 
      });
    }
  }, [brands.length, loadingBrands, pendingFilters.category, pendingFilters.brand]);

  useEffect(() => {
    if (pendingFilters.category && pendingFilters.brand) {
      loadModels(pendingFilters.category, pendingFilters.brand, pendingFilters);
    } else {
      setModels([]);
    }
  }, [pendingFilters.category, pendingFilters.brand, pendingFilters.model]);

  const loadCategories = async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadBrands = async (
    category: string,
    activeFilters: typeof pendingFilters = pendingFilters
  ) => {
    try {
      setLoadingBrands(true);
      const data = await productService.getBrands(category);
      setBrands(data);
      // Reset brand and model if category changes
      if (activeFilters.brand && !data.includes(activeFilters.brand)) {
        setPendingFilters((prev) => ({ ...prev, category, brand: undefined, model: undefined }));
      }
    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      setLoadingBrands(false);
    }
  };

  const loadModels = async (
    category: string,
    brand: string,
    activeFilters: typeof pendingFilters = pendingFilters
  ) => {
    try {
      setLoadingModels(true);
      const data = await productService.getModels(category, brand);
      setModels(data);
      // Reset model if brand changes
      if (activeFilters.model && !data.includes(activeFilters.model)) {
        setPendingFilters((prev) => ({ ...prev, category, brand, model: undefined }));
      }
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    const newCategory = pendingFilters.category === category ? undefined : category;
    setPendingFilters((prev) => ({ ...prev, category: newCategory, brand: undefined, model: undefined }));
  };

  const handleBrandChange = (brand: string) => {
    const newBrand = pendingFilters.brand === brand ? undefined : brand;
    setPendingFilters((prev) => ({ ...prev, category: prev.category, brand: newBrand, model: undefined }));
  };

  const handleModelChange = (model: string) => {
    const newModel = pendingFilters.model === model ? undefined : model;
    setPendingFilters((prev) => ({ ...prev, category: prev.category, brand: prev.brand, model: newModel }));
  };

  const clearFilters = () => {
    setPendingFilters({
      category: undefined,
      brand: undefined,
      model: undefined,
      search: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: 'relevance',
    });
  };

  const hasActiveFilters = Boolean(
    pendingFilters.category ||
    pendingFilters.brand ||
    pendingFilters.model ||
    pendingFilters.search ||
    pendingFilters.minPrice ||
    pendingFilters.maxPrice ||
    (pendingFilters.sortBy && pendingFilters.sortBy !== 'relevance')
  );

  const hasPendingChanges = JSON.stringify({
    ...pendingFilters,
    sortBy: pendingFilters.sortBy || 'relevance',
  }) !== JSON.stringify({
    ...filters,
    sortBy: filters.sortBy || 'relevance',
  });

  return (
    <div className="product-filters">
      <div className="filters-header">
        <h2>Filtre</h2>
        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            Reseteaza filtrele
          </button>
        )}
      </div>

      <div className="filter-section">
        <h3 className="filter-section-title">Cautare produs</h3>
        <input
          className="filter-input"
          type="text"
          placeholder="Nume, descriere, brand, model..."
          value={pendingFilters.search || ''}
          onChange={(e) =>
            setPendingFilters({
              ...pendingFilters,
              search: e.target.value || undefined,
            })
          }
        />
      </div>

      <div className="filter-section">
        <h3 className="filter-section-title">Pret pe zi</h3>
        <div className="price-inputs">
          <input
            className="filter-input"
            type="number"
            min={0}
            placeholder="Min"
            value={pendingFilters.minPrice ?? ''}
            onChange={(e) =>
              setPendingFilters({
                ...pendingFilters,
                minPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
          <input
            className="filter-input"
            type="number"
            min={0}
            placeholder="Max"
            value={pendingFilters.maxPrice ?? ''}
            onChange={(e) =>
              setPendingFilters({
                ...pendingFilters,
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-section-title">Sortare</h3>
        <select
          className="filter-select"
          value={pendingFilters.sortBy || 'relevance'}
          onChange={(e) =>
            setPendingFilters({
              ...pendingFilters,
              sortBy: e.target.value as
                | 'relevance'
                | 'priceAsc'
                | 'priceDesc'
                | 'nameAsc'
                | 'newest',
            })
          }
        >
          <option value="relevance">Relevanta</option>
          <option value="priceAsc">Pret crescator</option>
          <option value="priceDesc">Pret descrescator</option>
          <option value="nameAsc">Nume A-Z</option>
          <option value="newest">Cele mai noi</option>
        </select>
      </div>

      <div className="filter-section">
        <h3 className="filter-section-title">Categorie</h3>
        <div className="filter-options">
          {categories.map((category) => (
            <label key={category} className="filter-option">
              <input
                type="checkbox"
                checked={pendingFilters.category === category}
                onChange={() => handleCategoryChange(category)}
              />
              <span>{category}</span>
            </label>
          ))}
          {categories.length === 0 && (
            <p className="no-options">Nu există categorii disponibile</p>
          )}
        </div>
      </div>

      {pendingFilters.category && brands.length > 1 && (
        <div className="filter-section">
          <h3 className="filter-section-title">Brand</h3>
          {loadingBrands ? (
            <div className="loading-filters">Se încarcă...</div>
          ) : (
            <div className="filter-options">
              {brands.map((brand) => (
                <label key={brand} className="filter-option">
                  <input
                    type="checkbox"
                    checked={pendingFilters.brand === brand}
                    onChange={() => handleBrandChange(brand)}
                  />
                  <span>{brand}</span>
                </label>
              ))}
              {brands.length === 0 && (
                <p className="no-options">Nu există branduri disponibile pentru această categorie</p>
              )}
            </div>
          )}
        </div>
      )}

      {pendingFilters.category && pendingFilters.brand && (
        <div className="filter-section">
          <h3 className="filter-section-title">Model</h3>
          {loadingModels ? (
            <div className="loading-filters">Se încarcă...</div>
          ) : (
            <div className="filter-options">
              {models.map((model) => (
                <label key={model} className="filter-option">
                  <input
                    type="checkbox"
                    checked={pendingFilters.model === model}
                    onChange={() => handleModelChange(model)}
                  />
                  <span>{model}</span>
                </label>
              ))}
              {models.length === 0 && (
                <p className="no-options">Nu există modele disponibile pentru acest brand</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="filters-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={clearFilters}
        >
          Reseteaza
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onFilterChange(pendingFilters)}
          disabled={!hasPendingChanges}
        >
          Aplica filtrele
        </button>
      </div>
      {hasPendingChanges && (
        <p className="pending-changes-indicator">Ai modificari neaplicate.</p>
      )}
    </div>
  );
};

export default ProductFilters;
