// Transaction categories
export type TransactionCategory = 'electricity' | 'transportation' | 'water' | 'gas' | 'misc';

// Transaction type
export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category: TransactionCategory;
  date: string;
}

// Credit status
export type CreditStatus = 'pending' | 'approved' | 'rejected';

// Credit interface
export interface Credit {
  id: string;
  userId: string;
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
    userId: 'user-1',
    amount: 50000,
    remainingBalance: 32500,
    monthlyPayment: 2500,
    status: 'approved',
    type: 'green',
    interestRate: 8.5,
    termMonths: 24,
    createdAt: '2024-01-15'
  },
  {
    id: 'credit-2',
    userId: 'user-1',
    amount: 25000,
    remainingBalance: 18750,
    monthlyPayment: 1500,
    status: 'approved',
    type: 'traditional',
    interestRate: 12.0,
    termMonths: 18,
    createdAt: '2024-03-20'
  }
];

// Mock transactions data
export const mockTransactions: Transaction[] = [
  {
    id: 'trans-1',
    userId: 'user-1',
    description: 'Pago de electricidad con panel solar',
    amount: -850,
    type: 'debit',
    category: 'electricity',
    date: '2024-10-20'
  },
  {
    id: 'trans-2',
    userId: 'user-1',
    description: 'Cashback crédito verde',
    amount: 125,
    type: 'credit',
    category: 'misc',
    date: '2024-10-18'
  },
  {
    id: 'trans-3',
    userId: 'user-1',
    description: 'Recarga metro ecológica',
    amount: -45,
    type: 'debit',
    category: 'transportation',
    date: '2024-10-15'
  },
  {
    id: 'trans-4',
    userId: 'user-1',
    description: 'Pago de agua',
    amount: -320,
    type: 'debit',
    category: 'water',
    date: '2024-10-12'
  },
  {
    id: 'trans-5',
    userId: 'user-1',
    description: 'Recompensa ahorro energético',
    amount: 75,
    type: 'credit',
    category: 'electricity',
    date: '2024-10-10'
  }
];