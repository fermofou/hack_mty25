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

// Savings timeline data for chart
export interface SavingsTimelineData {
  month: string;
  savings: number;
  cumulativeSavings: number;
}

// Category savings data
export interface CategorySavingsData {
  [key: string]: SavingsTimelineData[];
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

// Mock savings timeline data (last 12 months)
export const mockSavingsTimeline: SavingsTimelineData[] = [
  { month: 'Ene 2024', savings: 0, cumulativeSavings: 0 },
  { month: 'Feb 2024', savings: 800, cumulativeSavings: 800 },
  { month: 'Mar 2024', savings: 1200, cumulativeSavings: 2000 },
  { month: 'Abr 2024', savings: 1500, cumulativeSavings: 3500 },
  { month: 'May 2024', savings: 1800, cumulativeSavings: 5300 },
  { month: 'Jun 2024', savings: 2100, cumulativeSavings: 7400 },
  { month: 'Jul 2024', savings: 2300, cumulativeSavings: 9700 },
  { month: 'Ago 2024', savings: 2400, cumulativeSavings: 12100 },
  { month: 'Sep 2024', savings: 2300, cumulativeSavings: 14400 },
  { month: 'Oct 2024', savings: 2200, cumulativeSavings: 16600 },
  { month: 'Nov 2024', savings: 2000, cumulativeSavings: 18600 },
  { month: 'Dic 2024', savings: 2300, cumulativeSavings: 20900 },
];

// Category-specific savings data
export const categorySavingsData: CategorySavingsData = {
  Electricidad: [
    { month: 'Ene 2024', savings: 0, cumulativeSavings: 0 },
    { month: 'Feb 2024', savings: 450, cumulativeSavings: 450 },
    { month: 'Mar 2024', savings: 520, cumulativeSavings: 970 },
    { month: 'Abr 2024', savings: 680, cumulativeSavings: 1650 },
    { month: 'May 2024', savings: 720, cumulativeSavings: 2370 },
    { month: 'Jun 2024', savings: 850, cumulativeSavings: 3220 },
    { month: 'Jul 2024', savings: 920, cumulativeSavings: 4140 },
    { month: 'Ago 2024', savings: 980, cumulativeSavings: 5120 },
    { month: 'Sep 2024', savings: 890, cumulativeSavings: 6010 },
    { month: 'Oct 2024', savings: 870, cumulativeSavings: 6880 },
    { month: 'Nov 2024', savings: 820, cumulativeSavings: 7700 },
    { month: 'Dic 2024', savings: 940, cumulativeSavings: 8640 },
  ],
  Agua: [
    { month: 'Ene 2024', savings: 0, cumulativeSavings: 0 },
    { month: 'Feb 2024', savings: 150, cumulativeSavings: 150 },
    { month: 'Mar 2024', savings: 180, cumulativeSavings: 330 },
    { month: 'Abr 2024', savings: 220, cumulativeSavings: 550 },
    { month: 'May 2024', savings: 280, cumulativeSavings: 830 },
    { month: 'Jun 2024', savings: 320, cumulativeSavings: 1150 },
    { month: 'Jul 2024', savings: 380, cumulativeSavings: 1530 },
    { month: 'Ago 2024', savings: 420, cumulativeSavings: 1950 },
    { month: 'Sep 2024', savings: 390, cumulativeSavings: 2340 },
    { month: 'Oct 2024', savings: 360, cumulativeSavings: 2700 },
    { month: 'Nov 2024', savings: 340, cumulativeSavings: 3040 },
    { month: 'Dic 2024', savings: 380, cumulativeSavings: 3420 },
  ],
  Gas: [
    { month: 'Ene 2024', savings: 0, cumulativeSavings: 0 },
    { month: 'Feb 2024', savings: 120, cumulativeSavings: 120 },
    { month: 'Mar 2024', savings: 200, cumulativeSavings: 320 },
    { month: 'Abr 2024', savings: 280, cumulativeSavings: 600 },
    { month: 'May 2024', savings: 350, cumulativeSavings: 950 },
    { month: 'Jun 2024', savings: 420, cumulativeSavings: 1370 },
    { month: 'Jul 2024', savings: 480, cumulativeSavings: 1850 },
    { month: 'Ago 2024', savings: 520, cumulativeSavings: 2370 },
    { month: 'Sep 2024', savings: 490, cumulativeSavings: 2860 },
    { month: 'Oct 2024', savings: 460, cumulativeSavings: 3320 },
    { month: 'Nov 2024', savings: 430, cumulativeSavings: 3750 },
    { month: 'Dic 2024', savings: 480, cumulativeSavings: 4230 },
  ],
  Transporte: [
    { month: 'Ene 2024', savings: 0, cumulativeSavings: 0 },
    { month: 'Feb 2024', savings: 280, cumulativeSavings: 280 },
    { month: 'Mar 2024', savings: 420, cumulativeSavings: 700 },
    { month: 'Abr 2024', savings: 580, cumulativeSavings: 1280 },
    { month: 'May 2024', savings: 650, cumulativeSavings: 1930 },
    { month: 'Jun 2024', savings: 720, cumulativeSavings: 2650 },
    { month: 'Jul 2024', savings: 780, cumulativeSavings: 3430 },
    { month: 'Ago 2024', savings: 820, cumulativeSavings: 4250 },
    { month: 'Sep 2024', savings: 790, cumulativeSavings: 5040 },
    { month: 'Oct 2024', savings: 760, cumulativeSavings: 5800 },
    { month: 'Nov 2024', savings: 720, cumulativeSavings: 6520 },
    { month: 'Dic 2024', savings: 800, cumulativeSavings: 7320 },
  ],
};
