"use client";

import { useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { UserTopBar } from "@/components/UserTopBar";
import { Button } from "@/components/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PreapprovedCreditCard from "@/components/PreapprovedCreditCard";
import { SavingsChart } from "../components/SavingsChart";
import { mockSustainabilitySavings } from "@/lib/mock-data";
import { Leaf, Clock, DollarSign, TrendingUp, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  type CreditOffer as ApiCreditOffer,
  fetchPreapprovedCredits,
  transformCreditOffer,
} from "@/lib/creditOfferUtils";

export interface MonthlyStats {
  average_monthly_expenses: Record<
    string,
    {
      monthly_expenses: Array<{
        month: string;
        amount: number;
      }>;
      average: number;
      total: number;
    }
  >;
  current_monthly_savings: {
    money: number;
    co2: number;
    liters: number;
  };
}

export interface Credit {
  id_cred: number;
  prestamo: number;
  interes: number;
  meses_originales: number;
  categoria: string;
  descripcion: string;
  gasto_inicial_mes: number;
  gasto_final_mes: number;
  estado: string;
  fecha_inicio: string;
  pagado: number;
  restante: number;
  oferta: boolean;
}

export default function CreditsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | undefined>();
  const [userCredits, setUserCredits] = useState<Credit[] | undefined>();
  const [preapprovedCredits, setPreapprovedCredits] = useState<
    ApiCreditOffer[] | undefined
  >();

  useEffect(() => {
    const fetchMontlyStats = async () => {
      if (!user) return;
      try {
        const { data } = await api.get(`/clientes/${user.id}/monthly_stats`);
        console.log(data);
        setMonthlyStats(data);
      } catch (err: unknown) {
        console.log(err);
      }
    };

    const fetchUserCredits = async () => {
      if (!user) return;
      try {
        const { data } = await api.get(`/clientes/${user.id}/creditos`);
        console.log("credits", data);
        setUserCredits(
          data
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((res: any) => res.credito)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((credit: any) => !credit.oferta)
        );
      } catch (err: unknown) {
        console.log(err);
      }
    };

    const loadPreapprovedCredits = async () => {
      if (!user?.id) return;
      const credits = await fetchPreapprovedCredits(user.id);
      setPreapprovedCredits(credits);
      console.log("preapproved credits", credits);
    };

    fetchMontlyStats();
    fetchUserCredits();
    loadPreapprovedCredits();
  }, [user]);

  if (!user) {
    return null;
  }

  const approvedCredits = userCredits?.filter((c) => c.estado === "ACEPTADO");
  let pendingCredits = userCredits?.filter(
    (c) => c.estado === "PENDIENTE" || c.estado === "APROBADO"
  );
  pendingCredits = pendingCredits?.sort((a, b) => {
    return a.estado < b.estado ? -1 : 1;
  });

  return (
    <div className="min-h-screen bg-background">
      <UserTopBar />

      <main className="container mx-auto px-4 py-8 max-w-[1200px]">
        {/* Title section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Créditos <span className="text-[#EB0029]">Verdes</span>
            </h1>
            <p className="text-muted-foreground">
              Gestiona y revisa tus créditos sustentables
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate("/user/credits/apply")}
          >
            Solicitar crédito
          </Button>
        </div>

        {/* 2-Column Layout */}
        <div className="grid gap-8 xl:grid-cols-2">
          {/* Left Column: Offers and Credits */}
          <div className="space-y-8">
            {/* Preapproved Credit Cards */}
            {preapprovedCredits !== undefined &&
              preapprovedCredits.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    Tus ofertas
                  </h2>
                  {preapprovedCredits.length > 0 ? (
                    <div className="space-y-6">
                      {preapprovedCredits.map((credit, index) => (
                        <PreapprovedCreditCard
                          key={index}
                          offer={transformCreditOffer(credit)}
                          showDetailsInModal={true}
                          onApply={() => {
                            const productLink = credit.product?.link;
                            if (productLink) {
                              window.open(productLink, "_blank");
                            }
                          }}
                          onDismiss={() =>
                            console.log(`Dismissed offer ${index + 1}`)
                          }
                          className="w-full"
                        />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground mb-4">
                          No tienes ofertas preaprobadas en este momento
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

            {/* Pending credits */}
            {pendingCredits && pendingCredits.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Solicitudes pendientes
                </h2>
                <div className="space-y-4">
                  {pendingCredits.map((credit) => (
                    <Card
                      key={credit.id_cred}
                      className="cursor-pointer transition-shadow hover:shadow-lg"
                      onClick={() =>
                        navigate(`/user/credits/details/${credit.id_cred}`)
                      }
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">
                              ${credit.prestamo.toLocaleString("es-MX")}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {credit.descripcion}
                            </p>
                          </div>
                          {credit.estado === "PENDIENTE" && (
                            <Badge className="bg-[#FFA500] text-white">
                              Pendiente
                            </Badge>
                          )}
                          {credit.estado === "APROBADO" && (
                            <Badge className="bg-blue-500 text-white">
                              Aprobado
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-6 text-sm">
                          <div>
                            <p className="text-muted-foreground">Solicitado</p>
                            <p className="font-medium">
                              {new Date(credit.fecha_inicio).toLocaleDateString(
                                "es-MX"
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Plazo</p>
                            <p className="font-medium">
                              {credit.meses_originales} meses
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Tasa</p>
                            <p className="font-medium">{credit.interes}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Active/Approved credits */}
            {approvedCredits && approvedCredits.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Créditos activos</h2>
                <div className="space-y-4">
                  {approvedCredits.map((credit) => {
                    const calculateRemainingMonths = () => {
                      const startDate = new Date(credit.fecha_inicio);
                      const currentDate = new Date();
                      const monthsElapsed =
                        (currentDate.getFullYear() - startDate.getFullYear()) *
                          12 +
                        (currentDate.getMonth() - startDate.getMonth());
                      const monthsLeft = Math.max(
                        0,
                        credit.meses_originales - monthsElapsed
                      );
                      return monthsLeft;
                    };
                    const remainingMonths = calculateRemainingMonths();
                    return (
                      <Card
                        key={credit.id_cred}
                        className="cursor-pointer transition-shadow hover:shadow-lg"
                        onClick={() =>
                          navigate(`/user/credits/details/${credit.id_cred}`)
                        }
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-xl">
                                ${credit.prestamo.toLocaleString("es-MX")}
                              </CardTitle>
                            </div>
                            <Badge className="bg-green-600 text-white">
                              Activo
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {credit.descripcion}
                          </p>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Saldo:
                              </span>
                              <span className="font-semibold">
                                ${credit.restante.toLocaleString("es-MX")}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Tiempo restante:
                              </span>
                              <span className="font-semibold">
                                {remainingMonths} meses
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Pago mensual:
                              </span>
                              <span className="font-semibold">
                                $
                                {credit.gasto_inicial_mes.toLocaleString(
                                  "es-MX",
                                  {
                                    minimumFractionDigits: 2,
                                  }
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Progreso</span>
                              <span>
                                {Math.round(
                                  ((credit.meses_originales - remainingMonths) /
                                    credit.meses_originales) *
                                    100
                                )}
                                %
                              </span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#EB0029]"
                                style={{
                                  width: `${
                                    ((credit.meses_originales -
                                      remainingMonths) /
                                      credit.meses_originales) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state for no active credits */}
            {approvedCredits && approvedCredits.length === 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Créditos activos</h2>
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No tienes créditos activos
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => navigate("/user/credits/apply")}
                    >
                      Solicitar tu primer crédito
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Loading state */}
            {userCredits === undefined && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-b-transparent border-[#EB0029]"></div>
              </div>
            )}
          </div>

          {/* Right Column: Impact and Graph */}
          <div className="xl:sticky xl:top-8 xl:h-fit xl:max-h-[calc(100vh-4rem)] xl:overflow-y-auto space-y-8">
            {mockSustainabilitySavings.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-[#EB0029]" />
                  Impacto en sostenibilidad
                </h2>

                {/* Savings Chart - Moved to top */}
                <div className="w-full">
                  <SavingsChart
                    rawData={monthlyStats?.average_monthly_expenses ?? {}}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm p-4"
                  />
                </div>

                {/* Impact metrics - Now below chart */}
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-1">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Ahorro mensual estimado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-[#EB0029]">
                        $
                        {(
                          monthlyStats?.current_monthly_savings?.money ?? 0
                        ).toLocaleString("es-MX")}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        $
                        {(
                          (monthlyStats?.current_monthly_savings?.money ?? 0) *
                          12
                        ).toLocaleString("es-MX")}{" "}
                        al año
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Reducción de CO₂
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-[#EB0029]">
                        {(
                          monthlyStats?.current_monthly_savings?.co2 ?? 0 / 1000
                        ).toFixed(1)}{" "}
                        ton
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Por mes
                      </p>
                    </CardContent>
                  </Card>

                  {/* New Water Savings Card */}
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Agua ahorrada
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-[#EB0029]">
                        {monthlyStats?.current_monthly_savings?.liters ?? 0} L
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Por mes
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
