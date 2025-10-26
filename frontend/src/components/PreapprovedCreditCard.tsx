import { useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Modal } from "./ui/modal";
import { BatteryCharging, LeafIcon, X } from "lucide-react";
import { Button } from "./Button";

export interface CreditDetails {
  amount: number;
  interestRate: number;
  maxTermMonths: number;
  monthlyPayment: number;
}

export interface CreditOffer {
  title: string;
  subtitle: string;
  description: string;
  detailedDescription: string;
  maxAmountText: string;
  savingsPercentage: number;
  termMonths: number;
  creditDetails: CreditDetails;
  benefits: string[];
  disclaimerText: string;
}

export interface PreapprovedCreditCardProps {
  offer?: CreditOffer;
  onApply?: () => void;
  onDismiss?: () => void;
  className?: string;
  showDetailsInModal?: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const defaultOffer: CreditOffer = {
  title: "Crédito Verde Preaprobado",
  subtitle: "Panel Solar Residencial",
  description:
    "Instala paneles solares en tu hogar y reduce tu factura de luz hasta un",
  detailedDescription:
    "Con un crédito verde puedes instalar paneles solares sin afectar tu presupuesto. Pagarías una mensualidad similar a la que ya destinas a la luz, mientras reduces el consumo de la red y mejoras la eficiencia energética de tu hogar.",
  maxAmountText: "Hasta $100,000 disponibles",
  savingsPercentage: 90,
  termMonths: 60,
  creditDetails: {
    amount: 100000,
    interestRate: 8.9,
    maxTermMonths: 60,
    monthlyPayment: 2140,
  },
  benefits: [
    "Sin comisión por apertura",
    "Instalación incluida",
    "Garantía 25 años",
  ],
  disclaimerText:
    "*Cálculo estimado para $100,000 a 60 meses. Sujeto a aprobación crediticia.",
};

export default function PreapprovedCreditCard({
  offer = defaultOffer,
  onApply,
  onDismiss,
  className = "",
  showDetailsInModal = false,
}: PreapprovedCreditCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleShowDetails = () => {
    if (showDetailsInModal) {
      setIsModalOpen(true);
    } else {
      setIsExpanded(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="relative">
      <Card
        className={`bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg overflow-hidden h-full w-full flex flex-col ${className}`}
      >
        <CardHeader className="text-green-600 font-bold pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 rounded-full p-2">
                <LeafIcon className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-700">
                  {offer.title}
                </h3>
                <p className="text-sm text-green-500 font-normal">
                  {offer.subtitle}
                </p>
              </div>
            </div>
            {onDismiss && (
              <button
                className="cursor-pointer text-green-500 hover:text-green-700 transition-colors"
                onClick={onDismiss}
              >
                <X size={20} />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col justify-between p-4">
          {/* Main offer section - Always visible */}
          <div className="bg-white rounded-lg p-3 lg:p-4 border border-green-100 flex-1 flex flex-col justify-center">
            <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-3 lg:gap-4">
              <div className="flex items-start gap-3">
                <BatteryCharging className="text-green-600 w-8 h-8 lg:w-10 lg:h-10 flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs lg:text-sm text-gray-700 leading-relaxed">
                    {offer.description}
                  </p>
                  <p className="text-sm lg:text-base font-bold text-green-600 mt-1">
                    {offer.maxAmountText}
                  </p>
                </div>
              </div>
              {!isExpanded && !showDetailsInModal && (
                <Button
                  variant="secondary"
                  className="border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 hover:text-green-600 w-full xl:w-auto text-xs lg:text-sm px-3 lg:px-4 py-2"
                  onClick={() => setIsExpanded(true)}
                >
                  Más información
                </Button>
              )}
              {showDetailsInModal && (
                <Button
                  variant="secondary"
                  className="border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 hover:text-green-600 w-full xl:w-auto text-xs lg:text-sm px-3 lg:px-4 py-2"
                  onClick={handleShowDetails}
                >
                  Ver
                </Button>
              )}
            </div>
          </div>

          {/* Expandable content with animation - only show when not using modal */}
          {!showDetailsInModal && (
            <div
              className={`transition-all duration-500 ease-in-out ${
                isExpanded
                  ? "max-h-96 opacity-100"
                  : "max-h-0 opacity-0 overflow-hidden"
              }`}
            >
              <div className="space-y-3 lg:space-y-4 pt-2">
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm lg:text-base text-gray-700 leading-relaxed">
                        {offer.detailedDescription}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Credit details grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
                  <div className="bg-white rounded-lg p-2 lg:p-3 text-center border border-green-100 transform transition-transform duration-300 hover:scale-105">
                    <div className="text-lg lg:text-2xl font-bold text-green-600">
                      ${offer.creditDetails.amount.toLocaleString("es-MX")}
                    </div>
                    <div className="text-xs text-green-500 font-medium">
                      Monto disponible
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 lg:p-3 text-center border border-green-100 transform transition-transform duration-300 hover:scale-105">
                    <div className="text-lg lg:text-2xl font-bold text-green-600">
                      {offer.creditDetails.interestRate}%
                    </div>
                    <div className="text-xs text-green-500 font-medium">
                      Tasa anual
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 lg:p-3 text-center border border-green-100 transform transition-transform duration-300 hover:scale-105">
                    <div className="text-lg lg:text-2xl font-bold text-green-600">
                      {offer.creditDetails.maxTermMonths}
                    </div>
                    <div className="text-xs text-green-500 font-medium">
                      Meses máx.
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 lg:p-3 text-center border border-green-100 transform transition-transform duration-300 hover:scale-105">
                    <div className="text-lg lg:text-2xl font-bold text-green-600">
                      $
                      {offer.creditDetails.monthlyPayment.toLocaleString(
                        "es-MX"
                      )}
                    </div>
                    <div className="text-xs text-green-500 font-medium">
                      Pago mensual est.*
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className="bg-gray-50 rounded-lg p-3 border border-green-100 transform transition-all duration-300">
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-green-600">
                    {offer.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <span>✓</span>
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expanded action buttons */}
                <div className="flex flex-col lg:flex-row gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={onApply}
                  >
                    Solicitar ahora
                  </Button>
                  <Button
                    variant="secondary"
                    className="border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 hover:text-green-600"
                    onClick={() => setIsExpanded(false)}
                  >
                    Mostrar menos
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  {offer.disclaimerText}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal for details - rendered outside Card to prevent layout interference */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={offer.title}
        size="xl"
      >
        <div className="p-6 space-y-6">
          {/* Header with icon and subtitle */}
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-500 rounded-full p-3">
              <LeafIcon className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                {offer.subtitle}
              </h3>
              <p className="text-gray-600">
                {offer.description}{" "}
                <span className="font-semibold text-emerald-600">
                  {offer.savingsPercentage}%
                </span>{" "}
                en {offer.termMonths} meses
              </p>
            </div>
          </div>

          {/* Detailed description */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-700 leading-relaxed">
              {offer.detailedDescription}
            </p>
            <p className="text-lg font-bold text-emerald-600 mt-3">
              {offer.maxAmountText}
            </p>
          </div>

          {/* Credit details grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-gray-700">
                ${offer.creditDetails.amount.toLocaleString("es-MX")}
              </div>
              <div className="text-sm text-gray-500 font-medium">
                Monto disponible
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-gray-700">
                {offer.creditDetails.interestRate}%
              </div>
              <div className="text-sm text-gray-500 font-medium">
                Tasa anual
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-gray-700">
                {offer.creditDetails.maxTermMonths}
              </div>
              <div className="text-sm text-gray-500 font-medium">
                Meses máx.
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-gray-700">
                ${offer.creditDetails.monthlyPayment.toLocaleString("es-MX")}
              </div>
              <div className="text-sm text-gray-500 font-medium">
                Pago mensual est.*
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              Beneficios incluidos:
            </h4>
            <div className="grid gap-2 text-gray-700">
              {offer.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-lg py-3"
              onClick={() => {
                handleCloseModal();
                if (onApply) onApply();
              }}
            >
              Solicitar ahora
            </Button>
            <Button
              variant="secondary"
              className="border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400"
              onClick={handleCloseModal}
            >
              Cerrar
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            {offer.disclaimerText}
          </p>
        </div>
      </Modal>
    </div>
  );
}
