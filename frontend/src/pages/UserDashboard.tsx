'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { UserTopBar } from '../components/UserTopBar';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  mockCredits,
  mockTransactions,
  type TransactionCategory,
} from '../lib/mock-data';
import {
  CreditCard,
  TrendingUp,
  Clock,
  ArrowDownLeft,
  ArrowUpRightIcon,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<
    TransactionCategory | 'all'
  >('all');

  useEffect(() => {
    if (user && user.type !== 'user') {
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const userCredits = mockCredits.filter(
    (c) => c.userId === user.id && c.status === 'approved'
  );
  const totalDebt = userCredits.reduce((sum, c) => sum + c.remainingBalance, 0);
  const monthlyPayment = userCredits.reduce(
    (sum, c) => sum + c.monthlyPayment,
    0
  );

  const userTransactions = mockTransactions.filter((t) => t.userId === user.id);
  const filteredTransactions =
    selectedCategory === 'all'
      ? userTransactions
      : userTransactions.filter((t) => t.category === selectedCategory);

  const categories: { value: TransactionCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'electricity', label: 'Electricidad' },
    { value: 'transportation', label: 'Transporte' },
    { value: 'water', label: 'Agua' },
    { value: 'gas', label: 'Gas' },
    { value: 'misc', label: 'Otros' },
  ];

  const getCategoryColor = (category: TransactionCategory) => {
    const colors = {
      electricity: 'bg-yellow-100 text-yellow-800',
      transportation: 'bg-blue-100 text-blue-800',
      water: 'bg-cyan-100 text-cyan-800',
      gas: 'bg-orange-100 text-orange-800',
      misc: 'bg-gray-100 text-gray-800',
    };
    return colors[category];
  };

  return (
    <div className='min-h-screen bg-background'>
      <UserTopBar />

      <main className='container mx-auto px-4 py-8'>
        {/* Welcome section */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-foreground mb-2'>
            Hola, {user.name.split(' ')[0]}
          </h1>
          <p className='text-muted-foreground'>
            Aquí está el resumen de tu cuenta
          </p>
        </div>

        {/* Balance card */}
        <Card className='mb-8 border-none bg-linear-to-br from-[#EB0029] to-[#DB0026] text-white'>
          <CardHeader>
            <CardTitle className='text-white/90 text-sm font-medium'>
              Saldo disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-end justify-between'>
              <div>
                <p className='text-4xl font-bold mb-2'>
                  $
                  {user.balance.toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className='text-white/80 text-sm'>{user.accountNumber}</p>
              </div>
              <Button
                variant='secondary'
                className='bg-white/20 text-white border-white/40 hover:bg-white/30'
                onClick={() => navigate('/user/credits')}
              >
                Ver créditos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className='grid gap-6 md:grid-cols-3 mb-8'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                Créditos activos
              </CardTitle>
              <CreditCard className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{userCredits.length}</div>
              <p className='text-xs text-muted-foreground mt-1'>
                Total adeudado: ${totalDebt.toLocaleString('es-MX')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                Pago mensual
              </CardTitle>
              <TrendingUp className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                $
                {monthlyPayment.toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                Próximo pago: 15 Nov 2024
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                Historial crediticio
              </CardTitle>
              <Clock className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-[#6CC04A]'>Excelente</div>
              <p className='text-xs text-muted-foreground mt-1'>
                100% pagos a tiempo
              </p>
            </CardContent>
          </Card>
        </div>

        <div className='mb-8'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-semibold'>Transacciones recientes</h2>
          </div>

          {/* Category filters */}
          <div className='flex flex-wrap gap-2 mb-4'>
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-[#EB0029] text-white'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <Card>
            <CardContent className='p-0'>
              <div className='divide-y'>
                {filteredTransactions.length === 0 ? (
                  <div className='p-8 text-center text-muted-foreground'>
                    No hay transacciones en esta categoría
                  </div>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className='flex items-center justify-between p-4 hover:bg-secondary/50'
                    >
                      <div className='flex items-center gap-4'>
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            transaction.type === 'credit'
                              ? 'bg-[#6CC04A]/10'
                              : 'bg-[#EB0029]/10'
                          }`}
                        >
                          {transaction.type === 'credit' ? (
                            <ArrowUpRightIcon className='h-5 w-5 text-[#6CC04A]' />
                          ) : (
                            <ArrowDownLeft className='h-5 w-5 text-[#EB0029]' />
                          )}
                        </div>
                        <div>
                          <p className='font-medium'>
                            {transaction.description}
                          </p>
                          <div className='flex items-center gap-2 mt-1'>
                            <p className='text-xs text-muted-foreground'>
                              {new Date(transaction.date).toLocaleDateString(
                                'es-MX',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )}
                            </p>
                            <Badge
                              variant='secondary'
                              className={`text-xs ${getCategoryColor(
                                transaction.category
                              )}`}
                            >
                              {
                                categories.find(
                                  (c) => c.value === transaction.category
                                )?.label
                              }
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-lg font-semibold ${
                          transaction.type === 'credit'
                            ? 'text-[#6CC04A]'
                            : 'text-foreground'
                        }`}
                      >
                        {transaction.type === 'credit' ? '+' : ''}$
                        {Math.abs(transaction.amount).toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
