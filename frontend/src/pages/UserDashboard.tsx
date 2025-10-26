"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { UserTopBar } from "../components/UserTopBar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import TransactionList from "@/components/TransactionList";
import PreapprovedCreditCard from "@/components/PreapprovedCreditCard";
import { api } from "@/lib/api";

interface ProductData {
  nombre: string;
  link: string;
  img_link: string;
  precio: number;
  categoria: string;
}

interface CreditOffer {
  prestamo: number;
  interes: number;
  meses_originales: number;
  descripcion: string;
  gasto_inicial_mes: number;
  gasto_final_mes: number;
  product: ProductData;
}

interface PreapprovedCreditsResponse {
  creditOffers: CreditOffer[];
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [preapprovedCredits, setPreapprovedCredits] = useState<CreditOffer[]>(
    []
  );
  const [loadingCredits, setLoadingCredits] = useState(false);

  // Fetch preapproved credits
  useEffect(() => {
    const fetchPreapprovedCredits = async () => {
      if (!user?.id) return;

      setLoadingCredits(true);

      try {
        const response = await api.post<PreapprovedCreditsResponse>(
          `/creditos/preapproved/${user.id}`
        );
        setPreapprovedCredits(response.data.creditOffers || []);
      } catch (error) {
        console.error("Error fetching preapproved credits:", error);
        // Silently fail - user will just not see preapproved credits
      } finally {
        setLoadingCredits(false);
      }
    };

    fetchPreapprovedCredits();
  }, [user?.id]);

  // Transform API credit offer to component format
  const transformCreditOffer = (apiOffer: CreditOffer) => {
    const monthlyPayment =
      (apiOffer.prestamo * (1 + apiOffer.interes / 100)) /
      apiOffer.meses_originales;
    const savings = apiOffer.gasto_inicial_mes - apiOffer.gasto_final_mes;
    const savingsPercentage =
      apiOffer.gasto_inicial_mes > 0
        ? Math.round((savings / apiOffer.gasto_inicial_mes) * 100)
        : 0;

    return {
      title: apiOffer.product?.nombre || apiOffer.descripcion.split(".")[0],
      subtitle: apiOffer.product?.nombre || "Producto",
      description: apiOffer.descripcion.split(".").slice(0, 2).join("."),
      detailedDescription: apiOffer.descripcion,
      maxAmountText: `Hasta $${apiOffer.prestamo.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} MXN`,
      savingsPercentage: savingsPercentage,
      termMonths: apiOffer.meses_originales,
      creditDetails: {
        amount: apiOffer.prestamo,
        interestRate: apiOffer.interes,
        maxTermMonths: apiOffer.meses_originales,
        monthlyPayment: monthlyPayment,
      },
      benefits: [
        "Sin comisión por apertura",
        "Instalación incluida",
        "Garantía 25 años",
      ],
      disclaimerText: `*Ahorro estimado basado en la reducción de ${
        apiOffer.gasto_inicial_mes > 0 ? `$${savings.toFixed(2)}` : "costos"
      } mensuales.`,
    };
  };

  useEffect(() => {
    if (user === null) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <UserTopBar />

      <main className="container mx-auto px-4 py-8 max-w-[1200px]">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Hola, {user.nombre.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Aquí está el resumen de tu cuenta
          </p>
        </div>

        {/* Balance card */}
        <Card className="mb-8 border-none bg-linear-to-br from-[#EB0029] to-[#DB0026] text-white">
          <CardHeader>
            <CardTitle className="text-white/90 text-sm font-medium">
              Saldo disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold mb-2">
                  $
                  {user.saldo.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preapproved credits - Dynamic rendering */}
        {/* {loadingCredits && (
          <Card className="mb-8 bg-linear-to-br from-green-50 to-green-100 border-green-300 shadow-lg">
            <CardContent className="py-8 text-center text-green-700">
              Cargando créditos preaprobados...
            </CardContent>
          </Card>
        )} */}

        {/* {!loadingCredits &&
          !creditsError &&
          preapprovedCredits.length === 0 && (
            <Card className="mb-8 bg-linear-to-br from-gray-50 to-gray-100 border-gray-300 shadow-lg">
              <CardContent className="py-8 text-center text-gray-700">
                No tienes créditos preaprobados en este momento.
              </CardContent>
            </Card>
          )} */}

        {!loadingCredits && preapprovedCredits.length > 0 && (
          <PreapprovedCreditCard
            offer={transformCreditOffer(preapprovedCredits[0])}
            showDetailsInModal={false}
            className="mb-8"
            onApply={() => {
              const productLink = preapprovedCredits[0].product?.link;
              if (productLink) {
                window.open(productLink, "_blank");
              }
            }}
          />
        )}

        <TransactionList />
      </main>
    </div>
  );
}
