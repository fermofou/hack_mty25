import { useEffect, useState, type PropsWithChildren } from "react";
import { AuthContext, type User, type Admin } from "./AuthContext";
import { api } from "@/lib/api";

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    const loadUser = async (userId: number) => {
      try {
        const { data } = await api.get(`/clientes/${userId}`);
        setUser(data);
      } catch {
        setUser(null);
      }
    };

    const loadAdmin = async (adminId: number) => {
      try {
        const { data } = await api.get(`/admin/${adminId}`);
        setAdmin(data);
      } catch {
        setAdmin(null);
      }
    };

    const userId = localStorage.getItem("userId");
    const adminId = localStorage.getItem("adminId");

    if (userId) loadUser(Number(userId));
    if (adminId) loadAdmin(Number(adminId));
  }, []);

  // Login helper: either user or admin
  const loginUser = async (username: string, pwd: string) => {
    const { data } = await api.post<User>("/clientes/login", { username, pwd });
    setUser(data);
    localStorage.setItem("userId", String(data.id));
    setAdmin(null); // clear admin just in case
    localStorage.removeItem("adminId");
  };

  const loginAdmin = async (username: string, pwd: string) => {
    const { data } = await api.post<Admin>("/admin/login", { username, pwd });
    setAdmin(data);
    localStorage.setItem("adminId", String(data.id_admin)); // use id_admin from response
    setUser(null);
    localStorage.removeItem("userId");
  };

  const logout = () => {
    setUser(null);
    setAdmin(null);
    localStorage.removeItem("userId");
    localStorage.removeItem("adminId");
  };

  return (
    <AuthContext.Provider
      value={{ user, admin, loginUser, loginAdmin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
