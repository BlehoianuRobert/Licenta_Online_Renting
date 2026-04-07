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

  useEffect(() => {
    if (brands.length === 1 && !pendingFilters.brand && pendingFilters.category && !loadingBrands) {
      const singleBrand = brands[0];
      setPendingFilters({
        ...pendingFilters,
        category: pendingFilters.category,
        brand: singleBrand,
        model: undefined,
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

  const hasPendingChanges =
    JSON.stringify({
      ...pendingFilters,
      sortBy: pendingFilters.sortBy || 'relevance',
    }) !==
    JSON.stringify({
      ...filters,
      sortBy: filters.sortBy || 'relevance',
    });

  return (
    <div className="product-filters product-filters--horizontal" role="search" aria-label="Filtre catalog produse">
      <h2 className="filters-sr-only">Filtre</h2>

      <div className="filters-toolbar">
        <div className="filters-flex-row filters-flex-row--primary">
          <div className="filter-group filter-group--search">
            <label className="filter-inline-label" htmlFor="filter-search-input">
              Căutare produs
            </label>
            <input
              id="filter-search-input"
              className="filter-input"
              type="search"
              placeholder="Nume, descriere, brand, model…"
              value={pendingFilters.search || ''}
              onChange={(e) =>
                setPendingFilters({
                  ...pendingFilters,
                  search: e.target.value || undefined,
                })
              }
            />
          </div>

          <div className="filter-group filter-group--price">
            <span className="filter-inline-label" id="filter-price-label">
              Preț / zi (RON)
            </span>
            <div className="price-inputs price-inputs--inline" role="group" aria-labelledby="filter-price-label">
              <input
                id="filter-min-price"
                className="filter-input filter-input--price"
                type="number"
                min={0}
                placeholder="Min"
                aria-label="Preț minim"
                value={pendingFilters.minPrice ?? ''}
                onChange={(e) =>
                  setPendingFilters({
                    ...pendingFilters,
                    minPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
              <input
                id="filter-max-price"
                className="filter-input filter-input--price"
                type="number"
                min={0}
                placeholder="Max"
                aria-label="Preț maxim"
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

          <div className="filter-group filter-group--sort">
            <label className="filter-inline-label" htmlFor="filter-sort-select">
              Sortare
            </label>
            <select
              id="filter-sort-select"
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
              <option value="relevance">Relevanță</option>
              <option value="priceAsc">Preț crescător</option>
              <option value="priceDesc">Preț descrescător</option>
              <option value="nameAsc">Nume A-Z</option>
              <option value="newest">Cele mai noi</option>
            </select>
          </div>

          <div className="filter-group filter-group--actions">
            <button
              type="button"
              className="btn btn-secondary btn-filter-action"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              Resetează
            </button>
            <button
              type="button"
              className="btn btn-primary btn-filter-action"
              onClick={() => onFilterChange(pendingFilters)}
              disabled={!hasPendingChanges}
            >
              Aplică
            </button>
          </div>
        </div>

        <div className="filters-flex-row filters-flex-row--secondary">
          <div className="filter-secondary-block">
            <span className="filter-inline-label filter-inline-label--row">Categorie</span>
            <div className="filter-options filter-options--horizontal">
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
              {categories.length === 0 && <p className="no-options">Nu există categorii</p>}
            </div>
          </div>

          {pendingFilters.category && brands.length > 1 && (
            <div className="filter-secondary-block">
              <span className="filter-inline-label filter-inline-label--row">Brand</span>
              {loadingBrands ? (
                <div className="loading-filters">Se încarcă…</div>
              ) : (
                <div className="filter-options filter-options--horizontal">
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
                    <p className="no-options">Nu există branduri pentru această categorie</p>
                  )}
                </div>
              )}
            </div>
          )}

          {pendingFilters.category && pendingFilters.brand && (
            <div className="filter-secondary-block">
              <span className="filter-inline-label filter-inline-label--row">Model</span>
              {loadingModels ? (
                <div className="loading-filters">Se încarcă…</div>
              ) : (
                <div className="filter-options filter-options--horizontal">
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
                    <p className="no-options">Nu există modele pentru acest brand</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {hasPendingChanges && (
        <p className="pending-changes-indicator">Ai modificări neaplicate — apasă „Aplică”.</p>
      )}
    </div>
  );
};

export default ProductFilters;
