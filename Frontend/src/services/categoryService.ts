import fetchApi from './apiConfig';

export interface Category {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
  total: number;
}

export interface CategoryResponse {
  success: boolean;
  data: Category;
}

/**
 * Fetch all categories
 */
export const getCategories = async (): Promise<CategoriesResponse> => {
  return fetchApi<CategoriesResponse>('categories');
};

/**
 * Fetch a single category by ID
 */
export const getCategoryById = async (id: string): Promise<CategoryResponse> => {
  return fetchApi<CategoryResponse>(`categories/${id}`);
};

export default {
  getCategories,
  getCategoryById
};
