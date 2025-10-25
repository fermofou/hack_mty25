import React from "react";

import { Button } from "./Button";
import { X } from "lucide-react";

interface CreditOfferModalProps {
  offer: any;
  onClose: () => void;
  onRequestCredit?: () => void;
}


export const CreditOfferModal: React.FC<CreditOfferModalProps> = ({ offer, onClose, onRequestCredit }) => {
  if (!offer) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred overlay */}
      <div
        className="absolute inset-0 bg-white/40 backdrop-blur-sm transition-all duration-200 cursor-pointer"
        onClick={onClose}
        aria-label="Cerrar fondo"
      />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-0 relative pointer-events-auto border-2 border-gray-200 z-10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-2">
          <h2 className="text-2xl font-bold text-foreground">Oferta de Crédito</h2>
          <button
            className="cursor-pointer text-gray-500 hover:text-gray-700 rounded-full p-1.5 transition-colors border border-transparent hover:border-gray-300"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>
        <div className="border-b border-gray-200 mx-8 mb-4" />
        {/* Main content */}
        <div className="px-8 pb-8 flex flex-col gap-4">
          <div className="flex flex-row gap-6 items-center mb-2">
            <img src={offer.product.img_link} alt={offer.product.nombre} className="h-24 w-24 object-contain rounded-lg bg-white" />
            <div className="flex-1">
              <h3 className="font-bold text-xl text-foreground mb-1">{offer.product.nombre}</h3>
              <p className="text-base text-muted-foreground mb-2">{offer.descripcion}</p>
              <a href={offer.product.link} target="_blank" rel="noopener noreferrer" className="text-primary underline font-semibold">Ver producto</a>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
              <div className="text-xl font-bold text-foreground">${offer.prestamo}</div>
              <div className="text-xs text-muted-foreground font-medium">Monto</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
              <div className="text-xl font-bold text-foreground">{offer.interes}%</div>
              <div className="text-xs text-muted-foreground font-medium">Interés</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
              <div className="text-xl font-bold text-foreground">{offer.meses_originales}</div>
              <div className="text-xs text-muted-foreground font-medium">Meses</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
              <div className="text-xl font-bold text-foreground">${offer.gasto_inicial_mes}</div>
              <div className="text-xs text-muted-foreground font-medium">Pago mensual inicial</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm col-span-2 md:col-span-4">
              <div className="text-xl font-bold text-foreground">${offer.gasto_final_mes}</div>
              <div className="text-xs text-muted-foreground font-medium">Pago mensual final</div>
            </div>
          </div>
          {/* Benefits section (optional, can be extended) */}
          {offer.beneficios && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-2">
              <div className="font-semibold mb-2 text-foreground">Beneficios incluidos:</div>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {offer.beneficios.map((b: string, i: number) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Action buttons */}
          <div className="flex flex-row gap-4 mt-4">
            <Button
              variant="primary"
              className="flex-1 text-base py-3"
              onClick={() => onRequestCredit && onRequestCredit()}
            >
              Pedir crédito
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
