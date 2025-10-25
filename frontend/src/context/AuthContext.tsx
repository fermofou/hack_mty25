import { createContext, useContext } from "react";

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  username: string;
  credit_score: number;
  fecha_nacimiento: string;
  edad: number;
  saldo: number;
  ciudad: string;
}

export interface Admin {
  id_admin: number;
  nombre: string;
  apellido: string;
  username: string;
}

interface AuthContextType {
  user?: User | null;
  admin?: Admin | null;
  loginUser: (username: string, pwd: string) => Promise<void>;
  loginAdmin: (username: string, pwd: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
