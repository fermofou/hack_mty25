'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { UserTopBar } from '../components/UserTopBar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { BatteryCharging, LeafIcon, X } from 'lucide-react';
import { Button } from '@/components/Button';
import TransactionList from '@/components/TransactionList';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isGreenCreditExpanded, setIsGreenCreditExpanded] = useState(false);

  useEffect(() => {
    if (user === null) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className='min-h-screen bg-background'>
      <UserTopBar />

      <main className='container mx-auto px-4 py-8 max-w-[1200px]'>
        {/* Welcome section */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-foreground mb-2'>
            Hola, {user.nombre.split(' ')[0]}
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
                  {user.saldo.toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preapproved credit */}
        <Card className='mb-8 bg-linear-to-br from-green-50 to-green-100 border-green-300 shadow-lg overflow-hidden'>
          <CardHeader className='text-green-700 font-bold pb-3'>
            <div className='flex justify-between items-start'>
              <div className='flex items-center gap-3'>
                <div className='bg-green-600 rounded-full p-2'>
                  <LeafIcon className='text-white' size={20} />
                </div>
                <div>
                  <h3 className='text-lg font-semibold text-green-800'>
                    Crédito Verde Preaprobado
                  </h3>
                  <p className='text-sm text-green-600 font-normal'>
                    Panel Solar Residencial
                  </p>
                </div>
              </div>
              <button className='cursor-pointer text-green-600 hover:text-green-800 transition-colors'>
                <X size={20} />
              </button>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Main offer section - Always visible */}
            <div className='bg-white rounded-lg p-4 border border-green-200'>
              <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4'>
                <div className='flex items-center gap-3 lg:gap-4'>
                  <BatteryCharging className='text-green-700 w-10 h-10 lg:w-12 lg:h-12' />
                  <div className='flex-1'>
                    <p className='text-sm lg:text-base text-gray-700 leading-relaxed'>
                      Instala paneles solares en tu hogar y reduce tu factura de
                      luz hasta un{' '}
                      <span className='font-semibold text-green-700'>90%</span>
                    </p>
                    <p className='text-base lg:text-lg font-bold text-green-700 mt-1 lg:mt-2'>
                      Hasta $100,000 disponibles
                    </p>
                  </div>
                </div>
                {!isGreenCreditExpanded && (
                  <Button
                    variant='secondary'
                    className='border-green-600 text-green-700 hover:bg-green-50 hover:border-green-700 hover:text-green-700 w-full lg:w-auto'
                    onClick={() => setIsGreenCreditExpanded(true)}
                  >
                    Más información
                  </Button>
                )}
              </div>
            </div>

            {/* Expandable content with animation */}
            <div
              className={`transition-all duration-500 ease-in-out ${
                isGreenCreditExpanded
                  ? 'max-h-96 opacity-100'
                  : 'max-h-0 opacity-0 overflow-hidden'
              }`}
            >
              <div className='space-y-3 lg:space-y-4 pt-2'>
                {/* Credit details grid */}
                <div className='grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4'>
                  <div className='bg-white rounded-lg p-2 lg:p-3 text-center border border-green-200 transform transition-transform duration-300 hover:scale-105'>
                    <div className='text-lg lg:text-2xl font-bold text-green-700'>
                      $100,000
                    </div>
                    <div className='text-xs text-green-600 font-medium'>
                      Monto disponible
                    </div>
                  </div>
                  <div className='bg-white rounded-lg p-2 lg:p-3 text-center border border-green-200 transform transition-transform duration-300 hover:scale-105'>
                    <div className='text-lg lg:text-2xl font-bold text-green-700'>
                      8.9%
                    </div>
                    <div className='text-xs text-green-600 font-medium'>
                      Tasa anual
                    </div>
                  </div>
                  <div className='bg-white rounded-lg p-2 lg:p-3 text-center border border-green-200 transform transition-transform duration-300 hover:scale-105'>
                    <div className='text-lg lg:text-2xl font-bold text-green-700'>
                      60
                    </div>
                    <div className='text-xs text-green-600 font-medium'>
                      Meses máx.
                    </div>
                  </div>
                  <div className='bg-white rounded-lg p-2 lg:p-3 text-center border border-green-200 transform transition-transform duration-300 hover:scale-105'>
                    <div className='text-lg lg:text-2xl font-bold text-green-700'>
                      $2,140
                    </div>
                    <div className='text-xs text-green-600 font-medium'>
                      Pago mensual est.*
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className='bg-green-50 rounded-lg p-3 border border-green-200 transform transition-all duration-300'>
                  <div className='flex flex-wrap gap-x-4 gap-y-2 text-sm text-green-700'>
                    <div className='flex items-center gap-1'>
                      <span>✓</span>
                      <span>Sin comisión por apertura</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <span>✓</span>
                      <span>Instalación incluida</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <span>✓</span>
                      <span>Garantía 25 años</span>
                    </div>
                  </div>
                </div>

                {/* Expanded action buttons */}
                <div className='flex flex-col lg:flex-row gap-3'>
                  <Button className='flex-1 bg-green-700 hover:bg-green-800 text-white'>
                    Solicitar ahora
                  </Button>
                  <Button
                    variant='secondary'
                    className='border-green-600 text-green-700 hover:bg-green-50 hover:border-green-700 hover:text-green-700'
                    onClick={() => setIsGreenCreditExpanded(false)}
                  >
                    Mostrar menos
                  </Button>
                </div>

                <p className='text-xs text-gray-500 text-center'>
                  *Cálculo estimado para $100,000 a 60 meses. Sujeto a
                  aprobación crediticia.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <TransactionList />
      </main>
    </div>
  );
}
