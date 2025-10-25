'use client';

import { useNavigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { UserTopBar } from '@/components/UserTopBar';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockCredits, mockSustainabilitySavings } from '@/lib/mock-data';
import { Plus, Clock, DollarSign, TrendingUp, Leaf, Zap } from 'lucide-react';
import { CreditCard } from 'lucide-react';

export default function CreditsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const userCredits = mockCredits.filter((c) => c.userId === user.id);
  const approvedCredits = userCredits.filter((c) => c.status === 'approved');
  const pendingCredits = userCredits.filter((c) => c.status === 'pending');

  const totalMonthlySavings = mockSustainabilitySavings.reduce(
    (sum, s) => sum + s.estimatedMonthlySavings,
    0
  );
  const totalYearlySavings = mockSustainabilitySavings.reduce(
    (sum, s) => sum + s.estimatedYearlySavings,
    0
  );
  const totalCO2Reduction = mockSustainabilitySavings.reduce(
    (sum, s) => sum + s.co2ReductionKg,
    0
  );

  return (
    <div className='min-h-screen bg-background'>
      <UserTopBar />

      <main className='container mx-auto px-4 py-8'>
        {/* Title section - removed back button */}
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-foreground'>
              Créditos Verdes
            </h1>
            <p className='text-muted-foreground'>
              Gestiona y revisa tus créditos sustentables
            </p>
          </div>
          <BanorteButton
            variant='primary'
            onClick={() => router.push('/user/apply')}
          >
            <Plus className='mr-2 h-4 w-4' />
            Solicitar crédito
          </BanorteButton>
        </div>

        {mockSustainabilitySavings.length > 0 && (
          <div className='mb-8'>
            <h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
              <Leaf className='h-5 w-5 text-[#6CC04A]' />
              Impacto en sostenibilidad
            </h2>
            <div className='grid gap-4 md:grid-cols-3 mb-4'>
              <Card className='border-[#6CC04A]'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>
                    Ahorro mensual estimado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-[#6CC04A]'>
                    ${totalMonthlySavings.toLocaleString('es-MX')}
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    ${totalYearlySavings.toLocaleString('es-MX')} al año
                  </p>
                </CardContent>
              </Card>

              <Card className='border-[#6CC04A]'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>
                    Reducción de CO₂
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-[#6CC04A]'>
                    {(totalCO2Reduction / 1000).toFixed(1)} ton
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>Por año</p>
                </CardContent>
              </Card>

              <Card className='border-[#6CC04A]'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>
                    Créditos verdes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-[#6CC04A]'>
                    {mockSustainabilitySavings.length}
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>Activos</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed savings cards */}
            <div className='grid gap-4 md:grid-cols-2'>
              {mockSustainabilitySavings.map((saving) => {
                const credit = mockCredits.find(
                  (c) => c.id === saving.creditId
                );
                if (!credit) return null;

                return (
                  <Card
                    key={saving.creditId}
                    className='border-[#6CC04A]/30 bg-[#6CC04A]/5'
                  >
                    <CardContent className='p-6'>
                      <div className='flex items-start gap-3 mb-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#6CC04A]/20'>
                          <Zap className='h-5 w-5 text-[#6CC04A]' />
                        </div>
                        <div className='flex-1'>
                          <h3 className='font-semibold mb-1'>
                            {credit.purpose}
                          </h3>
                          <p className='text-sm text-muted-foreground'>
                            {saving.description}
                          </p>
                        </div>
                      </div>
                      <div className='grid grid-cols-2 gap-4 mt-4 pt-4 border-t'>
                        <div>
                          <p className='text-xs text-muted-foreground'>
                            Ahorro mensual
                          </p>
                          <p className='text-lg font-semibold text-[#6CC04A]'>
                            $
                            {saving.estimatedMonthlySavings.toLocaleString(
                              'es-MX'
                            )}
                          </p>
                        </div>
                        <div>
                          <p className='text-xs text-muted-foreground'>
                            Ahorro anual
                          </p>
                          <p className='text-lg font-semibold text-[#6CC04A]'>
                            $
                            {saving.estimatedYearlySavings.toLocaleString(
                              'es-MX'
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending credits */}
        {pendingCredits.length > 0 && (
          <div className='mb-8'>
            <h2 className='text-xl font-semibold mb-4'>
              Solicitudes pendientes
            </h2>
            <div className='grid gap-4'>
              {pendingCredits.map((credit) => (
                <Card key={credit.id} className='border-[#FFA400]'>
                  <CardContent className='p-6'>
                    <div className='flex items-start justify-between mb-4'>
                      <div>
                        <Badge className='bg-[#FFA400] text-white mb-2'>
                          Pendiente
                        </Badge>
                        <h3 className='font-semibold text-lg'>
                          ${credit.amount.toLocaleString('es-MX')}
                        </h3>
                        <p className='text-sm text-muted-foreground mt-1'>
                          {credit.purpose}
                        </p>
                      </div>
                      <BanorteButton
                        variant='tertiary'
                        onClick={() =>
                          router.push(`/user/credits/${credit.id}`)
                        }
                      >
                        Ver detalles
                      </BanorteButton>
                    </div>
                    <div className='flex gap-6 text-sm'>
                      <div>
                        <p className='text-muted-foreground'>Solicitado</p>
                        <p className='font-medium'>
                          {new Date(credit.createdAt).toLocaleDateString(
                            'es-MX'
                          )}
                        </p>
                      </div>
                      <div>
                        <p className='text-muted-foreground'>Plazo</p>
                        <p className='font-medium'>{credit.termMonths} meses</p>
                      </div>
                      <div>
                        <p className='text-muted-foreground'>Tasa</p>
                        <p className='font-medium'>{credit.interestRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Active credits */}
        <div>
          <h2 className='text-xl font-semibold mb-4'>Créditos activos</h2>
          {approvedCredits.length === 0 ? (
            <Card>
              <CardContent className='flex flex-col items-center justify-center py-12'>
                <CreditCard className='h-12 w-12 text-muted-foreground mb-4' />
                <p className='text-muted-foreground mb-4'>
                  No tienes créditos activos
                </p>
                <BanorteButton
                  variant='primary'
                  onClick={() => router.push('/user/apply')}
                >
                  Solicitar tu primer crédito
                </BanorteButton>
              </CardContent>
            </Card>
          ) : (
            <div className='grid gap-4 md:grid-cols-2'>
              {approvedCredits.map((credit) => (
                <Card
                  key={credit.id}
                  className='cursor-pointer transition-shadow hover:shadow-lg'
                  onClick={() => router.push(`/user/credits/${credit.id}`)}
                >
                  <CardHeader>
                    <div className='flex items-start justify-between'>
                      <div>
                        <Badge className='bg-[#6CC04A] text-white mb-2'>
                          Activo
                        </Badge>
                        <CardTitle className='text-xl'>
                          ${credit.amount.toLocaleString('es-MX')}
                        </CardTitle>
                      </div>
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
                        <span className='text-muted-foreground'>
                          Pago mensual:
                        </span>
                        <span className='font-semibold'>
                          $
                          {credit.monthlyPayment.toLocaleString('es-MX', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
