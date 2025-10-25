import type React from 'react';

import { useState } from 'react';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useNavigate } from 'react-router';
import { AxiosError } from 'axios';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data } = await api.post('clientes/login', {
        username,
        pwd: password,
      });
      console.log(data);
      navigate('/user/dashboard');
      setUser(data);
    } catch (err) {
      console.log('broke with username:', username, 'password:', password);

      // Type guard for axios errors
      if (err instanceof AxiosError) {
        if (err.response?.data?.detail) {
          setError(err.response.data.detail);
        } else {
          setError('Error al iniciar sesión');
        }
      } else {
        setError('Error al iniciar sesión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen'>
      {/* Left side - Login form */}
      <div className='flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-16'>
        <div className='mx-auto w-full max-w-md'>
          {/* <BanorteLogo className='mb-12' /> */}

          <h1 className='mb-2 text-3xl font-bold text-foreground'>
            Bienvenido
          </h1>
          <p className='mb-8 text-muted-foreground'>
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <Input
              label='Nombre de Usuario'
              type='text'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <Input
              label='Contraseña'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
              required
            />

            <div className='flex items-center justify-between'>
              <label className='flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  className='h-4 w-4 rounded border-border'
                />
                <span className='text-muted-foreground'>Recordarme</span>
              </label>
              <button
                type='button'
                className='text-sm text-[#EB0029] hover:underline cursor-pointer'
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <Button
              type='submit'
              variant='primary'
              className='w-full'
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className='hidden lg:flex lg:w-1/2 bg-[#EB0029] items-center justify-center p-16'>
        <div className='text-center flex gap-4 flex-col'>
          <img src='images/logo_white.png' />
          <p className='text-xl text-white/90'>
            Gestiona tus créditos de forma simple y segura
          </p>
        </div>
      </div>
    </div>
  );
}
