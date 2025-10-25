import { createContext, useContext } from 'react';

export interface User {
  id: string;
  userId: string;
  name: string;
  lastName: string;
  type: 'user' | 'admin';
  balance: number;
  accountNumber: string;
}

interface AuthContextType {
  user?: User;
  setUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
