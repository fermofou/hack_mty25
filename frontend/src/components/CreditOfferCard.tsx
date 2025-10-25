import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "./Button";

interface CreditOfferCardProps {
  offer: any;
  onClick: () => void;
  onRequestCredit?: () => void;
}

export const CreditOfferCard: React.FC<CreditOfferCardProps> = ({ offer, onClick, onRequestCredit }) => {
  return (
    <Card
      className="w-80 bg-white border-gray-200 shadow-lg overflow-hidden flex flex-col cursor-pointer hover:shadow-xl transition-all duration-200"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center p-6 gap-2">
        <img src={offer.product.img_link} alt={offer.product.nombre} className="h-24 w-24 object-contain rounded-lg bg-white mb-2" />
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-1">{offer.product.nombre}</h3>
        <div className="text-sm text-gray-700 mb-1">Monto: <span className="font-bold text-gray-900">${offer.prestamo}</span></div>
        <div className="text-sm text-gray-700 mb-1">Interés: <span className="font-bold text-gray-900">{offer.interes}%</span></div>
        <div className="flex gap-2 w-full mt-2">
          <Button
            variant="secondary"
            className="border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-700 hover:text-gray-900 flex-1 text-xs px-3 py-2"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
          >
            Ver detalles
          </Button>
          <Button
            variant="primary"
            className="flex-1 text-xs px-3 py-2"
            onClick={(e) => { e.stopPropagation(); onRequestCredit && onRequestCredit(); }}
          >
            Pedir crédito
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
