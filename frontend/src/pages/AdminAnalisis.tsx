"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { AdminTopBar } from "../components/AdminTopBar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { TrendingUp, LucidePieChart, BarChart3, Download } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";
import type { Credito } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BanorteButton } from "@/components/ui/BanorteButton";
import { categorySavingsData } from "@/lib/mock-data";

export default function AdminAnalisis() {
  const navigate = useNavigate();
  const { admin } = useAuth();
  const [creditos, setCreditos] = useState<Credito[]>([]);

  const [loading, setLoading] = useState(true);
  const [acceptedVsRejected, setAcceptedVsRejected] = useState<
    { month: string; accepted: number; rejected: number }[]
  >([]);

  // array con rango de distribucion de interes
  const [interestRateDistribution, setInterestRateDistribution] = useState<
    { range: string; count: number }[]
  >([]);

  const [creditPurposeFrequency, setCreditPurposeFrequency] = useState<
    { category: string; count: number }[]
  >([]);
  // Mock admin stats (TODO: Replace with API data)
  const mockAdminStats = {
    approvalRate: 85,
    defaultRate: 2.3,
  };

  // Monthly disbursement trend data (TODO: Replace with API data)
  const monthlyData = [
    { month: "Ene", disbursed: 850000, approved: 12, rejected: 2 },
    { month: "Feb", disbursed: 920000, approved: 15, rejected: 3 },
    { month: "Mar", disbursed: 780000, approved: 11, rejected: 1 },
    { month: "Abr", disbursed: 1050000, approved: 18, rejected: 4 },
    { month: "May", disbursed: 1150000, approved: 20, rejected: 2 },
    { month: "Jun", disbursed: 980000, approved: 16, rejected: 3 },
  ];

  // Interest rate distribution (TODO: Replace with API data)
  const rateData = [
    { range: "8-10%", count: 25 },
    { range: "10-12%", count: 45 },
    { range: "12-14%", count: 52 },
    { range: "14-16%", count: 28 },
    { range: "16%+", count: 6 },
  ];

  const COLORS = ["#EB0029", "#6CC04A", "#FFA400", "#323E48", "#586670"];

  const handleExport = () => {
    // TODO: Implement PDF export functionality
    alert("Exportando reporte en formato PDF...");
  };

  // TODO: Replace with actual API calls when ready to connect to backend
  useEffect(() => {
    // Fetch creditos from API
    api
      .get("/creditos")
      .then((res) => {
        const data_creditos: Credito[] = res.data;
        console.log("Creditos fetched:", data_creditos);
        setCreditos(data_creditos);
        setLoading(false);

        // Process real API data to create monthly statistics
        const monthlyStats = processMonthlyData(data_creditos);
        setAcceptedVsRejected(monthlyStats);

        //sumar total de prestamo por categoría de crédito
        const purposeAmount: { [key: string]: number } = {};
        const interestRangeCount: { [key: string]: number } = {};

        data_creditos.forEach((credito) => {
          // Rename "Luz" to "Energía Solar" for display
          let category = credito.categoria;
          if (category === "Luz") {
            category = "Energía Solar";
          }

          if (credito.estado === "ACEPTADO") {
            purposeAmount[category] =
              (purposeAmount[category] || 0) + credito.prestamo;

            // Sumar frecuencia a la distribución de interés
            const getInterestRange = (interest: number): string | null => {
              if (interest < 6) return "4-6%";
              if (interest < 8) return "6-8%";
              if (interest < 10) return "8-10%";
              if (interest < 12) return "10-12%";
              if (interest < 14) return "12-14%";
              return "14%+";
            };
            const interestRange = getInterestRange(credito.interes);
            if (interestRange) {
              interestRangeCount[interestRange] =
                (interestRangeCount[interestRange] || 0) + 1;
            }
          }
        });

        const purposeFrequency = Object.entries(purposeAmount).map(
          ([category, totalAmount]) => ({ category, count: totalAmount })
        );
        setCreditPurposeFrequency(purposeFrequency);

        // Convert interest rate distribution to array format
        const interestDistribution = Object.entries(interestRangeCount).map(
          ([range, count]) => ({ range, count })
        );
        setInterestRateDistribution(interestDistribution);
      })
      .catch((error) => {
        console.error("Error fetching creditos:", error);
        setLoading(false);
        // Fallback to mock data if API fails
        const mockStats = monthlyData.map((month) => ({
          month: month.month,
          accepted: month.approved,
          rejected: month.rejected,
        }));
        setAcceptedVsRejected(mockStats);
      });
  }, []);

  // Function to process credit data into monthly statistics
  const processMonthlyData = (creditos: Credito[]) => {
    const monthNames = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const monthlyData: {
      [key: string]: { accepted: number; rejected: number };
    } = {};

    // Initialize last 6 months
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthKey = monthNames[date.getMonth()];
      monthlyData[monthKey] = { accepted: 0, rejected: 0 };
    }

    // Process each credit
    creditos.forEach((credito) => {
      const creditDate = new Date(credito.fecha_inicio);
      const monthKey = monthNames[creditDate.getMonth()];

      if (monthlyData[monthKey]) {
        if (credito.estado === "ACEPTADO") {
          monthlyData[monthKey].accepted++;
        } else if (credito.estado === "NEGADO") {
          monthlyData[monthKey].rejected++;
        }
      }
    });

    // Convert to array format for chart
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      accepted: data.accepted,
      rejected: data.rejected,
    }));
  };

  useEffect(() => {
    if (admin === null) {
      navigate("/admin");
    }
  }, [admin, navigate]);

  if (!admin) {
    return null;
  }

  // TODO: Add these calculations back when connecting to API
  const creditosVerdes = creditos.filter((c) => c.estado === "ACEPTADO").length;
  const pendientesAprobar = creditos.filter(
    (c) => c.estado === "PENDIENTE"
  ).length;
  // const porcentajeAlDia = calcularPorcentajeAlDia(creditos);
  // const interesGanado = calcularInteresGanado(creditos);
  // const ahorroTotalEsperado = ahorrosPorCredito.reduce((sum, a) => sum + a.ahorroTotal10Anos, 0);
  // const interestChartData = creditos.filter((c) => c.estado === "ACEPTADO").map((c) => ({
  //   nombre: `${c.descripcion.substring(0, 15)}...`,
  //   interes: Math.round((c.prestamo * (c.interes / 100) * c.pagado) / (c.prestamo * (1 + c.interes / 100))),
  // })).slice(0, 10);
  // const savingsChartData = ahorrosPorCredito.map((a) => ({
  //   nombre: `${a.descripcion.substring(0, 15)}...`,
  //   ahorro: Math.round(a.ahorroTotal10Anos),
  // }));

  return (
    <div className="min-h-screen bg-background">
      <AdminTopBar />

      <main className="container mx-auto px-4 py-8 max-w-[1200px]">
        {/* Title section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Análisis y Reportes
            </h1>
            <p className="text-muted-foreground">
              Visualización detallada del portafolio de créditos
            </p>
          </div>
          <BanorteButton variant="secondary" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Reporte
          </BanorteButton>
        </div>

        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="trends">
              <TrendingUp className="mr-2 h-4 w-4" />
              Tendencias
            </TabsTrigger>
            <TabsTrigger value="distribution">
              <LucidePieChart className="mr-2 h-4 w-4" />
              Distribución
            </TabsTrigger>
            <TabsTrigger value="performance">
              <BarChart3 className="mr-2 h-4 w-4" />
              Rendimiento
            </TabsTrigger>
          </TabsList>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Desembolsos Mensuales</CardTitle>
                <CardDescription>
                  Evolución de créditos aprobados en los últimos 6 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#586670" />
                    <YAxis stroke="#586670" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: "4px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="disbursed"
                      stroke="#EB0029"
                      strokeWidth={2}
                      name="Monto Desembolsado"
                      dot={{ fill: "#EB0029" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aprobaciones vs Rechazos</CardTitle>
                <CardDescription>
                  Comparación mensual de decisiones de crédito
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={acceptedVsRejected}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#586670" />
                    <YAxis stroke="#586670" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: "4px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="accepted" fill="#6CC04A" name="Aprobados" />
                    <Bar dataKey="rejected" fill="#EB0029" name="Negados" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Distribution Tab */}
          <TabsContent value="distribution" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Propósito</CardTitle>
                  <CardDescription>
                    Categorías de créditos más solicitadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={creditPurposeFrequency}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }: any) =>
                          `${category} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {creditPurposeFrequency.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [
                          `$${value.toLocaleString("es-MX")}`,
                          "Monto Total",
                        ]}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {creditPurposeFrequency.map((item, index) => (
                      <div
                        key={item.category}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-sm"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          <span>{item.category}</span>
                        </div>
                        <span className="font-semibold">
                          ${(item.count / 1000).toFixed(1)}K
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Tasas de Interés</CardTitle>
                  <CardDescription>Rangos de tasas aplicadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={
                        interestRateDistribution.length > 0
                          ? interestRateDistribution
                          : rateData
                      }
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" stroke="#586670" />
                      <YAxis dataKey="range" type="category" stroke="#586670" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #E5E7EB",
                          borderRadius: "4px",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#EB0029"
                        name="Cantidad de Créditos"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tasa de Conversión</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-[#6CC04A] mb-2">
                    {mockAdminStats.approvalRate}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    De solicitudes aprobadas
                  </p>
                  <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6CC04A]"
                      style={{ width: `${mockAdminStats.approvalRate}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tiempo Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground mb-2">
                    1.2
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Días para aprobación
                  </p>
                  <p className="text-xs text-[#6CC04A] mt-2">
                    ↓ 15% vs mes anterior
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Satisfacción</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-foreground mb-2">
                    4.8
                  </div>
                  <p className="text-sm text-muted-foreground">
                    De 5.0 estrellas
                  </p>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div key={star} className="text-[#FFA400]">
                        ★
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Riesgo</CardTitle>
                <CardDescription>
                  Indicadores clave de salud del portafolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Tasa de Morosidad
                      </span>
                      <span className="text-sm font-bold text-[#6CC04A]">
                        {mockAdminStats.defaultRate}%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6CC04A]"
                        style={{ width: `${mockAdminStats.defaultRate * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Objetivo: {"<"}5%
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Cobertura de Provisiones
                      </span>
                      <span className="text-sm font-bold text-[#6CC04A]">
                        98.5%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6CC04A]"
                        style={{ width: "98.5%" }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Objetivo: {">"}95%
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Ratio de Capital
                      </span>
                      <span className="text-sm font-bold text-[#6CC04A]">
                        15.2%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6CC04A]"
                        style={{ width: "76%" }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mínimo regulatorio: 10.5%
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Diversificación
                      </span>
                      <span className="text-sm font-bold text-[#6CC04A]">
                        Alta
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6CC04A]"
                        style={{ width: "85%" }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Índice Herfindahl: 0.18
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <div className="h-16" />
      </main>
    </div>
  );
}
