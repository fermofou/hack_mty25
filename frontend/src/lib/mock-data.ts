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
  createdAt: string;
}

// Mock credits data
export const mockCredits: Credit[] = [
  {
    id: 'credit-1',
    userId: 1,
    amount: 50000,
    remainingBalance: 32500,
    monthlyPayment: 2500,
    status: 'approved',
    type: 'green',
    interestRate: 8.5,
    termMonths: 24,
    createdAt: '2024-01-15',
  },
  {
    id: 'credit-2',
    userId: 1,
    amount: 25000,
    remainingBalance: 18750,
    monthlyPayment: 1500,
    status: 'approved',
    type: 'traditional',
    interestRate: 12.0,
    termMonths: 18,
    createdAt: '2024-03-20',
  },
];
