import React, { useEffect, useState } from 'react';
import { productService } from '../services/productService';
import { Product } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/helpers';
import ProductForm from '../components/admin/ProductForm';
import InventoryForm from '../components/admin/InventoryForm';
import ConfirmModal from '../components/common/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import './AdminProductsPage.css';

const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const { isSuperOwner } = useAuth();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      // SuperOwner sees all products, Admin sees only their own
      const data = isSuperOwner 
        ? await productService.getAllProducts()
        : await productService.getMyProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setDeleteProduct(product);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProduct) return;

    try {
      await productService.deleteProduct(deleteProduct.id);
      await loadProducts();
      setDeleteProduct(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Eroare la ștergerea produsului');
    }
  };

  const handleAddInventory = (productId: number) => {
    setSelectedProductId(productId);
    setShowInventoryForm(true);
  };

  const handleFormSuccess = () => {
    setShowProductForm(false);
    setShowInventoryForm(false);
    setEditingProduct(null);
    setSelectedProductId(null);
    loadProducts();
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="admin-products-page">
      <div className="container">
        <div className="page-header">
          <h1>Gestionare Produse</h1>
          <button className="btn btn-primary" onClick={handleCreateProduct}>
            + Adaugă Produs
          </button>
        </div>
        
        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nume</th>
                <th>Categorie</th>
                <th>Preț/zi</th>
                <th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.category || '-'}</td>
                  <td>{formatCurrency(product.dailyPrice)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => handleEditProduct(product)}
                      >
                        Editează
                      </button>
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => handleAddInventory(product.id)}
                      >
                        Adaugă Inventar
                      </button>
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleDeleteProduct(product)}
                      >
                        Șterge
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="empty-state">
              <p>Nu există produse. Adaugă primul produs!</p>
            </div>
          )}
        </div>
      </div>

      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        />
      )}

      {showInventoryForm && selectedProductId && (
        <InventoryForm
          productId={selectedProductId}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowInventoryForm(false);
            setSelectedProductId(null);
          }}
        />
      )}

      {deleteProduct && (
        <ConfirmModal
          title="Șterge Produs"
          message={`Ești sigur că vrei să ștergi produsul "${deleteProduct.name}"? Această acțiune nu poate fi anulată.`}
          confirmText="Șterge"
          cancelText="Anulează"
          onConfirm={confirmDeleteProduct}
          onCancel={() => setDeleteProduct(null)}
          variant="danger"
        />
      )}
    </div>
  );
};

export default AdminProductsPage;
