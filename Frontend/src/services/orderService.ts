import fetchApi from './apiConfig';

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface Order {
  _id: string;
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: ShippingAddress;
  payment_intent_id?: string;
  tracking_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrderData {
  items: OrderItem[];
  total_amount: number;
  shipping_address: ShippingAddress;
  payment_intent_id?: string;
}

export interface OrderResponse {
  success: boolean;
  data: Order;
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  total: number;
}

/**
 * Create new order
 */
export const createOrder = async (orderData: CreateOrderData): Promise<OrderResponse> => {
  return fetchApi<OrderResponse>('orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
};

/**
 * Get user orders
 */
export const getUserOrders = async (): Promise<OrdersResponse> => {
  return fetchApi<OrdersResponse>('orders/my-orders');
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId: string): Promise<OrderResponse> => {
  return fetchApi<OrderResponse>(`orders/${orderId}`);
};

/**
 * Track order by tracking number
 */
export const trackOrder = async (trackingNumber: string): Promise<OrderResponse> => {
  return fetchApi<OrderResponse>(`orders/track/${trackingNumber}`);
};

export default {
  createOrder,
  getUserOrders,
  getOrderById,
  trackOrder
};
