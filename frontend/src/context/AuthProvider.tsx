import { useState, type PropsWithChildren } from 'react';
import { AuthContext, type User } from './AuthContext';

export const AuthProvider = ({ children }: PropsWithChildren) => {
  // Mock user for development/testing
  const mockUser: User = {
    id: 'user-1',
    userId: 'user-1',
    name: 'Juan Carlos',
    lastName: 'García López',
    type: 'user',
    balance: 15750.5,
    accountNumber: '**** **** **** 4532',
  };

  const [user, setUser] = useState<User | undefined>(mockUser);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
