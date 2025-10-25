import { useEffect, useState, type PropsWithChildren } from 'react';
import { AuthContext, type User } from './AuthContext';
import { api } from '@/lib/api';

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | undefined | null>();

  useEffect(() => {
    const loadUser = async (userId: number) => {
      const { data: user } = await api.get(`clientes/${userId}`);
      setUser(user);
    };

    const userId = localStorage.getItem('userId');
    if (userId) {
      loadUser(Number(userId));
    } else {
      setUser(null);
    }
  }, []);

  const login = (user: User | null) => {
    setUser(user);
    if (user) {
      localStorage.setItem('userId', String(user.id));
    } else {
      localStorage.removeItem('userId');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login }}>
      {children}
    </AuthContext.Provider>
  );
};
