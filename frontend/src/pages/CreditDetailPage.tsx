'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { UserTopBar } from '@/components/UserTopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import {
  Calendar,
  DollarSign,
  Percent,
  Clock,
  TrendingUp,
  FileText,
  ChevronLeft,
  Download,
} from 'lucide-react';
import type { Credit } from './CreditsDashboard';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function CreditDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [paymentType, setPaymentType] = useState<'monthly' | 'custom'>(
    'monthly'
  );
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showContract, setShowContract] = useState(false);

  const [credit, setCredit] = useState<Credit | undefined | null>();

  useEffect(() => {
    const fetchCredit = async () => {
      try {
        const { data } = await api.get(`creditos/${params.id}`);
        console.log(data);
        setCredit(data);
      } catch (err: unknown) {
        console.log(err);
      }
    };
    fetchCredit();
  }, [params]);

  if (!user) {
    return null;
  }

  if (credit === null) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <p>Crédito no encontrado</p>
      </div>
    );
  }

  if (credit === undefined) {
    return (
      <div className='flex justify-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-2 border-b-transparent border-[#EB0029]'></div>
      </div>
    );
  }

  const handlePayment = async () => {
    if (!credit || !user) return;
    setIsProcessing(true);
    const monto =
      paymentType === 'monthly'
        ? credit.gasto_inicial_mes
        : Number(customAmount);
    try {
      const { data } = await api.post('/creditos/pagar', {
        credito_id: credit.id_cred,
        cliente_id: user.id,
        monto,
      });
      // Update credit and user data with response
      setCredit(data.credito);
      if (typeof window !== 'undefined' && window.localStorage) {
        // Update user in Auth context and localStorage
        const updatedUser = { ...user, ...data.cliente };
        window.localStorage.setItem('user', JSON.stringify(updatedUser));
        // If useAuth provides a setter, call it here (if available)
        if (typeof (window as any).setUser === 'function') {
          (window as any).setUser(updatedUser);
        }
      }
  toast.success(`Pago procesado: $${monto.toLocaleString('es-MX')}`);
    } catch (err) {
      toast.error('Error al procesar el pago. Intenta de nuevo.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateRemainingMonths = () => {
    const startDate = new Date(credit.fecha_inicio);
    const currentDate = new Date();
    const monthsElapsed =
      (currentDate.getFullYear() - startDate.getFullYear()) * 12 +
      (currentDate.getMonth() - startDate.getMonth());
    const monthsLeft = Math.max(0, credit.meses_originales - monthsElapsed);
    return monthsLeft;
  };
  const remainingMonths = calculateRemainingMonths();

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
                      ${credit.prestamo.toLocaleString('es-MX')}
                    </CardTitle>
                  </div>
                  <Badge
                    className={
                      credit.estado === 'ACEPTADO'
                        ? 'bg-[#6CC04A] text-white'
                        : credit.estado === 'PENDIENTE'
                        ? 'bg-[#FFA500] text-white'
                        : credit.estado === 'APROBADO'
                        ? 'bg-blue-500 text-white'
                        : 'bg-destructive text-white'
                    }
                  >
                    {credit.estado === 'ACEPTADO'
                      ? 'Activo'
                      : credit.estado === 'PENDIENTE'
                      ? 'Pendiente'
                      : credit.estado === 'APROBADO'
                      ? 'Aprobado'
                      : 'Rechazado'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground mb-4 line-clamp-2'>
                  {credit.descripcion}
                </p>

                <div className='space-y-3'>
                  <div className='flex items-center gap-2 text-sm'>
                    <DollarSign className='h-4 w-4 text-muted-foreground' />
                    <span className='text-muted-foreground'>Saldo:</span>
                    <span className='font-semibold'>
                      $
                      {(credit.prestamo - credit.pagado).toLocaleString(
                        'es-MX'
                      )}
                    </span>
                  </div>

                  <div className='flex items-center gap-2 text-sm'>
                    <Clock className='h-4 w-4 text-muted-foreground' />
                    <span className='text-muted-foreground'>
                      Tiempo restante:
                    </span>
                    <span className='font-semibold'>
                      {remainingMonths} meses
                    </span>
                  </div>

                  <div className='flex items-center gap-2 text-sm'>
                    <TrendingUp className='h-4 w-4 text-muted-foreground' />
                    <span className='text-muted-foreground'>Pago mensual:</span>
                    <span className='font-semibold'>
                      $
                      {credit.gasto_inicial_mes.toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                {credit.estado === 'ACEPTADO' && (
                  <>
                    {/* Progress bar */}
                    <div className='mt-4'>
                      <div className='flex justify-between text-xs text-muted-foreground mb-1'>
                        <span>Progreso</span>
                        <span>
                          {Math.round((credit.pagado / credit.prestamo) * 100)}%
                        </span>
                      </div>
                      <div className='h-2 bg-secondary rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-[#EB0029]'
                          style={{
                            width: `${
                              (credit.pagado / credit.prestamo) * 100
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
                          ${credit.pagado.toLocaleString('es-MX')}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-muted-foreground mb-1'>
                          Saldo restante
                        </p>
                        <p className='text-xl font-bold text-[#EB0029]'>
                          $
                          {(credit.prestamo - credit.pagado).toLocaleString(
                            'es-MX'
                          )}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Firmar un credito aprobado */}
            {credit.estado === 'APROBADO' && (
              <Card>
                <CardHeader>
                  <CardTitle>Firmar el crédito</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Tu crédito ha sido aprobado. Firma aquí para aceptar el
                    crédito.
                  </p>
                  <div className='gap-2 flex w-full justify-end mt-4'>
                    <Button variant='secondary'>Rechazar</Button>
                    <Button onClick={() => setShowContract(true)}>
                      Firmar contrato
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment schedule */}
            {credit.estado === 'ACEPTADO' && (
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
                            {credit.gasto_inicial_mes.toLocaleString('es-MX', {
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
            {credit.estado === 'ACEPTADO' && (
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
                        ${credit.gasto_inicial_mes.toLocaleString('es-MX')}
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
                          {credit.gasto_inicial_mes.toLocaleString('es-MX')})
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
                        max={(credit.prestamo - credit.pagado).toString()}
                      />
                      <p className='text-xs text-gray-500'>
                        Máximo: $
                        {(credit.prestamo - credit.pagado).toLocaleString(
                          'es-MX'
                        )}
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
                      ${credit.prestamo.toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <Percent className='h-5 w-5 text-muted-foreground mt-0.5' />
                  <div className='flex-1'>
                    <p className='text-sm text-muted-foreground'>
                      Tasa de interés
                    </p>
                    <p className='font-semibold'>{credit.interes}% anual</p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <Clock className='h-5 w-5 text-muted-foreground mt-0.5' />
                  <div className='flex-1'>
                    <p className='text-sm text-muted-foreground'>Plazo</p>
                    <p className='font-semibold'>
                      {credit.meses_originales} meses
                    </p>
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
                      {credit.gasto_inicial_mes.toLocaleString('es-MX', {
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
                      {new Date(credit.fecha_inicio).toLocaleDateString(
                        'es-MX'
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {credit.estado === 'ACEPTADO' && (
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
                        credit.gasto_inicial_mes * credit.meses_originales
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
                        credit.gasto_inicial_mes * credit.meses_originales -
                        credit.prestamo
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

      {/* Contract Modal */}
      <ContractModal
        credit={credit}
        show={showContract}
        onClose={() => setShowContract(false)}
      />
    </div>
  );
}

// Contract Modal Component
interface ContractModalProps {
  credit: Credit | null;
  show: boolean;
  onClose: () => void;
}

function ContractModal({ credit, show, onClose }: ContractModalProps) {
  const { user } = useAuth();
  const [isClosing, setIsClosing] = useState(false);

  if (!credit) return null;

  const handleClose = () => {
    setIsClosing(true);
    // Allow animation to complete before actually closing
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleDownloadContract = async () => {
    if (!credit) return;

    try {
      // Generate HTML content optimized for PDF
      const contractHTML = generateContractHTML(credit, user, false);
      await downloadAsPDF(contractHTML, credit.id_cred);
    } catch (error) {
      console.error('Error downloading contract:', error);
      // Fallback to HTML download if PDF fails
      const contractHTML = generateContractHTML(credit, user, false);
      downloadAsHTML(contractHTML, credit.id_cred);
    }
  };

  if (!user) return null;

  const handleSignContract = async () => {
    if (!credit) return;

    try {
      // Call API to sign/accept the credit
      await api.patch(`clientes/${user.id}/creditos/${credit.id_cred}/aceptar`);

      // Refresh the page or update state
      window.location.reload();
    } catch (error) {
      console.error('Error signing contract:', error);
      alert('Error al firmar el contrato. Intenta de nuevo.');
    }
  };

  return (
    <Dialog open={show && !isClosing} onOpenChange={handleClose}>
      <DialogContent
        className={`w-[70vw] max-w-none max-h-[90vh] overflow-y-auto transition-all duration-300 ease-out ${
          isClosing
            ? 'animate-out fade-out-0 zoom-out-95 duration-300'
            : 'animate-in fade-in-0 zoom-in-95 duration-300'
        }`}
      >
        <DialogHeader>
          <DialogTitle
            className={`flex items-center justify-between transition-all duration-500 ease-out ${
              isClosing
                ? 'animate-out slide-out-to-top-2 duration-400'
                : 'animate-in slide-in-from-top-2 duration-500'
            }`}
          >
            <span className='font-semibold text-lg'>
              Contrato de Crédito Verde
            </span>
            <div className='flex gap-2'>
              <Button
                variant='secondary'
                onClick={handleDownloadContract}
                className={`flex items-center gap-2 transition-all duration-700 ease-out hover:scale-105 ${
                  isClosing
                    ? 'animate-out slide-out-to-right-4 duration-600'
                    : 'animate-in slide-in-from-right-4 duration-700'
                }`}
              >
                <Download className='h-4 w-4' />
                Descargar PDF
              </Button>
              <Button
                onClick={handleSignContract}
                className={`bg-[#EB0029] hover:bg-[#C5001F] text-white flex items-center gap-2 transition-all duration-700 ease-out hover:scale-105 shadow-lg hover:shadow-xl ${
                  isClosing
                    ? 'animate-out slide-out-to-right-6 duration-600'
                    : 'animate-in slide-in-from-right-6 duration-700'
                }`}
              >
                Firmar contrato
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div
          className={`border rounded-lg p-8 bg-white text-black overflow-y-auto transition-all duration-500 ease-out shadow-inner ${
            isClosing
              ? 'animate-out slide-out-to-bottom-4 duration-400 delay-0'
              : 'animate-in slide-in-from-bottom-4 duration-500 delay-150'
          }`}
          dangerouslySetInnerHTML={{
            __html: generateContractHTML(credit, user, true),
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

// Contract HTML generation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateContractHTML = (
  credit: Credit,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any,
  isPreview: boolean = false
): string => {
  const clienteName = user
    ? `${user.nombre || ''} ${user.apellido || ''}`.trim() || 'Cliente'
    : 'Cliente';

  const previewStyles = isPreview
    ? `
    body { 
      font-family: Arial, sans-serif; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 20px; 
      line-height: 1.6; 
      color: #333;
    }
  `
    : `
    @page { 
      size: A4; 
      margin: 2cm; 
    }
    body { 
      font-family: Arial, sans-serif; 
      margin: 0;
      padding: 0;
      line-height: 1.6; 
      color: #333;
    }
  `;

  const isApproved =
    credit.estado === 'APROBADO' || credit.estado === 'ACEPTADO';
  const isAccepted = credit.estado === 'ACEPTADO';
  const clienteNameStyle = isApproved
    ? 'font-weight: bold; color: #000;'
    : 'color: #666;';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Contrato de Crédito Verde - Banorte</title>
      <style>
        ${previewStyles}
        .header { text-align: center; border-bottom: 3px solid #EB0029; padding-bottom: 20px; margin-bottom: 30px; }
        .logo-container { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px; }
        .logo-text { color: #EB0029; font-size: 32px; font-weight: bold; }
        .title { font-size: 24px; margin-top: 10px; color: #333; font-weight: bold; }
        .section { margin: 30px 0; page-break-inside: avoid; }
        .section-title { font-size: 18px; font-weight: bold; color: #EB0029; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 5px; }
        .field { margin: 10px 0; display: flex; }
        .field-label { font-weight: bold; min-width: 200px; }
        .field-value { flex: 1; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #eee; text-align: center; color: #666; font-size: 12px; }
        .signature-section { margin-top: 60px; display: flex; justify-content: space-around; page-break-inside: avoid; }
        .signature-box { text-align: center; }
        .signature-line { border-top: 2px solid #333; width: 200px; margin: 40px auto 10px; }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-container">
          <div class="logo-text">BANORTE</div>
        </div>
        <div class="title">CONTRATO DE CRÉDITO VERDE${
          isApproved
            ? ' - <span style="color: #6CC04A; font-weight: bold;">PARA FIRMA</span>'
            : ''
        }</div>
      </div>

      <div class="section">
        <div class="section-title">INFORMACIÓN DEL CLIENTE</div>
        <div class="field">
          <div class="field-label">Nombre:</div>
          <div class="field-value">${clienteName}</div>
        </div>
        <div class="field">
          <div class="field-label">ID Cliente:</div>
          <div class="field-value">${user?.id || 'N/A'}</div>
        </div>
        <div class="field">
          <div class="field-label">Fecha de Contrato:</div>
          <div class="field-value">${new Date(
            credit.fecha_inicio
          ).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">TÉRMINOS DEL CRÉDITO</div>
        <div class="field">
          <div class="field-label">Monto del Préstamo:</div>
          <div class="field-value">$${credit.prestamo.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
          })} MXN</div>
        </div>
        <div class="field">
          <div class="field-label">Tasa de Interés Anual:</div>
          <div class="field-value">${credit.interes}%</div>
        </div>
        <div class="field">
          <div class="field-label">Plazo:</div>
          <div class="field-value">${credit.meses_originales} meses</div>
        </div>
        <div class="field">
          <div class="field-label">Pago Mensual:</div>
          <div class="field-value">$${credit.gasto_inicial_mes.toLocaleString(
            'es-MX',
            {
              minimumFractionDigits: 2,
            }
          )} MXN</div>
        </div>
        <div class="field">
          <div class="field-label">Categoría:</div>
          <div class="field-value">${credit.categoria}</div>
        </div>
        <div class="field">
          <div class="field-label">Descripción:</div>
          <div class="field-value">${credit.descripcion}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">IMPACTO AMBIENTAL ESTIMADO</div>
        <div class="field">
          <div class="field-label">Gasto Mensual Inicial:</div>
          <div class="field-value">$${credit.gasto_inicial_mes.toLocaleString(
            'es-MX',
            {
              minimumFractionDigits: 2,
            }
          )} MXN</div>
        </div>
        <div class="field">
          <div class="field-label">Gasto Mensual Proyectado:</div>
          <div class="field-value">$${credit.gasto_final_mes.toLocaleString(
            'es-MX',
            {
              minimumFractionDigits: 2,
            }
          )} MXN</div>
        </div>
        <div class="field">
          <div class="field-label">Ahorro Mensual Estimado:</div>
          <div class="field-value" style="color: #6CC04A; font-weight: bold;">$${(
            credit.gasto_inicial_mes - credit.gasto_final_mes
          ).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</div>
        </div>
      </div>

      <div class="section">
        <p style="text-align: justify; color: #666; font-size: 14px;">
          El presente contrato establece los términos y condiciones bajo los cuales BANORTE otorga un crédito verde al cliente mencionado. 
          El cliente se compromete a realizar los pagos mensuales en las fechas establecidas y a utilizar los fondos exclusivamente para 
          los fines ambientales especificados en este documento.
        </p>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          ${
            isAccepted
              ? `<div style="font-size: 14px; ${clienteNameStyle} margin-bottom: 10px;">${clienteName}</div>`
              : ''
          }
          <div class="signature-line"></div>
          <div style="margin-top: 10px;">Cliente</div>
          <div style="font-size: 12px; color: #666;">${clienteName}</div>
        </div>
        <div class="signature-box">
        ${
          isApproved
            ? `<div style="font-size: 14px; ${clienteNameStyle} margin-bottom: 10px;">Sergio Mercurial</div>`
            : ''
        }
          <div class="signature-line"></div>
          <div style="margin-top: 10px;">Representante</div>
          <div style="font-size: 12px; color: #666;">BANORTE</div>
        </div>
      </div>

      <div class="footer">
        <p>BANORTE - Créditos Verdes | Sucursal Principal</p>
        <p>Este documento es legalmente vinculante una vez firmado por ambas partes</p>
        <p>Documento generado el ${new Date().toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}</p>
      </div>
    </body>
    </html>
  `;
};

const downloadAsPDF = async (
  content: string,
  _creditId: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary iframe to render the HTML for PDF conversion
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      document.body.appendChild(iframe);

      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(content);
        iframeDoc.close();

        // Wait for content to load
        setTimeout(() => {
          try {
            // Use browser's print to PDF functionality
            if (iframe.contentWindow) {
              iframe.contentWindow.print();
              resolve();
            } else {
              throw new Error('Could not access iframe window');
            }
          } catch (error) {
            console.error('Print failed:', error);
            reject(error);
          } finally {
            document.body.removeChild(iframe);
          }
        }, 1000);
      } else {
        document.body.removeChild(iframe);
        reject(new Error('Could not access iframe document'));
      }
    } catch (error) {
      reject(error);
    }
  });
};

const downloadAsHTML = (content: string, creditId: number) => {
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contrato-${creditId}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
