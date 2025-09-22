import fetchApi from './apiConfig';

export interface Discount {
  code: string;
  type: 'percentage' | 'flat';  // Matches your Mongoose schema
  value: number;
  expiresAt?: string;
  isActive?: boolean;
}

export interface DiscountResponse {
  success: boolean;
  data: Discount;
}

/**
 * Validate a discount code by sending it to the backend.
 * Returns discount details if valid, throws error if invalid.
 */
export const validateDiscountCode = async (code: string): Promise<DiscountResponse> => {
  if (!code || typeof code !== 'string') {
    throw new Error('Discount code must be a non-empty string');
  }

  // Do NOT prepend 'api/' here because baseUrl already includes it
  return fetchApi<DiscountResponse>('http://localhost:3001/api/discount/validate', 
{
    method: 'POST',
    body: JSON.stringify({ code: code.toUpperCase() }), // Ensures uppercase match
  });
};

export default {
  validateDiscountCode,
};
