export interface Organization {
  name: string;
  industry: string;
  tier: string;
  owner: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  stripeConnected: boolean;
}

export interface Metrics {
  totalRevenue: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  activeJobs: number;
  pendingLeads: number;
  unpaidInvoicesCount: number;
  unpaidInvoicesAmount: number;
  missedCallsToday: number;
  maintenanceContractsActive: number;
}

export interface Lead {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  serviceAddress: string;
  category: string;
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  status: string;
  problemDescription: string;
  aiQualification: {
    confidence: number;
    intent: string;
    summary: string;
    recommendedAction: string;
    suggestedResponse: string;
  };
  createdAt: string;
}

export interface EstimateItem {
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  customerName: string;
  email: string;
  serviceAddress: string;
  scope: string;
  items: EstimateItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface Job {
  id: string;
  jobNumber: string;
  customerName: string;
  phone: string;
  serviceAddress: string;
  scope: string;
  status: string;
  assignedTechnician: string;
  scheduledTime: string;
  contractAmount: number;
  actualLaborCost: number;
  actualMaterialCost: number;
  grossProfit: number;
  notes: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: string;
  dueDate: string;
  createdAt: string;
  paidAt: string | null;
  paymentMethod: string | null;
}

export interface MissedCall {
  id: string;
  callerPhone: string;
  callerName: string;
  timestamp: string;
  duration: string;
  status: string;
  aiDraftedResponse: string;
  approvalStatus: string;
}

export interface MaintenanceContract {
  id: string;
  planName: string;
  customerName: string;
  serviceAddress: string;
  frequency: string;
  price: number;
  billingInterval: string;
  status: string;
  nextServiceDate: string;
  lastServiceDate: string;
}
