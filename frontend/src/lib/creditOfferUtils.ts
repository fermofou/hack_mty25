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

export interface PreapprovedContextResponse {
  conversation_context: string;
  num_offers_to_generate: number;
}

export interface GenerateCreditOffersRequest {
  conversation_context: string;
  num_offers_to_generate: number;
}

export interface SaveCreditOffersRequest {
  cliente_id: number;
  credit_offers: PreapprovedCreditsResponse;
}

export interface SaveCreditOffersResponse {
  message: string;
  created_credit_ids: number[];
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
 * Step 1: Gets the context needed for generating preapproved credits
 */
export async function getPreapprovedContext(
  clientId: number
): Promise<PreapprovedContextResponse | null> {
  try {
    const response = await api.post<PreapprovedContextResponse>(
      `/creditos/preapproved/${clientId}/context`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting preapproved context:", error);
    return null;
  }
}

/**
 * Step 2: Generates credit offers using AI
 */
export async function generateCreditOffers(
  request: GenerateCreditOffersRequest
): Promise<PreapprovedCreditsResponse | null> {
  try {
    const response = await api.post<PreapprovedCreditsResponse>(
      `/creditos/preapproved/generate`,
      request
    );
    return response.data;
  } catch (error) {
    console.error("Error generating credit offers:", error);
    return null;
  }
}

/**
 * Step 3: Saves the generated credit offers to the database
 */
export async function savePreapprovedCredits(
  request: SaveCreditOffersRequest
): Promise<SaveCreditOffersResponse | null> {
  try {
    const response = await api.post<SaveCreditOffersResponse>(
      `/creditos/preapproved/save`,
      request
    );
    return response.data;
  } catch (error) {
    console.error("Error saving preapproved credits:", error);
    return null;
  }
}

/**
 * Complete flow: Creates preapproved credits for a given client
 * This orchestrates all three steps: context -> generate -> save
 */
export async function createPreapprovedCredits(
  clientId: number
): Promise<SaveCreditOffersResponse | null> {
  try {
    // Step 1: Get context
    const context = await getPreapprovedContext(clientId);
    if (context?.num_offers_to_generate === 0) {
      return null;
    }
    if (!context) {
      throw new Error("Failed to get preapproved context");
    }

    // Step 2: Generate credit offers using AI
    const creditOffers = await generateCreditOffers({
      conversation_context: context.conversation_context,
      num_offers_to_generate: context.num_offers_to_generate,
    });
    if (!creditOffers) {
      throw new Error("Failed to generate credit offers");
    }

    // Step 3: Save to database
    const saveResult = await savePreapprovedCredits({
      cliente_id: clientId,
      credit_offers: creditOffers,
    });
    if (!saveResult) {
      throw new Error("Failed to save credit offers");
    }

    return saveResult;
  } catch (error) {
    console.error("Error creating preapproved credits:", error);
    return null;
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
