import type { GSTRate, GSTType, GSTBreakupLine, TaxSummary, LineItem } from './types';

/**
 * Determine GST type based on seller and buyer state codes.
 * Intrastate → CGST + SGST; Interstate → IGST
 */
export function getGSTType(sellerStateCode: string, buyerStateCode: string): GSTType {
  return sellerStateCode === buyerStateCode ? 'intrastate' : 'interstate';
}

/**
 * Calculate the full tax summary for a set of line items.
 * This is the single source of truth for GST math — used on both
 * the frontend (live preview) and backend (before persisting).
 */
export function calculateTaxSummary(
  lineItems: LineItem[],
  gstType: GSTType,
  applyRoundOff = false
): TaxSummary {
  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);

  // Group line items by GST rate slab
  const slabMap = new Map<GSTRate, number>();
  for (const item of lineItems) {
    const existing = slabMap.get(item.gstRate) ?? 0;
    slabMap.set(item.gstRate, existing + item.lineTotal);
  }

  const breakup: GSTBreakupLine[] = [];
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  for (const [rate, taxableAmount] of slabMap.entries()) {
    if (rate === 0) {
      breakup.push({ rate, taxableAmount });
      continue;
    }

    const taxAmount = roundTwoDecimals((taxableAmount * rate) / 100);

    if (gstType === 'intrastate') {
      const half = roundTwoDecimals(taxAmount / 2);
      totalCgst += half;
      totalSgst += half;
      breakup.push({ rate, taxableAmount, cgst: half, sgst: half });
    } else {
      totalIgst += taxAmount;
      breakup.push({ rate, taxableAmount, igst: taxAmount });
    }
  }

  const totalTax = roundTwoDecimals(totalCgst + totalSgst + totalIgst);
  const preRoundTotal = roundTwoDecimals(subtotal + totalTax);
  const roundOff = applyRoundOff ? roundTwoDecimals(Math.round(preRoundTotal) - preRoundTotal) : 0;
  const grandTotal = roundTwoDecimals(preRoundTotal + roundOff);

  return {
    subtotal: roundTwoDecimals(subtotal),
    gstType,
    breakup,
    totalCgst: roundTwoDecimals(totalCgst),
    totalSgst: roundTwoDecimals(totalSgst),
    totalIgst: roundTwoDecimals(totalIgst),
    totalTax,
    roundOff,
    grandTotal,
  };
}

/**
 * Calculate the line total for a single line item (qty × unitPrice).
 * Tax is NOT included in line total — it is calculated separately in the summary.
 */
export function calculateLineTotal(qty: number, unitPrice: number): number {
  return roundTwoDecimals(qty * unitPrice);
}

function roundTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Format a number as Indian Rupees (e.g. 1,23,456.78)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Generate invoice number from parts.
 * e.g. prefix="INV", fyLabel="2425", sequence=7 → "INV-2425-007"
 */
export function generateInvoiceNumber(prefix: string, fyLabel: string, sequence: number): string {
  const paddedSeq = String(sequence).padStart(3, '0');
  return `${prefix}-${fyLabel}-${paddedSeq}`;
}

/**
 * Get financial year label from a date and FY start month.
 * e.g. date=2024-08-01, fyStartMonth=4 → "2425"
 */
export function getFYLabel(date: Date, fyStartMonth: number): string {
  const month = date.getMonth() + 1; // 1-indexed
  const year = date.getFullYear();
  const fyStartYear = month >= fyStartMonth ? year : year - 1;
  const fyEndYear = fyStartYear + 1;
  return `${String(fyStartYear).slice(2)}${String(fyEndYear).slice(2)}`;
}

// Indian GST state codes — used for intra/interstate determination
export const INDIAN_STATES: { name: string; code: string }[] = [
  { name: 'Andaman and Nicobar Islands', code: '35' },
  { name: 'Andhra Pradesh', code: '37' },
  { name: 'Arunachal Pradesh', code: '12' },
  { name: 'Assam', code: '18' },
  { name: 'Bihar', code: '10' },
  { name: 'Chandigarh', code: '04' },
  { name: 'Chhattisgarh', code: '22' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: '26' },
  { name: 'Delhi', code: '07' },
  { name: 'Goa', code: '30' },
  { name: 'Gujarat', code: '24' },
  { name: 'Haryana', code: '06' },
  { name: 'Himachal Pradesh', code: '02' },
  { name: 'Jammu and Kashmir', code: '01' },
  { name: 'Jharkhand', code: '20' },
  { name: 'Karnataka', code: '29' },
  { name: 'Kerala', code: '32' },
  { name: 'Ladakh', code: '38' },
  { name: 'Lakshadweep', code: '31' },
  { name: 'Madhya Pradesh', code: '23' },
  { name: 'Maharashtra', code: '27' },
  { name: 'Manipur', code: '14' },
  { name: 'Meghalaya', code: '17' },
  { name: 'Mizoram', code: '15' },
  { name: 'Nagaland', code: '13' },
  { name: 'Odisha', code: '21' },
  { name: 'Puducherry', code: '34' },
  { name: 'Punjab', code: '03' },
  { name: 'Rajasthan', code: '08' },
  { name: 'Sikkim', code: '11' },
  { name: 'Tamil Nadu', code: '33' },
  { name: 'Telangana', code: '36' },
  { name: 'Tripura', code: '16' },
  { name: 'Uttar Pradesh', code: '09' },
  { name: 'Uttarakhand', code: '05' },
  { name: 'West Bengal', code: '19' },
];
