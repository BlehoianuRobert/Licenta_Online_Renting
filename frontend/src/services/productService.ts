import api from './api';
import {
  Product,
  ProductRequest,
  Inventory,
  InventoryRequest,
  ProductReview,
  ProductReviewSummary,
} from '../types';

export const productService = {
  getAllProducts: async (filters?: { category?: string; brand?: string; model?: string }): Promise<Product[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.brand) params.append('brand', filters.brand);
    if (filters?.model) params.append('model', filters.model);
    
    const queryString = params.toString();
    const url = queryString ? `/products?${queryString}` : '/products';
    const response = await api.get<Product[]>(url);
    return response.data;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/products/filters/categories');
    return response.data;
  },

  getBrands: async (category?: string): Promise<string[]> => {
    const url = category ? `/products/filters/brands?category=${encodeURIComponent(category)}` : '/products/filters/brands';
    const response = await api.get<string[]>(url);
    return response.data;
  },

  getModels: async (category?: string, brand?: string): Promise<string[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (brand) params.append('brand', brand);
    
    const queryString = params.toString();
    const url = queryString ? `/products/filters/models?${queryString}` : '/products/filters/models';
    const response = await api.get<string[]>(url);
    return response.data;
  },

  getProductById: async (id: number): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  createProduct: async (product: ProductRequest): Promise<Product> => {
    const response = await api.post<Product>('/products', product);
    return response.data;
  },

  updateProduct: async (id: number, product: ProductRequest): Promise<Product> => {
    const response = await api.put<Product>(`/products/${id}`, product);
    return response.data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  addInventoryUnit: async (inventory: InventoryRequest): Promise<Inventory> => {
    const response = await api.post<Inventory>('/products/inventory', inventory);
    return response.data;
  },

  getAvailableInventory: async (productId: number): Promise<Inventory[]> => {
    const response = await api.get<Inventory[]>(`/products/${productId}/inventory/available`);
    return response.data;
  },

  getMyProducts: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/products/my');
    return response.data;
  },

  getProductReviews: async (productId: number): Promise<ProductReview[]> => {
    const response = await api.get<ProductReview[]>(`/products/${productId}/reviews`);
    return response.data;
  },

  getProductReviewSummary: async (productId: number): Promise<ProductReviewSummary> => {
    const response = await api.get<ProductReviewSummary>(`/products/${productId}/reviews/summary`);
    return response.data;
  },

  createOrUpdateReview: async (
    productId: number,
    payload: { rating: number; comment?: string }
  ): Promise<ProductReview> => {
    const response = await api.post<ProductReview>(`/products/${productId}/reviews`, payload);
    return response.data;
  },
};
