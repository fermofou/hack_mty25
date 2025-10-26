'use client';

import { useState } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { UserTopBar } from '@/components/UserTopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { mockCredits } from '@/lib/mock-data';
import {
  Calendar,
  DollarSign,
  Percent,
  Clock,
  TrendingUp,
  FileText,
  ChevronLeft,
} from 'lucide-react';

export default function CreditDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [paymentType, setPaymentType] = useState<'monthly' | 'custom'>(
    'monthly'
  );
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!user) {
    return null;
  }

  const credit = mockCredits.find((c) => c.id === params.id);

  if (!credit) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <p>Crédito no encontrado</p>
      </div>
    );
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    // Here you would integrate with actual payment API
    alert(
      `Pago procesado: $${
        paymentType === 'monthly'
          ? credit.monthlyPayment.toLocaleString('es-MX')
          : Number(customAmount).toLocaleString('es-MX')
      }`
    );
  };

  return (
    <div className='min-h-screen bg-background'>
      <UserTopBar />

      <main className='container mx-auto px-4 py-8 max-w-[1200px]'>
        {/* Title section with back button */}
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-2'>
            <Link
              to='/user/credits'
              className='flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors'
            >
              <ChevronLeft className='h-7 w-7 text-[#EB0029]' />
            </Link>
            <h1 className='text-3xl font-bold text-foreground'>
              Detalles del crédito
            </h1>
          </div>
          <p className='text-muted-foreground ml-13'>
            Información completa de tu crédito
          </p>
        </div>

        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Main info */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Credit overview */}
            <Card className='border border-gray-200 shadow-sm'>
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <div>
                    <CardTitle className='text-2xl'>
                      ${credit.amount.toLocaleString('es-MX')}
                    </CardTitle>
                  </div>
                  <Badge
                    className={
                      credit.status === 'approved'
                        ? 'bg-[#6CC04A] text-white'
                        : credit.status === 'pending'
                        ? 'bg-[#FFA500] text-white'
                        : 'bg-destructive text-white'
                    }
                  >
                    {credit.status === 'approved'
                      ? 'Activo'
                      : credit.status === 'pending'
                      ? 'Pendiente'
                      : 'Rechazado'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground mb-4 line-clamp-2'>
                  {credit.purpose}
                </p>

                <div className='space-y-3'>
                  <div className='flex items-center gap-2 text-sm'>
                    <DollarSign className='h-4 w-4 text-muted-foreground' />
                    <span className='text-muted-foreground'>Saldo:</span>
                    <span className='font-semibold'>
                      ${credit.remainingBalance.toLocaleString('es-MX')}
                    </span>
                  </div>

                  <div className='flex items-center gap-2 text-sm'>
                    <Clock className='h-4 w-4 text-muted-foreground' />
                    <span className='text-muted-foreground'>
                      Tiempo restante:
                    </span>
                    <span className='font-semibold'>
                      {credit.remainingMonths} meses
                    </span>
                  </div>

                  <div className='flex items-center gap-2 text-sm'>
                    <TrendingUp className='h-4 w-4 text-muted-foreground' />
                    <span className='text-muted-foreground'>Pago mensual:</span>
                    <span className='font-semibold'>
                      $
                      {credit.monthlyPayment.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                {credit.status === 'approved' && (
                  <>
                    {/* Progress bar */}
                    <div className='mt-4'>
                      <div className='flex justify-between text-xs text-muted-foreground mb-1'>
                        <span>Progreso</span>
                        <span>
                          {Math.round(
                            ((credit.termMonths - credit.remainingMonths) /
                              credit.termMonths) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className='h-2 bg-secondary rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-[#EB0029]'
                          style={{
                            width: `${
                              ((credit.termMonths - credit.remainingMonths) /
                                credit.termMonths) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4 pt-4 border-t mt-4'>
                      <div>
                        <p className='text-sm text-muted-foreground mb-1'>
                          Total pagado
                        </p>
                        <p className='text-xl font-bold text-[#6CC04A]'>
                          $
                          {(
                            credit.amount - credit.remainingBalance
                          ).toLocaleString('es-MX')}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-muted-foreground mb-1'>
                          Saldo restante
                        </p>
                        <p className='text-xl font-bold text-[#EB0029]'>
                          ${credit.remainingBalance.toLocaleString('es-MX')}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment schedule */}
            {credit.status === 'approved' && (
              <Card className='border border-gray-200 shadow-sm'>
                <CardHeader>
                  <CardTitle>Próximos pagos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {[0, 1, 2].map((i) => {
                      const date = new Date();
                      date.setMonth(date.getMonth() + i + 1);
                      return (
                        <div
                          key={i}
                          className='flex items-center justify-between p-3 bg-secondary rounded-lg'
                        >
                          <div className='flex items-center gap-3'>
                            <Calendar className='h-4 w-4 text-muted-foreground' />
                            <div>
                              <p className='font-medium'>
                                {date.toLocaleDateString('es-MX', {
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </p>
                              <p className='text-xs text-muted-foreground'>
                                Vence el 15
                              </p>
                            </div>
                          </div>
                          <p className='font-semibold'>
                            $
                            {credit.monthlyPayment.toLocaleString('es-MX', {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar stats */}
          <div className='space-y-6'>
            {/* Payment Card - Only for approved credits */}
            {credit.status === 'approved' && (
              <Card className='border border-gray-200 shadow-sm'>
                <CardHeader>
                  <CardTitle className='text-base'>Realizar pago</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Due amount and date info */}
                  <div className='bg-gray-50 rounded-lg p-3 border border-gray-100'>
                    <div className='flex justify-between items-center mb-2'>
                      <span className='text-sm text-gray-600'>
                        Próximo pago:
                      </span>
                      <span className='text-lg font-bold text-[#EB0029]'>
                        ${credit.monthlyPayment.toLocaleString('es-MX')}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-gray-600'>
                        Fecha límite:
                      </span>
                      <span className='text-sm font-medium text-gray-800'>
                        {(() => {
                          const nextDue = new Date();
                          nextDue.setDate(15); // Set to 15th of current month
                          if (nextDue < new Date()) {
                            nextDue.setMonth(nextDue.getMonth() + 1);
                          }
                          return nextDue.toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          });
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Payment type selection */}
                  <div className='space-y-3'>
                    <p className='text-sm font-medium text-gray-700'>
                      Tipo de pago
                    </p>
                    <div className='space-y-2'>
                      <label className='flex items-center space-x-2 cursor-pointer'>
                        <input
                          type='radio'
                          name='paymentType'
                          value='monthly'
                          checked={paymentType === 'monthly'}
                          onChange={(e) =>
                            setPaymentType(
                              e.target.value as 'monthly' | 'custom'
                            )
                          }
                          className='text-[#EB0029] focus:ring-[#EB0029]'
                        />
                        <span className='text-sm'>
                          Pago mensual regular ($
                          {credit.monthlyPayment.toLocaleString('es-MX')})
                        </span>
                      </label>
                      <label className='flex items-center space-x-2 cursor-pointer'>
                        <input
                          type='radio'
                          name='paymentType'
                          value='custom'
                          checked={paymentType === 'custom'}
                          onChange={(e) =>
                            setPaymentType(
                              e.target.value as 'monthly' | 'custom'
                            )
                          }
                          className='text-[#EB0029] focus:ring-[#EB0029]'
                        />
                        <span className='text-sm'>Monto personalizado</span>
                      </label>
                    </div>
                  </div>

                  {/* Custom amount input */}
                  {paymentType === 'custom' && (
                    <div className='space-y-2'>
                      <Input
                        type='number'
                        placeholder='Ingresa el monto'
                        value={customAmount}
                        label='Monto a pagar'
                        onChange={(e) => setCustomAmount(e.target.value)}
                        min='1'
                        max={credit.remainingBalance.toString()}
                      />
                      <p className='text-xs text-gray-500'>
                        Máximo: $
                        {credit.remainingBalance.toLocaleString('es-MX')}
                      </p>
                    </div>
                  )}

                  {/* Payment button */}
                  <Button
                    onClick={handlePayment}
                    disabled={
                      isProcessing ||
                      (paymentType === 'custom' &&
                        (!customAmount || Number(customAmount) <= 0))
                    }
                    className='w-full bg-[#EB0029] hover:bg-[#C5001F] text-white'
                  >
                    {isProcessing ? 'Procesando...' : 'Realizar pago'}
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className='border border-gray-200 shadow-sm'>
              <CardHeader>
                <CardTitle className='text-base'>
                  Información del crédito
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-start gap-3'>
                  <DollarSign className='h-5 w-5 text-muted-foreground mt-0.5' />
                  <div className='flex-1'>
                    <p className='text-sm text-muted-foreground'>
                      Monto original
                    </p>
                    <p className='font-semibold'>
                      ${credit.amount.toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <Percent className='h-5 w-5 text-muted-foreground mt-0.5' />
                  <div className='flex-1'>
                    <p className='text-sm text-muted-foreground'>
                      Tasa de interés
                    </p>
                    <p className='font-semibold'>
                      {credit.interestRate}% anual
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <Clock className='h-5 w-5 text-muted-foreground mt-0.5' />
                  <div className='flex-1'>
                    <p className='text-sm text-muted-foreground'>Plazo</p>
                    <p className='font-semibold'>{credit.termMonths} meses</p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <TrendingUp className='h-5 w-5 text-muted-foreground mt-0.5' />
                  <div className='flex-1'>
                    <p className='text-sm text-muted-foreground'>
                      Pago mensual
                    </p>
                    <p className='font-semibold'>
                      $
                      {credit.monthlyPayment.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <FileText className='h-5 w-5 text-muted-foreground mt-0.5' />
                  <div className='flex-1'>
                    <p className='text-sm text-muted-foreground'>
                      Fecha de solicitud
                    </p>
                    <p className='font-semibold'>
                      {new Date(credit.createdAt).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {credit.status === 'approved' && (
              <Card className='border border-gray-200 shadow-sm'>
                <CardHeader>
                  <CardTitle className='text-base'>
                    Resumen financiero
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div>
                    <p className='text-sm text-muted-foreground'>
                      Total a pagar
                    </p>
                    <p className='text-lg font-bold'>
                      $
                      {(
                        credit.monthlyPayment * credit.termMonths
                      ).toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-muted-foreground'>
                      Intereses totales
                    </p>
                    <p className='text-lg font-bold text-[#FF671B]'>
                      $
                      {(
                        credit.monthlyPayment * credit.termMonths -
                        credit.amount
                      ).toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
