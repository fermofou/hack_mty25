import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface CreditOfferModalProps {
  offer: any;
  onClose: () => void;
}

export const CreditOfferModal: React.FC<CreditOfferModalProps> = ({ offer, onClose }) => {
  if (!offer) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-10 relative pointer-events-auto">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl"
          onClick={onClose}
          aria-label="Cerrar"
        >
          &times;
        </button>
        <Card className="border-none shadow-none">
          <CardContent className="flex flex-col items-center p-0">
            <img src={offer.product.img_link} alt={offer.product.nombre} className="h-40 object-contain mb-4" />
            <h3 className="font-bold text-2xl text-center mb-2">{offer.product.nombre}</h3>
            <p className="text-base text-center mb-4">{offer.descripcion}</p>
            <div className="text-base mb-2">Monto: <span className="font-semibold">${offer.prestamo}</span></div>
            <div className="text-base mb-2">Interés: <span className="font-semibold">{offer.interes}%</span></div>
            <div className="text-base mb-2">Plazo: <span className="font-semibold">{offer.meses_originales} meses</span></div>
            <div className="text-base mb-2">Pago inicial: <span className="font-semibold">${offer.gasto_inicial_mes}</span></div>
            <div className="text-base mb-2">Pago final: <span className="font-semibold">${offer.gasto_final_mes}</span></div>
            <a href={offer.product.link} target="_blank" rel="noopener noreferrer" className="text-[#EB0029] underline mt-4">Ver producto</a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
