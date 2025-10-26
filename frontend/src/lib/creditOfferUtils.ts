import { api } from "./api";

export interface ProductData {
  nombre: string;
  link: string;
  img_link: string;
  precio: number;
  categoria: string;
}

export interface CreditOffer {
  prestamo: number;
  interes: number;
  meses_originales: number;
  descripcion: string;
  gasto_inicial_mes: number;
  gasto_final_mes: number;
  product: ProductData;
}

export interface PreapprovedCreditsResponse {
  creditOffers: CreditOffer[];
}

export interface TransformedCreditOffer {
  title: string;
  subtitle: string;
  description: string;
  detailedDescription: string;
  maxAmountText: string;
  savingsPercentage: number;
  termMonths: number;
  creditDetails: {
    amount: number;
    interestRate: number;
    maxTermMonths: number;
    monthlyPayment: number;
  };
  benefits: string[];
  disclaimerText: string;
}

/**
 * Fetches preapproved credits for a given client
 */
export async function fetchPreapprovedCredits(
  clientId: number
): Promise<CreditOffer[]> {
  try {
    return [];
    const response = await api.post<PreapprovedCreditsResponse>(
      `/creditos/preapproved/${clientId}`
    );
    return response.data.creditOffers || [];
  } catch (error) {
    console.error("Error fetching preapproved credits:", error);
    return [];
  }
}

/**
 * Transforms API credit offer to component format
 */
export function transformCreditOffer(
  apiOffer: CreditOffer
): TransformedCreditOffer {
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
}
