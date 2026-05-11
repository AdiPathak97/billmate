// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'owner' | 'demo' | 'admin';

export interface BusinessProfile {
  name: string;
  logoUrl?: string;
  address: Address;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  bankDetails: BankDetails;
  signatureUrl?: string;
  invoicePrefix: string;
  fyStartMonth: number; // 1–12; default 4 (April)
  lastInvoiceSequence: number;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
}

// ─── Address ─────────────────────────────────────────────────────────────────

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;      // Indian state name
  stateCode: string;  // 2-digit GST state code e.g. "27" for Maharashtra
  pincode: string;
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export type CustomerType = 'individual' | 'business';

export interface Customer {
  _id: string;
  ownerId: string;
  name: string;
  email?: string;
  phone?: string;
  address: Address;
  gstin?: string;
  type: CustomerType;
  createdAt: string;
  updatedAt: string;
}

// ─── Item (user's item master) ────────────────────────────────────────────────

export type ItemType = 'product' | 'service';

export interface Item {
  _id: string;
  ownerId: string;
  name: string;
  description?: string;
  type: ItemType;
  hsnSac: string;
  unit: string;
  unitPrice: number;
  gstRate: GSTRate;
  usageCount: number;
  lastUsedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ─── GST ─────────────────────────────────────────────────────────────────────

export type GSTRate = 0 | 5 | 12 | 18 | 28;

export type GSTType = 'intrastate' | 'interstate';

export interface GSTBreakupLine {
  rate: GSTRate;
  taxableAmount: number;
  cgst?: number;   // intrastate only
  sgst?: number;   // intrastate only
  igst?: number;   // interstate only
}

export interface TaxSummary {
  subtotal: number;
  gstType: GSTType;
  breakup: GSTBreakupLine[];
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
}

// ─── Invoice ──────────────────────────────────────────────────────────────────

export interface LineItem {
  itemId?: string;       // ref to Item master if selected from autocomplete
  name: string;
  description?: string;
  hsnSac: string;
  qty: number;
  unit: string;
  unitPrice: number;
  gstRate: GSTRate;
  lineTotal: number;     // qty * unitPrice (pre-tax)
}

export interface Invoice {
  _id: string;
  ownerId: string;
  invoiceNo: string;
  date: string;          // ISO date string
  dueDate: string;
  customer: CustomerSnapshot;
  placeOfSupply: string;       // state name
  placeOfSupplyCode: string;   // 2-digit state code
  lineItems: LineItem[];
  taxSummary: TaxSummary;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Snapshot of customer at time of invoice creation
// Ensures historical invoices are unaffected by customer edits
export interface CustomerSnapshot {
  customerId?: string;
  name: string;
  email?: string;
  phone?: string;
  address: Address;
  gstin?: string;
  type: CustomerType;
}

// ─── Demo Limits ──────────────────────────────────────────────────────────────

export interface DemoLimits {
  maxInvoices: number;
  maxCustomers: number;
  maxPdfDownloads: number;
}

export const DEMO_LIMITS: DemoLimits = {
  maxInvoices: 10,
  maxCustomers: 5,
  maxPdfDownloads: 5,
};

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
