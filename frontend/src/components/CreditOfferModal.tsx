import React from "react";
import { Card, CardContent } from "@/components/ui/card";

import { Button } from "./Button";

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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-10 relative pointer-events-auto border-2 border-gray-200 z-10">
        <button
          className="absolute top-4 right-4 text-gray-700 hover:text-gray-900 text-3xl font-bold"
          onClick={onClose}
          aria-label="Cerrar"
        >
          &times;
        </button>
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="flex flex-col items-center p-0">
            <img src={offer.product.img_link} alt={offer.product.nombre} className="h-32 w-32 object-contain rounded-lg bg-white mb-4" />
            <h3 className="font-bold text-2xl text-gray-900 text-center mb-2">{offer.product.nombre}</h3>
            <p className="text-base text-center mb-4 text-gray-700">{offer.descripcion}</p>
            <div className="grid grid-cols-2 gap-4 w-full mb-4">
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
                <div className="text-xl font-bold text-gray-900">${offer.prestamo}</div>
                <div className="text-xs text-gray-500 font-medium">Monto</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
                <div className="text-xl font-bold text-gray-900">{offer.interes}%</div>
                <div className="text-xs text-gray-500 font-medium">Interés</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
                <div className="text-xl font-bold text-gray-900">{offer.meses_originales}</div>
                <div className="text-xs text-gray-500 font-medium">Meses</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
                <div className="text-xl font-bold text-gray-900">${offer.gasto_inicial_mes}</div>
                <div className="text-xs text-gray-500 font-medium">Pago inicial</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm col-span-2">
                <div className="text-xl font-bold text-gray-900">${offer.gasto_final_mes}</div>
                <div className="text-xs text-gray-500 font-medium">Pago final</div>
              </div>
            </div>
            <a href={offer.product.link} target="_blank" rel="noopener noreferrer" className="text-gray-700 underline mt-2 font-semibold">Ver producto</a>
            <Button
              variant="primary"
              className="w-full mt-6 text-base py-3"
              onClick={() => onRequestCredit && onRequestCredit()}
            >
              Pedir crédito
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
