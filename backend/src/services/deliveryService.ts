// deliveryService.ts
// Delivery/shipping gateway integration (e.g., Shiprocket, Delhivery, Shippo, etc.)
// Add your provider's API logic below.

// Shiprocket integration for delivery/shipping
// Add these to your .env:
// SHIPROCKET_EMAIL=your_shiprocket_email
// SHIPROCKET_PASSWORD=your_shiprocket_password
// SHIPROCKET_API_URL=https://apiv2.shiprocket.in/v1/external

import axios from 'axios';

let shiprocketToken: string | null = null;
let tokenExpiry: number | null = null;

async function getShiprocketToken() {
  if (shiprocketToken && tokenExpiry && Date.now() < tokenExpiry) {
    return shiprocketToken;
  }
  const res = await axios.post(
    `${process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1/external'}/auth/login`,
    {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }
  );
  shiprocketToken = res.data.token;
  // Shiprocket tokens are valid for 10 minutes
  tokenExpiry = Date.now() + 9 * 60 * 1000;
  return shiprocketToken;
}

// Create a shipment/order with Shiprocket
export async function createShipment(order: any) {
  const token = await getShiprocketToken();
  // Map your order fields to Shiprocket's API
  const payload = {
    order_id: order._id,
    order_date: order.createdAt || new Date().toISOString().slice(0, 10),
    pickup_location: 'Default', // Set your pickup location name as per Shiprocket dashboard
    billing_customer_name: order.customerName,
    billing_last_name: order.customerLastName || '',
    billing_address: order.address,
    billing_city: order.city,
    billing_pincode: order.pincode,
    billing_state: order.state,
    billing_country: order.country || 'India',
    billing_email: order.email,
    billing_phone: order.phone,
    shipping_is_billing: true,
    order_items: order.items.map((item: any) => ({
      name: item.name,
      sku: item.sku || item._id,
      units: item.quantity,
      selling_price: item.price,
    })),
    payment_method: order.paymentMethod || 'Prepaid',
    shipping_charges: order.shipping || 0,
    sub_total: order.subtotal || 0,
    length: 10, // cm
    breadth: 10, // cm
    height: 10, // cm
    weight: 1, // kg
  };
  const response = await axios.post(
    `${process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1/external'}/orders/create/adhoc`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

// Track a shipment/order with Shiprocket
export async function trackShipment(trackingId: string) {
  const token = await getShiprocketToken();
  const response = await axios.get(
    `${process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1/external'}/courier/track?awb=${trackingId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
} 