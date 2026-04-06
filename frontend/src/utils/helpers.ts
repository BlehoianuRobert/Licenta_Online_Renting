import { format, parseISO, differenceInDays } from 'date-fns';

export const formatDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd MMMM yyyy');
  } catch (error) {
    return date.toString();
  }
};

export const formatDateTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd MMMM yyyy, HH:mm');
  } catch (error) {
    return date.toString();
  }
};

export const calculateRentalDays = (startDate: string, endDate: string): number => {
  try {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    return differenceInDays(end, start) + 1; // +1 to include both start and end days
  } catch (error) {
    return 0;
  }
};

export const calculateTotalPrice = (dailyPrice: number, days: number, productDiscountPercent: number = 0): number => {
  const subtotal = dailyPrice * days;
  
  // Apply product discount first (vendor-set discount)
  const productDiscountAmount = productDiscountPercent > 0 
    ? subtotal * (productDiscountPercent / 100) 
    : 0;
  const priceAfterProductDiscount = subtotal - productDiscountAmount;
  
  // Apply duration-based discount on the price after product discount
  // 7+ days: 5% discount, 14+ days: 10% discount
  let durationDiscountPercent = 0;
  if (days >= 14) {
    durationDiscountPercent = 0.10; // 10% discount
  } else if (days >= 7) {
    durationDiscountPercent = 0.05; // 5% discount
  }
  
  const durationDiscountAmount = priceAfterProductDiscount * durationDiscountPercent;
  return priceAfterProductDiscount - durationDiscountAmount;
};

export const calculateDiscount = (dailyPrice: number, days: number, productDiscountPercent: number = 0): { 
  productDiscountPercent: number; 
  productDiscountAmount: number;
  durationDiscountPercent: number; 
  durationDiscountAmount: number; 
  totalDiscountAmount: number;
  subtotal: number;
} => {
  const subtotal = dailyPrice * days;
  
  // Product discount (vendor-set)
  const productDiscountAmount = productDiscountPercent > 0 
    ? subtotal * (productDiscountPercent / 100) 
    : 0;
  const priceAfterProductDiscount = subtotal - productDiscountAmount;
  
  // Duration discount
  let durationDiscountPercent = 0;
  if (days >= 14) {
    durationDiscountPercent = 0.10; // 10% discount
  } else if (days >= 7) {
    durationDiscountPercent = 0.05; // 5% discount
  }
  
  const durationDiscountAmount = priceAfterProductDiscount * durationDiscountPercent;
  const totalDiscountAmount = productDiscountAmount + durationDiscountAmount;
  
  return {
    productDiscountPercent,
    productDiscountAmount,
    durationDiscountPercent: durationDiscountPercent * 100, // Return as percentage (5 or 10)
    durationDiscountAmount,
    totalDiscountAmount,
    subtotal
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
  }).format(amount);
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};
