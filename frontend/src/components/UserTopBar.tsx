'use client';

import BanorteLogo from './BanorteLogo';
import { Button } from './Button';
import { useLocation, useNavigate } from 'react-router';
import { Home, CreditCard, Leaf } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function UserTopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const navItems = [
    { href: '/user/dashboard', label: 'Inicio', icon: Home },
    { href: '#', label: 'Créditos', icon: CreditCard },
    { href: '/user/credits', label: 'Créditos Verdes', icon: Leaf },
  ];

  const logout = () => {
    navigate('/');
    login(null);
  };

  return (
    <div className='border-b bg-white'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4'>
        <div className='flex items-center gap-8'>
          <BanorteLogo />
        </div>
        <div className='flex items-center gap-3'>
          <nav className='flex items-center gap-2'>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => item.href !== '#' && navigate(item.href)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-[#EB0029] text-white'
                      : 'text-[#586670] hover:text-[#EB0029] hover:bg-[#F6F6F6]'
                  }`}
                  style={{ fontFamily: 'Gotham, sans-serif', fontWeight: 500 }}
                >
                  <Icon className='h-4 w-4' />
                  <span className='hidden lg:inline'>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <Button variant='tertiary' onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
