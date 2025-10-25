import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface CreditOfferCardProps {
  offer: any;
  onClick: () => void;
}

export const CreditOfferCard: React.FC<CreditOfferCardProps> = ({ offer, onClick }) => {
  return (
    <Card className="w-80 border-2 border-[#EB0029] cursor-pointer hover:shadow-lg transition" onClick={onClick}>
      <CardContent className="flex flex-col items-center p-4">
        <img src={offer.product.img_link} alt={offer.product.nombre} className="h-32 object-contain mb-2" />
        <h3 className="font-bold text-lg text-center mb-1">{offer.product.nombre}</h3>
        <div className="text-sm mb-1">Monto: <span className="font-semibold">${offer.prestamo}</span></div>
        <div className="text-sm mb-1">Interés: <span className="font-semibold">{offer.interes}%</span></div>
      </CardContent>
    </Card>
  );
};
