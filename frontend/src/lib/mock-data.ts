// Transaction type
export interface Transaction {
  id: number;
  cliente_id: number;
  descripcion: string;
  fecha: string;
  categoria: string;
  monto: number;
}

// Credit status
export type CreditStatus = 'pending' | 'approved' | 'rejected';

// Credit interface
export interface Credit {
  id: string;
  userId: number;
  amount: number;
  remainingBalance: number;
  monthlyPayment: number;
  status: CreditStatus;
  type: 'green' | 'traditional';
  interestRate: number;
  termMonths: number;
  remainingMonths: number;
  purpose: string;
  createdAt: string;
}

// Sustainability savings interface
export interface SustainabilitySavings {
  id: string;
  creditId: string;
  description: string;
  estimatedMonthlySavings: number;
  estimatedYearlySavings: number;
  co2ReductionKg: number;
}

// Mock credits data
export const mockCredits: Credit[] = [
  {
    id: 'credit-1',
    userId: 15,
    amount: 50000,
    remainingBalance: 32500,
    monthlyPayment: 2500,
    status: 'approved',
    type: 'green',
    interestRate: 8.5,
    termMonths: 24,
    remainingMonths: 18,
    purpose: 'Paneles solares para hogar',
    createdAt: '2024-01-15',
  },
  {
    id: 'credit-2',
    userId: 15,
    amount: 25000,
    remainingBalance: 18750,
    monthlyPayment: 1500,
    status: 'approved',
    type: 'traditional',
    interestRate: 12.0,
    termMonths: 18,
    remainingMonths: 12,
    purpose: 'Auto híbrido',
    createdAt: '2024-03-20',
  },
  {
    id: 'credit-3',
    userId: 15,
    amount: 75000,
    remainingBalance: 75000,
    monthlyPayment: 0,
    status: 'pending',
    type: 'green',
    interestRate: 7.5,
    termMonths: 36,
    remainingMonths: 36,
    purpose: 'Sistema de calentamiento solar',
    createdAt: '2024-10-15',
  },
];

// Mock sustainability savings data
export const mockSustainabilitySavings: SustainabilitySavings[] = [
  {
    id: 'savings-1',
    creditId: 'credit-1',
    description: 'Reducción en factura eléctrica mensual',
    estimatedMonthlySavings: 1500,
    estimatedYearlySavings: 18000,
    co2ReductionKg: 2400,
  },
  {
    id: 'savings-2',
    creditId: 'credit-2',
    description: 'Ahorro en combustible vs vehículo convencional',
    estimatedMonthlySavings: 800,
    estimatedYearlySavings: 9600,
    co2ReductionKg: 1200,
  },
];
