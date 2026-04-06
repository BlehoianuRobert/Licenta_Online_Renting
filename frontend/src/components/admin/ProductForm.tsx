import React, { useEffect, useState } from 'react';
import { Product, ProductRequest } from '../../types';
import { productService } from '../../services/productService';
import { uploadService } from '../../services/uploadService';
import { getImageUrl } from '../../utils/imageHelper';
import './ProductForm.css';

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

type ImageInputMode = 'url' | 'upload';

const ProductForm: React.FC<ProductFormProps> = ({ product, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<ProductRequest>({
    name: '',
    description: '',
    dailyPrice: 0,
    category: '',
    brand: '',
    model: '',
    imageUrl: '',
    discountPercent: 0,
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageMode, setImageMode] = useState<ImageInputMode>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  // Filter suggestions
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  
  // Dropdown visibility
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  // Filtered suggestions based on input
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<string[]>([]);
  const [filteredModels, setFilteredModels] = useState<string[]>([]);

  useEffect(() => {
    loadFilterSuggestions();
  }, []);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        dailyPrice: product.dailyPrice,
        category: product.category || '',
        brand: product.brand || '',
        model: product.model || '',
        imageUrl: product.imageUrl || '',
        discountPercent: product.discountPercent || 0,
      });
      
      // Set preview if image exists
      if (product.imageUrl) {
        setImagePreview(getImageUrl(product.imageUrl));
      }
    }
  }, [product]);

  useEffect(() => {
    if (formData.category) {
      loadBrandSuggestions(formData.category);
    } else {
      loadBrandSuggestions();
    }
  }, [formData.category]);

  useEffect(() => {
    if (formData.category && formData.brand) {
      loadModelSuggestions(formData.category, formData.brand);
    } else {
      loadModelSuggestions();
    }
  }, [formData.category, formData.brand]);

  const loadFilterSuggestions = async () => {
    try {
      setLoadingFilters(true);
      const [cats, brs, mods] = await Promise.all([
        productService.getCategories(),
        productService.getBrands(),
        productService.getModels(),
      ]);
      setCategories(cats);
      setBrands(brs);
      setModels(mods);
      setFilteredCategories(cats);
      setFilteredBrands(brs);
      setFilteredModels(mods);
    } catch (error) {
      console.error('Error loading filter suggestions:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadBrandSuggestions = async (category?: string) => {
    try {
      const brs = category 
        ? await productService.getBrands(category)
        : await productService.getBrands();
      setBrands(brs);
      setFilteredBrands(brs);
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const loadModelSuggestions = async (category?: string, brand?: string) => {
    try {
      const mods = (category && brand)
        ? await productService.getModels(category, brand)
        : await productService.getModels();
      setModels(mods);
      setFilteredModels(mods);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  useEffect(() => {
    // Update preview when imageUrl changes
    if (formData.imageUrl) {
      setImagePreview(getImageUrl(formData.imageUrl));
    } else {
      setImagePreview('');
    }
  }, [formData.imageUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'dailyPrice' || name === 'discountPercent' ? parseFloat(value) || 0 : value,
    }));

    // Filter suggestions based on input
    if (name === 'category') {
      setShowCategoryDropdown(true);
      const filtered = categories.filter(cat => 
        cat.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else if (name === 'brand') {
      setShowBrandDropdown(true);
      const filtered = brands.filter(br => 
        br.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredBrands(filtered);
    } else if (name === 'model') {
      setShowModelDropdown(true);
      const filtered = models.filter(mod => 
        mod.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredModels(filtered);
    }
  };

  const handleSelectSuggestion = (field: 'category' | 'brand' | 'model', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    if (field === 'category') {
      setShowCategoryDropdown(false);
      loadBrandSuggestions(value);
    } else if (field === 'brand') {
      setShowBrandDropdown(false);
      if (formData.category) {
        loadModelSuggestions(formData.category, value);
      }
    } else if (field === 'model') {
      setShowModelDropdown(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Fișierul trebuie să fie o imagine (JPG, PNG, etc.)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Fișierul este prea mare. Dimensiunea maximă este 10MB.');
        return;
      }

      setSelectedFile(file);
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return;

    setUploadingImage(true);
    setError('');
    setSuccessMessage('');

    try {
      console.log('Uploading file:', selectedFile.name, selectedFile.size, 'bytes');
      const imagePath = await uploadService.uploadImage(selectedFile);
      console.log('Upload successful, image path:', imagePath);
      
      // imagePath will be like "/images/filename.jpg"
      setFormData(prev => ({ ...prev, imageUrl: imagePath }));
      setSelectedFile(null);
      setSuccessMessage('Imagine încărcată cu succes!');
      setImageMode('url'); // Switch to URL mode to show the uploaded image URL
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Eroare la încărcarea imaginii';
      setError(errorMsg);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate required filter fields
    if (!formData.category || !formData.category.trim()) {
      setError('Tipul produsului (Categorie) este obligatoriu pentru filtrare.');
      return;
    }
    
    if (!formData.brand || !formData.brand.trim()) {
      setError('Brand-ul este obligatoriu pentru filtrare.');
      return;
    }
    
    if (!formData.model || !formData.model.trim()) {
      setError('Modelul este obligatoriu pentru filtrare.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Trim whitespace from filter fields
      const submitData = {
        ...formData,
        category: formData.category.trim(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
      };
      
      if (product) {
        await productService.updateProduct(product.id, submitData);
      } else {
        await productService.createProduct(submitData);
      }
      onSuccess();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Eroare la salvarea produsului';
      
      // Check if it's a data truncation error for image URL
      if (errorMessage.includes('image_url') || errorMessage.includes('too long')) {
        setError('URL-ul imaginii este prea lung. Dacă folosiți o imagine base64, vă rugăm să folosiți un serviciu de hosting de imagini (ex: Imgur, Cloudinary) sau să reduceți dimensiunea imaginii.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="product-form-overlay" onClick={onCancel}>
      <div className="product-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2>{product ? 'Editează Produs' : 'Adaugă Produs Nou'}</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          {error && <div className="alert alert-error">{error}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}

          <div className="form-group">
            <label className="form-label">Nume Produs *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descriere *</label>
            <textarea
              name="description"
              className="form-input form-textarea"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              required
            />
          </div>

          <div className="form-section-header">
            <h3>Informații pentru Filtrare *</h3>
            <p className="section-description">
              Aceste câmpuri sunt obligatorii și vor fi folosite pentru filtrarea produselor de către clienți.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Tip Produs (Categorie) *
              <span className="field-hint">ex: Camera, Smartphone, PlayStation 5, Laptop</span>
            </label>
            <div className="autocomplete-wrapper">
              <input
                type="text"
                name="category"
                className="form-input"
                value={formData.category}
                onChange={handleChange}
                onFocus={() => setShowCategoryDropdown(true)}
                onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                placeholder="Selectează sau introdu tipul produsului (ex: Camera, Smartphone, PS5)"
                required
                autoComplete="off"
              />
              {showCategoryDropdown && filteredCategories.length > 0 && (
                <div className="autocomplete-dropdown">
                  {filteredCategories.map((cat) => (
                    <div
                      key={cat}
                      className="autocomplete-option"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion('category', cat);
                      }}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <small className="form-hint">
              💡 Selectează din listă sau introdu un tip nou. Acest câmp este obligatoriu pentru filtrare.
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Brand (Marca) *
                <span className="field-hint">ex: Sony, Apple, Samsung</span>
              </label>
              <div className="autocomplete-wrapper">
                <input
                  type="text"
                  name="brand"
                  className="form-input"
                  value={formData.brand}
                  onChange={handleChange}
                  onFocus={() => setShowBrandDropdown(true)}
                  onBlur={() => setTimeout(() => setShowBrandDropdown(false), 200)}
                  placeholder="Selectează sau introdu marca (ex: Sony, Apple)"
                  required
                  autoComplete="off"
                />
                {showBrandDropdown && filteredBrands.length > 0 && (
                  <div className="autocomplete-dropdown">
                    {filteredBrands.map((br) => (
                      <div
                        key={br}
                        className="autocomplete-option"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectSuggestion('brand', br);
                        }}
                      >
                        {br}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <small className="form-hint">
                Brand-ul produsului. Obligatoriu pentru filtrare.
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">
                Model *
                <span className="field-hint">ex: Alpha 7 III, iPhone 15 Pro</span>
              </label>
              <div className="autocomplete-wrapper">
                <input
                  type="text"
                  name="model"
                  className="form-input"
                  value={formData.model}
                  onChange={handleChange}
                  onFocus={() => setShowModelDropdown(true)}
                  onBlur={() => setTimeout(() => setShowModelDropdown(false), 200)}
                  placeholder="Selectează sau introdu modelul (ex: Alpha 7 III)"
                  required
                  autoComplete="off"
                />
                {showModelDropdown && filteredModels.length > 0 && (
                  <div className="autocomplete-dropdown">
                    {filteredModels.map((mod) => (
                      <div
                        key={mod}
                        className="autocomplete-option"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectSuggestion('model', mod);
                        }}
                      >
                        {mod}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <small className="form-hint">
                Modelul specific al produsului. Obligatoriu pentru filtrare.
              </small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Preț pe zi (RON) *</label>
              <input
                type="number"
                name="dailyPrice"
                className="form-input"
                value={formData.dailyPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Reducere produs (%)
                <span style={{ fontSize: '0.75rem', fontWeight: 'normal', marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
                  (doar pentru proprietar)
                </span>
              </label>
              <input
                type="number"
                name="discountPercent"
                className="form-input"
                value={formData.discountPercent || 0}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                placeholder="0"
              />
              <small className="form-hint">
                Setează o reducere procentuală pentru acest produs (ex: 20 pentru 20% reducere)
              </small>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Imagine Produs</label>
            
            {/* Toggle between upload and URL */}
            <div className="image-input-tabs">
              <button
                type="button"
                className={`tab-btn ${imageMode === 'url' ? 'active' : ''}`}
                onClick={() => {
                  setImageMode('url');
                  setSelectedFile(null);
                }}
              >
                URL / Base64
              </button>
              <button
                type="button"
                className={`tab-btn ${imageMode === 'upload' ? 'active' : ''}`}
                onClick={() => setImageMode('upload')}
              >
                Încarcă Fișier
              </button>
            </div>

            {/* URL/Base64 Input Mode */}
            {imageMode === 'url' && (
              <div className="image-input-section">
                <input
                  type="text"
                  name="imageUrl"
                  className="form-input"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg sau data:image/png;base64,... sau /images/filename.jpg"
                />
                <small className="form-hint">
                  Puteți folosi: URL extern, Base64 data URI, sau cale locală (/images/nume.jpg)
                </small>
              </div>
            )}

            {/* File Upload Mode */}
            {imageMode === 'upload' && (
              <div className="image-input-section">
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="file-input"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="image-upload" className="file-upload-label">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>{selectedFile ? selectedFile.name : 'Selectează imagine'}</span>
                  </label>
                  
                  {selectedFile && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleUploadImage}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? 'Se încarcă...' : 'Încarcă Imagine'}
                    </button>
                  )}
                </div>
                {selectedFile && (
                  <small className="form-hint">
                    Fișier selectat: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </small>
                )}
              </div>
            )}

            {/* Image Preview */}
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" onError={() => setImagePreview('')} />
                <button
                  type="button"
                  className="remove-preview-btn"
                  onClick={() => {
                    setImagePreview('');
                    setFormData(prev => ({ ...prev, imageUrl: '' }));
                    setSelectedFile(null);
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Anulează
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Se salvează...' : product ? 'Actualizează' : 'Creează'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
