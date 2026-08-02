export const COLORS = {
  cream: '#FCE8D5',
  almond: '#E6C7A6', 
  champagne: '#D4B483',
  navy: '#2B2E3C'
} as const;

export const ADMIN_CREDENTIALS = {
  shopkeeper: {
    username: 'pathakji',
    password: 'bhandar123'
  },
  superAdmin: {
    username: 'rajdeep',
    password: 'web123'
  }
} as const;

export const ORDER_STATUSES = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
} as const;

export const PAYMENT_METHODS = {
  upi: 'UPI',
  card: 'Card',
  cod: 'Cash on Delivery',
  wallet: 'Wallet'
} as const;

export const GST_RATES = {
  food: 5,
  packaged_food: 12,
  luxury_food: 18
} as const;

export const DELIVERY_ZONES = [
  { pincode: '211001', area: 'Civil Lines', charge: 0 },
  { pincode: '211002', area: 'Chowk', charge: 0 },
  { pincode: '211003', area: 'Malviyanagar', charge: 0 },
  { pincode: '211004', area: 'Katra', charge: 30 },
  { pincode: '211005', area: 'Kareli', charge: 50 },
] as const;

export const CATEGORIES = [
  { id: 1, name: 'Biscuits', description: 'Traditional and modern biscuits' },
  { id: 2, name: 'Snacks', description: 'Savory snacks and namkeen' },
  { id: 3, name: 'Cookies', description: 'Premium cookies and wafers' },
  { id: 4, name: 'Pastries', description: 'Fresh pastries and desserts' },
  { id: 5, name: 'Cake', description: 'Custom cakes and celebration treats' },
  { id: 6, name: 'Rolls', description: 'Fresh rolls and bread varieties' },
] as const;

export const COMPANY_INFO = {
  name: 'Pathak Bakers',
  tagline: 'Since 1957',
  address: {
    line1: '18, Chowk, Malviyanagar',
    line2: 'Prayagraj, UP 211003'
  },
  phone: '+91 98765 43210',
  email: 'info@pathakbakers.com',
  hours: 'Daily 8:00 AM - 9:00 PM'
} as const;
