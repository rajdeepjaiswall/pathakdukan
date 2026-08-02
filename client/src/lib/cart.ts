import type { ChargesConfig } from '@shared/schema';

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  selectedWeight?: string | null;
  variantPrice?: string | null;
  product: {
    id: number;
    name: string;
    price: string;
    weight: string;
    images: string[];
    gstRate: string;
  };
}

export function getItemPrice(item: CartItem): number {
  if (item.variantPrice && parseFloat(item.variantPrice) > 0) {
    return parseFloat(item.variantPrice);
  }
  return parseFloat(item.product.price);
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  gstAmount: number;
  deliveryCharge: number;
  handlingCharge: number;
  /** Whether the delivery charge category is enabled by the admin (controls row visibility). */
  deliveryActive: boolean;
  /** Whether the handling charge category is enabled by the admin (controls row visibility). */
  handlingActive: boolean;
  /** Pricing rule that produced the delivery charge (drives the "(5%)" / "(Fixed)" hint). */
  deliveryMethod: ChargeMethod;
  /** Pricing rule that produced the handling charge. */
  handlingMethod: ChargeMethod;
  /** Delivery percentage rate when deliveryMethod === 'percentage'. */
  deliveryPercentage: number;
  /** Handling percentage rate when handlingMethod === 'percentage'. */
  handlingPercentage: number;
  total: number;
  itemCount: number;
}

export type ChargeMethod = 'free_threshold' | 'percentage' | 'fixed' | 'none';

export interface ComputedCharge {
  amount: number;
  active: boolean;
  /** Which pricing rule produced this charge. */
  method: ChargeMethod;
  /** The percentage rate applied when method === 'percentage' (otherwise 0). */
  percentage: number;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Compute a single charge (delivery or handling) from its config fields and the cart subtotal.
 * Priority when enabled: Free Threshold (waiver) -> Percentage -> Fixed.
 * Returns amount 0 + active false when the category is disabled (row hidden).
 */
function computeOneCharge(
  subtotal: number,
  enabled: boolean,
  freeThresholdEnabled: boolean,
  freeThreshold: number,
  percentageEnabled: boolean,
  percentage: number,
  fixedEnabled: boolean,
  fixedCharge: number,
): ComputedCharge {
  if (!enabled) return { amount: 0, active: false, method: 'none', percentage: 0 };
  // Waiver: free above threshold (threshold must be a positive amount to apply).
  if (freeThresholdEnabled && freeThreshold > 0 && subtotal >= freeThreshold) {
    return { amount: 0, active: true, method: 'free_threshold', percentage: 0 };
  }
  if (percentageEnabled) {
    return {
      amount: round2((subtotal * percentage) / 100),
      active: true,
      method: 'percentage',
      percentage,
    };
  }
  if (fixedEnabled) {
    return { amount: round2(fixedCharge), active: true, method: 'fixed', percentage: 0 };
  }
  // Enabled but no charge method configured -> nothing to add (shows as FREE).
  return { amount: 0, active: true, method: 'none', percentage: 0 };
}

export interface ComputedCharges {
  delivery: ComputedCharge;
  handling: ComputedCharge;
}

/** Compute both delivery and handling charges for a given subtotal from the admin config. */
export function computeCharges(subtotal: number, charges?: ChargesConfig | null): ComputedCharges {
  if (!charges) {
    return {
      delivery: { amount: 0, active: false, method: 'none', percentage: 0 },
      handling: { amount: 0, active: false, method: 'none', percentage: 0 },
    };
  }
  return {
    delivery: computeOneCharge(
      subtotal,
      charges.deliveryEnabled,
      charges.deliveryFreeThresholdEnabled,
      charges.deliveryFreeThreshold,
      charges.deliveryPercentageEnabled,
      charges.deliveryPercentage,
      charges.deliveryFixedEnabled,
      charges.deliveryFixedCharge,
    ),
    handling: computeOneCharge(
      subtotal,
      charges.handlingEnabled,
      charges.handlingFreeThresholdEnabled,
      charges.handlingFreeThreshold,
      charges.handlingPercentageEnabled,
      charges.handlingPercentage,
      charges.handlingFixedEnabled,
      charges.handlingFixedCharge,
    ),
  };
}

export function calculateCartSummary(items: CartItem[], charges?: ChargesConfig | null): CartSummary {
  const subtotal = items.reduce((sum, item) => {
    return sum + (getItemPrice(item) * item.quantity);
  }, 0);

  const gstAmount = items.reduce((sum, item) => {
    const itemTotal = getItemPrice(item) * item.quantity;
    const gstRate = parseFloat(item.product.gstRate) / 100;
    return sum + (itemTotal * gstRate);
  }, 0);

  const computed = computeCharges(subtotal, charges);
  const deliveryCharge = computed.delivery.amount;
  const handlingCharge = computed.handling.amount;

  const total = subtotal + gstAmount + deliveryCharge + handlingCharge;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    subtotal,
    gstAmount,
    deliveryCharge,
    handlingCharge,
    deliveryActive: computed.delivery.active,
    handlingActive: computed.handling.active,
    deliveryMethod: computed.delivery.method,
    handlingMethod: computed.handling.method,
    deliveryPercentage: computed.delivery.percentage,
    handlingPercentage: computed.handling.percentage,
    total,
    itemCount,
  };
}

/**
 * Short hint shown in brackets next to a charge label so customers can see how
 * it was derived, e.g. " (5%)" for a percentage charge or " (Fixed)" for a flat
 * fee. Returns an empty string when there is nothing meaningful to explain
 * (waived/free or no charge), so the label stays clean.
 */
export function chargeMethodSuffix(
  method: ChargeMethod,
  percentage: number,
  amount: number,
): string {
  if (amount <= 0) return '';
  if (method === 'percentage') return ` (${percentage}%)`;
  if (method === 'fixed') return ' (Fixed)';
  return '';
}

export function formatPrice(price: number): string {
  return `₹${price.toFixed(2)}`;
}

export function getGSTBreakdown(items: CartItem[]): {
  cgst: number;
  sgst: number;
  igst: number;
} {
  const totalGST = items.reduce((sum, item) => {
    const itemTotal = getItemPrice(item) * item.quantity;
    const gstRate = parseFloat(item.product.gstRate) / 100;
    return sum + (itemTotal * gstRate);
  }, 0);

  // For intra-state transactions (within UP), GST is split into CGST and SGST
  // For inter-state transactions, it's IGST
  return {
    cgst: totalGST / 2,
    sgst: totalGST / 2,
    igst: 0, // Set to totalGST for inter-state
  };
}

export function validateCartForCheckout(items: CartItem[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (items.length === 0) {
    errors.push('Cart is empty');
  }

  items.forEach((item) => {
    if (item.quantity <= 0) {
      errors.push(`Invalid quantity for ${item.product.name}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
