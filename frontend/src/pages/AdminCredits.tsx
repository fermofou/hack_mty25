"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { AdminTopBar } from "../components/AdminTopBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { AlertCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { Credito, ClienteAlerta, AhorroTotal } from "@/lib/types";
import {
  obtenerClientesConAlertas,
  calcularInteresGanado,
  calcularAhorrosPorCredito,
  calcularPorcentajeAlDia,
  obtenerClientesConCreditos,
} from "@/lib/admin-utils";

export default function UserDashboard() {
  const navigate = useNavigate();
  const { admin } = useAuth();
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientesConCreditos, setClientesConCreditos] = useState<number>(0);
  const [clientesConAlertas, setClientesConAlertas] = useState<ClienteAlerta[]>(
    []
  );
  const [ahorrosPorCredito, setAhorrosPorCredito] = useState<AhorroTotal[]>([]);
  const mockAdminStats = {
    totalCapital: 500000,
    activeCredits: 25,
    totalDisbursed: 300000,
    interestEarned: 45000,
    pendingCredits: 3,
  };

  useEffect(() => {
    // Fetch creditos from API
    api
      .get("/creditos")
      .then((res) => {
        const data_creditos: Credito[] = res.data;
        console.log("[v0] Creditos fetched:", data_creditos);
        setCreditos(data_creditos);
        setClientesConAlertas(obtenerClientesConAlertas(data_creditos));
        setAhorrosPorCredito(calcularAhorrosPorCredito(data_creditos));
        setClientesConCreditos(obtenerClientesConCreditos(data_creditos));
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching creditos:", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (admin === null) {
      navigate("/admin");
    }
  }, [admin, navigate]);

  if (!admin) {
    return null;
  }

  // Calculate statistics
  const creditosVerdes = creditos.filter(
    (c) => c.categoria === "Luz" && c.estado === "ACEPTADO"
  ).length;
  const pendientesAprobar = creditos.filter(
    (c) => c.estado === "PENDIENTE"
  ).length;
  const porcentajeAlDia = calcularPorcentajeAlDia(creditos);
  const interesGanado = calcularInteresGanado(creditos);
  const ahorroTotalEsperado = ahorrosPorCredito.reduce(
    (sum, a) => sum + a.ahorroTotal10Anos,
    0
  );

  // Prepare chart data for interest earned by credit
  const interestChartData = creditos
    .filter((c) => c.estado === "ACEPTADO")
    .map((c) => ({
      nombre: `${c.descripcion.substring(0, 15)}...`,
      interes: Math.round(
        (c.prestamo * (c.interes / 100) * c.pagado) /
          (c.prestamo * (1 + c.interes / 100))
      ),
    }))
    .slice(0, 10);

  // Prepare chart data for total savings
  const savingsChartData = ahorrosPorCredito.map((a) => ({
    nombre: `${a.descripcion.substring(0, 15)}...`,
    ahorro: Math.round(a.ahorroTotal10Anos),
  }));

  return (
    <div className="min-h-screen bg-background">
      <AdminTopBar />

      <main className="container mx-auto px-4 py-8 max-w-[1200px]">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Revision de Creditos
          </h1>
          <p className="text-muted-foreground">
            Resumen general de créditos verdes
          </p>
        </div>

        {/* Tabla de Alertas (Tu idea principal) */}

        <Card>
          <CardHeader>
            <CardTitle>Alertas de Pagos Recientes</CardTitle>
            <CardDescription>
              Clientes que requieren seguimiento por pagos atrasados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Cliente</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción del Crédito</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesConAlertas.map((alerta) => (
                  <TableRow key={alerta.id_cred}>
                    <TableCell className="font-medium">
                      {alerta.cliente_id}
                    </TableCell>
                    <TableCell>{alerta.nombre}</TableCell>
                    <TableCell>{alerta.descripcion}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Atrasado</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
