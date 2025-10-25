import { useAuth } from '@/context/AuthContext';
import { type Transaction } from '@/lib/mock-data';
import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { ArrowDownLeft, ArrowUpRightIcon } from 'lucide-react';
import { Badge } from './ui/badge';
import { api } from '@/lib/api';

function TransactionList() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userTransactions, setUserTransactions] = useState<
    Transaction[] | undefined
  >();

  const { user } = useAuth();

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      try {
        const { data } = await api.get(`transacciones/cliente/${user.id}`);
        setUserTransactions(data);
      } catch (err: unknown) {
        console.log(err);
      }
    };

    fetchTransactions();
  }, [user]);

  if (!user) return null;

  const filteredTransactions =
    (selectedCategory === 'all'
      ? userTransactions
      : userTransactions?.filter((t) => t.categoria === selectedCategory)) ??
    [];

  const categories: { value: string; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'Luz', label: 'Electricidad' },
    { value: 'Transporte', label: 'Transporte' },
    { value: 'Agua', label: 'Agua' },
    { value: 'Gas', label: 'Gas' },
    { value: '_', label: 'Otros' },
  ];

  const getCategoryColor = (category: string) => {
    const categories = ['Luz', 'Transporte', 'Agua', 'Gas'];
    const colors = {
      Luz: 'bg-yellow-100 text-yellow-800',
      Transporte: 'bg-blue-100 text-blue-800',
      Agua: 'bg-cyan-100 text-cyan-800',
      Gas: 'bg-orange-100 text-orange-800',
    };

    if (!categories.includes(category)) {
      return 'bg-gray-100 text-gray-800';
    }
    const color = colors[category as keyof typeof colors];
    console.log(category, color);
    return color;
  };

  return (
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
                        transaction.monto < 0
                          ? 'bg-[#6CC04A]/10'
                          : 'bg-[#EB0029]/10'
                      }`}
                    >
                      {transaction.monto < 0 ? (
                        <ArrowUpRightIcon className='h-5 w-5 text-[#6CC04A]' />
                      ) : (
                        <ArrowDownLeft className='h-5 w-5 text-[#EB0029]' />
                      )}
                    </div>
                    <div>
                      <p className='font-medium'>{transaction.descripcion}</p>
                      <div className='flex items-center gap-2 mt-1'>
                        <p className='text-xs text-muted-foreground'>
                          {new Date(transaction.fecha).toLocaleDateString(
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
                            transaction.categoria
                          )}`}
                        >
                          {categories.find(
                            (c) => c.value === transaction.categoria
                          )?.label ?? 'Otros'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      transaction.monto < 0
                        ? 'text-[#6CC04A]'
                        : 'text-foreground'
                    }`}
                  >
                    {transaction.monto < 0 ? '+' : ''}$
                    {Math.abs(transaction.monto).toLocaleString('es-MX', {
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
  );
}

export default TransactionList;
