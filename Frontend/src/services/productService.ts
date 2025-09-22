import fetchApi from './apiConfig';

export interface Product {
  id: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image?: string;
  image_url?: string;
  category_id: string | { _id: string; name: string };
  quantity_in_stock?: number;
  stock_quantity?: number;
  totalStock?: number;
  featured?: boolean;
  created_at?: string;
  updated_at?: string;
  sizes?: Array<{
    size: string;
    stock: number;
  }>;
  colors?: Array<{
    name: string;
    code: string;
  }>;
  material?: string;
  tags?: string[];
  isActive?: boolean;
  discountPercentage?: number;
}

export interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface ProductResponse {
  success: boolean;
  data: Product;
}

/**
 * Fetch all products with optional filters
 */
const getProducts = async (params?: {
  category?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}): Promise<ProductsResponse> => {
  const queryParams = new URLSearchParams();

  if (params?.category) queryParams.append('category', params.category);
  if (params?.featured !== undefined) queryParams.append('featured', String(params.featured));
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.offset) queryParams.append('offset', String(params.offset));

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const response = await fetchApi<ProductsResponse>(`/products${queryString}`);
  return response;
};

/**
 * Fetch a single product by ID
 */
const getProductById = async (id: string): Promise<ProductResponse> => {
  const response = await fetchApi<ProductResponse>(`/products/${id}`);
  return response;
};

/**
 * Search products by keyword
 */
const searchProducts = async (searchTerm: string): Promise<ProductsResponse> => {
  const response = await fetchApi<ProductsResponse>(`/products/search/query?q=${encodeURIComponent(searchTerm)}`);
  return response;
};

// ✅ Final export
const productService = {
  getProducts,
  getProductById,
  searchProducts,
};

export default productService;
