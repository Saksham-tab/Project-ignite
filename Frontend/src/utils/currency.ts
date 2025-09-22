/**
 * Currency utilities for Indian Rupee pricing
 */

// Base conversion rates (can be fetched from API in production)
const USD_TO_INR = 83.12; // As of current exchange rate

export const convertToINR = (amountInUSD: number): number => {
  return Math.round(amountInUSD * USD_TO_INR);
};

export const convertToUSD = (amountInINR: number): number => {
  return Math.round((amountInINR / USD_TO_INR) * 100) / 100;
};

export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatPrice = (amount: number): string => {
  return formatINR(convertToINR(amount));
};

export default {
  convertToINR,
  convertToUSD,
  formatINR,
  formatPrice
};
