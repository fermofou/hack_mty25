"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { AdminTopBar } from "../components/AdminTopBar";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BanorteButton } from "@/components/ui/BanorteButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Check,
  X,
  Eye,
  DollarSign,
  Percent,
  Clock,
  User,
  Download,
} from "lucide-react";
import { api } from "@/lib/api";
import type { CreditoConNombreCliente } from "@/lib/types";

// Function to convert SVG to base64 for embedding
const getSvgAsBase64 = async (svgPath: string): Promise<string> => {
  try {
    const response = await fetch(svgPath);
    const svgText = await response.text();
    return `data:image/svg+xml;base64,${btoa(svgText)}`;
  } catch (error) {
    console.error("Error loading SVG:", error);
    return "";
  }
};

export default function AdminCredits() {
  const navigate = useNavigate();
  const { admin } = useAuth();
  const [creditos, setCreditos] = useState<CreditoConNombreCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredit, setSelectedCredit] =
    useState<CreditoConNombreCliente | null>(null);
  const [showContract, setShowContract] = useState(false);
  const [banorteLogo, setBanorteLogo] = useState<string>("");

  useEffect(() => {
    // Load Banorte logo when component mounts
    const loadLogo = async () => {
      try {
        const logoBase64 = await getSvgAsBase64("/images/banorte.svg");
        setBanorteLogo(logoBase64);
      } catch (error) {
        console.error("Failed to load Banorte logo:", error);
      }
    };
    loadLogo();
  }, []);

  useEffect(() => {
    // Fetch creditos from API
    api
      .get("/creditos/todos")
      .then((res) => {
        const data_creditos: CreditoConNombreCliente[] = res.data;
        console.log("Creditos fetched:", data_creditos);
        const sorted = data_creditos.sort(
          (a: CreditoConNombreCliente, b: CreditoConNombreCliente) =>
            new Date(b.credito.fecha_inicio).getTime() -
            new Date(a.credito.fecha_inicio).getTime()
        );
        setCreditos(sorted);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching creditos:", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (admin === null) {
      navigate("/admin");
    }
  }, [admin, navigate]);

  if (!admin) {
    return null;
  }

  // Calculate pending credits
  const pendingCredits = creditos.filter(
    (c) => c.credito.estado === "PENDIENTE"
  );

  const handleApprove = async (creditId: number) => {
    // TODO: Add API call to approve credit
    setCreditos((prev) =>
      prev.map((c) =>
        c.credito.id_cred === creditId
          ? {
              ...c,
              credito: { ...c.credito, estado: "ACEPTADO" as const },
            }
          : c
      )
    );
    setSelectedCredit(null);
  };

  const handleReject = async (creditId: number) => {
    // TODO: Add API call to reject credit
    setCreditos((prev) =>
      prev.map((c) =>
        c.credito.id_cred === creditId
          ? {
              ...c,
              credito: { ...c.credito, estado: "RECHAZADO" as const },
            }
          : c
      )
    );
    setSelectedCredit(null);
  };

  const calculateMonthlyPayment = (
    principal: number,
    annualRate: number,
    months: number
  ) => {
    const monthlyRate = annualRate / 100 / 12;
    return (
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1)
    );
  };

  const handleDownloadContract = async () => {
    if (!selectedCredit) return;

    try {
      // Generate HTML content with SVG logo
      const contractHTML = await generateContractHTML(selectedCredit);

      // Create a temporary iframe to render the HTML for PDF conversion
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.top = "-9999px";
      iframe.style.left = "-9999px";
      iframe.style.width = "210mm";
      iframe.style.height = "297mm";
      document.body.appendChild(iframe);

      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(contractHTML);
        iframeDoc.close();

        // Wait for content to load
        setTimeout(() => {
          try {
            // Use browser's print to PDF functionality
            iframe.contentWindow?.print();
          } catch (error) {
            console.error(
              "Print failed, falling back to HTML download:",
              error
            );
            // Fallback to HTML download
            downloadAsHTML(contractHTML, selectedCredit.credito.id_cred);
          }
          document.body.removeChild(iframe);
        }, 1000);
      }
    } catch (error) {
      console.error("Error generating contract:", error);
      // Fallback to simple HTML generation
      const contractHTML = await generateContractHTML(selectedCredit);
      downloadAsHTML(contractHTML, selectedCredit.credito.id_cred);
    }
  };

  const downloadAsHTML = (content: string, creditId: number) => {
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contrato-${creditId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateContractHTML = async (
    creditoConCliente: CreditoConNombreCliente
  ): Promise<string> => {
    const credit = creditoConCliente.credito;
    const clienteNombre = `${creditoConCliente.cliente_nombre} ${creditoConCliente.cliente_apellido}`;

    const monthlyPayment = calculateMonthlyPayment(
      credit.prestamo,
      credit.interes,
      credit.meses_originales
    );

    // Try to load the SVG logo
    let logoBase64 = "";
    try {
      logoBase64 = await getSvgAsBase64("/images/banorte.svg");
    } catch (error) {
      console.error("Could not load SVG logo:", error);
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Contrato de Crédito Verde - Banorte</title>
        <style>
          @page { 
            size: A4; 
            margin: 2cm; 
          }
          body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6; 
            color: #333;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #EB0029; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 10px;
          }
          .logo-svg {
            width: 80px;
            height: auto;
          }
          .logo-text { 
            color: #EB0029; 
            font-size: 32px; 
            font-weight: bold; 
          }
          .title { 
            font-size: 24px; 
            margin-top: 10px; 
            color: #333; 
            font-weight: bold;
          }
          .section { 
            margin: 30px 0; 
            page-break-inside: avoid;
          }
          .section-title { 
            font-size: 18px; 
            font-weight: bold; 
            color: #EB0029; 
            margin-bottom: 15px; 
            border-bottom: 2px solid #eee; 
            padding-bottom: 5px; 
          }
          .field { 
            margin: 10px 0; 
            display: flex; 
          }
          .field-label { 
            font-weight: bold; 
            min-width: 200px; 
          }
          .field-value { 
            flex: 1; 
          }
          .footer { 
            margin-top: 50px; 
            padding-top: 20px; 
            border-top: 2px solid #eee; 
            text-align: center; 
            color: #666; 
            font-size: 12px; 
          }
          .signature-section { 
            margin-top: 60px; 
            display: flex; 
            justify-content: space-around; 
            page-break-inside: avoid;
          }
          .signature-box { 
            text-align: center; 
          }
          .signature-line { 
            border-top: 2px solid #333; 
            width: 200px; 
            margin: 40px auto 10px; 
          }
          @media print {
            body { 
              print-color-adjust: exact; 
              -webkit-print-color-adjust: exact; 
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
            ${
              logoBase64
                ? `<img src="${logoBase64}" alt="Banorte Logo" class="logo-svg" />`
                : ""
            }
            <div class="logo-text">BANORTE</div>
          </div>
          <div class="title">CONTRATO DE CRÉDITO VERDE</div>
        </div>

        <div class="section">
          <div class="section-title">INFORMACIÓN DEL CLIENTE</div>
          <div class="field">
            <div class="field-label">Nombre:</div>
            <div class="field-value">${clienteNombre}</div>
          </div>
          <div class="field">
            <div class="field-label">ID Cliente:</div>
            <div class="field-value">${credit.cliente_id}</div>
          </div>
          <div class="field">
            <div class="field-label">Credit Score:</div>
            <div class="field-value">${creditoConCliente.cliente_credit_score.toFixed(
              0
            )}</div>
          </div>
          <div class="field">
            <div class="field-label">Fecha de Contrato:</div>
            <div class="field-value">${new Date(
              credit.fecha_inicio
            ).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">TÉRMINOS DEL CRÉDITO</div>
          <div class="field">
            <div class="field-label">Monto del Préstamo:</div>
            <div class="field-value">$${credit.prestamo.toLocaleString(
              "es-MX",
              { minimumFractionDigits: 2 }
            )} MXN</div>
          </div>
          <div class="field">
            <div class="field-label">Tasa de Interés Anual:</div>
            <div class="field-value">${credit.interes}%</div>
          </div>
          <div class="field">
            <div class="field-label">Plazo:</div>
            <div class="field-value">${credit.meses_originales} meses</div>
          </div>
          <div class="field">
            <div class="field-label">Pago Mensual:</div>
            <div class="field-value">$${monthlyPayment.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })} MXN</div>
          </div>
          <div class="field">
            <div class="field-label">Categoría:</div>
            <div class="field-value">${credit.categoria}</div>
          </div>
          <div class="field">
            <div class="field-label">Descripción:</div>
            <div class="field-value">${credit.descripcion}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">IMPACTO AMBIENTAL ESTIMADO</div>
          <div class="field">
            <div class="field-label">Gasto Mensual Inicial:</div>
            <div class="field-value">$${credit.gasto_inicial_mes.toLocaleString(
              "es-MX",
              { minimumFractionDigits: 2 }
            )} MXN</div>
          </div>
          <div class="field">
            <div class="field-label">Gasto Mensual Proyectado:</div>
            <div class="field-value">$${credit.gasto_final_mes.toLocaleString(
              "es-MX",
              { minimumFractionDigits: 2 }
            )} MXN</div>
          </div>
          <div class="field">
            <div class="field-label">Ahorro Mensual Estimado:</div>
            <div class="field-value">$${(
              credit.gasto_inicial_mes - credit.gasto_final_mes
            ).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</div>
          </div>
        </div>

        <div class="section">
          <p style="text-align: justify; color: #666; font-size: 14px;">
            El presente contrato establece los términos y condiciones bajo los cuales BANORTE otorga un crédito verde al cliente mencionado. 
            El cliente se compromete a realizar los pagos mensuales en las fechas establecidas y a utilizar los fondos exclusivamente para 
            los fines ambientales especificados en este documento.
          </p>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div>Firma del Cliente</div>
            <div style="font-size: 12px; color: #666;">${clienteNombre}</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div>Firma del Representante</div>
            <div style="font-size: 12px; color: #666;">BANORTE</div>
          </div>
        </div>

        <div class="footer">
          <p>BANORTE - Créditos Verdes | Sucursal Principal</p>
          <p>Este documento es legalmente vinculante una vez firmado por ambas partes</p>
          <p>Documento generado el ${new Date().toLocaleDateString("es-MX", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</p>
        </div>
      </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminTopBar />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">
            Cargando solicitudes...
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminTopBar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Solicitudes Pendientes
          </h1>
          <p className="text-muted-foreground">
            {pendingCredits.length} solicitudes esperando aprobación
          </p>
        </div>

        {pendingCredits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Check className="h-12 w-12 text-[#6CC04A] mb-4" />
              <p className="text-muted-foreground">
                No hay solicitudes pendientes
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingCredits.map((credit) => (
              <Card
                key={credit.credito.id_cred}
                className="cursor-pointer transition-all hover:shadow-lg hover:border-[#EB0029]"
                onClick={() => setSelectedCredit(credit)}
              >
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <Badge className="bg-[#FFA400] text-white">
                        Pendiente
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(
                          credit.credito.fecha_inicio
                        ).toLocaleDateString("es-MX")}
                      </span>
                    </div>

                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        ${credit.credito.prestamo.toLocaleString("es-MX")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {credit.credito.descripcion}
                      </p>
                    </div>

                    <div className="pt-3 border-t space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Cliente:</span>
                        <span className="font-medium">
                          {credit.cliente_nombre} {credit.cliente_apellido}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          Credit Score:
                        </span>
                        <span
                          className={`font-bold ${
                            credit.cliente_credit_score >= 0.85
                              ? "text-green-600"
                              : credit.cliente_credit_score >= 0.65
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {credit.cliente_credit_score}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Plazo:</span>
                        <span className="font-medium">
                          {credit.credito.meses_originales} meses
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Interés:</span>
                        <span className="font-medium">
                          {credit.credito.interes}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog
          open={selectedCredit !== null}
          onOpenChange={() => setSelectedCredit(null)}
        >
          <DialogContent className="w-[70vw] max-w-none max-h-[90vh] overflow-y-auto">
            {selectedCredit && (
              <>
                <DialogHeader>
                  <DialogTitle>Detalles de la Solicitud</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Client info */}
                  <div>
                    <h3 className="font-semibold mb-3 text-[#EB0029]">
                      Información del Cliente
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Nombre Completo:
                        </span>
                        <span className="font-medium">
                          {selectedCredit.cliente_nombre}{" "}
                          {selectedCredit.cliente_apellido}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          ID Cliente:
                        </span>
                        <span className="font-medium">
                          {selectedCredit.credito.cliente_id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Credit Score:
                        </span>
                        <span
                          className={`font-bold ${
                            selectedCredit.cliente_credit_score >= 0.85
                              ? "text-green-600"
                              : selectedCredit.cliente_credit_score >= 0.64
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {selectedCredit.cliente_credit_score}
                          {selectedCredit.cliente_credit_score >= 0.85
                            ? " (Excelente)"
                            : selectedCredit.cliente_credit_score > 0.64
                            ? " (Bueno)"
                            : " (Riesgo)"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Fecha de Solicitud:
                        </span>
                        <span className="font-medium">
                          {new Date(
                            selectedCredit.credito.fecha_inicio
                          ).toLocaleDateString("es-MX")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Credit details */}
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3 text-[#EB0029]">
                      Detalles del Crédito
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            Monto solicitado
                          </p>
                          <p className="font-semibold text-lg">
                            $
                            {selectedCredit.credito.prestamo.toLocaleString(
                              "es-MX"
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Plazo</p>
                          <p className="font-semibold">
                            {selectedCredit.credito.meses_originales} meses
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Percent className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            Tasa de interés
                          </p>
                          <p className="font-semibold">
                            {selectedCredit.credito.interes}% anual
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground mb-1">
                          Categoría:
                        </p>
                        <p className="text-sm font-medium">
                          {selectedCredit.credito.categoria}
                        </p>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground mb-1">
                          Descripción:
                        </p>
                        <p className="text-sm font-medium">
                          {selectedCredit.credito.descripcion}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Financial summary */}
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3 text-[#EB0029]">
                      Resumen Financiero
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Pago mensual:
                        </span>
                        <span className="font-semibold">
                          $
                          {calculateMonthlyPayment(
                            selectedCredit.credito.prestamo,
                            selectedCredit.credito.interes,
                            selectedCredit.credito.meses_originales
                          ).toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Ahorro mensual estimado:
                        </span>
                        <span className="font-semibold text-[#6CC04A]">
                          $
                          {(
                            selectedCredit.credito.gasto_inicial_mes -
                            selectedCredit.credito.gasto_final_mes
                          ).toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t flex flex-col gap-3">
                    <BanorteButton
                      variant="secondary"
                      className="w-full border-[#EB0029] text-[#EB0029] hover:bg-[#EB0029] hover:text-white"
                      onClick={() => setShowContract(true)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizar Contrato
                    </BanorteButton>

                    <div className="flex gap-3">
                      <BanorteButton
                        variant="primary"
                        className="flex-1 bg-[#6CC04A] hover:bg-[#5CB03A]"
                        onClick={() =>
                          handleApprove(selectedCredit.credito.id_cred)
                        }
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Aprobar
                      </BanorteButton>
                      <BanorteButton
                        variant="secondary"
                        className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-white"
                        onClick={() =>
                          handleReject(selectedCredit.credito.id_cred)
                        }
                      >
                        <X className="mr-2 h-4 w-4" />
                        Rechazar
                      </BanorteButton>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showContract} onOpenChange={setShowContract}>
          <DialogContent className="w-[70vw] max-w-none max-h-[90vh] overflow-y-auto">
            {selectedCredit && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>Contrato de Crédito Verde</span>
                    <BanorteButton
                      variant="secondary"
                      className="ml-auto"
                      onClick={handleDownloadContract}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar PDF
                    </BanorteButton>
                  </DialogTitle>
                </DialogHeader>

                <div className="border rounded-lg p-8 bg-white text-black">
                  {/* Contract Header */}
                  <div className="text-center border-b-4 border-[#EB0029] pb-6 mb-8">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      {banorteLogo && (
                        <img
                          src={banorteLogo}
                          alt="Banorte Logo"
                          className="w-16 h-16 object-contain"
                        />
                      )}
                      <div className="text-[#EB0029] text-4xl font-bold">
                        BANORTE
                      </div>
                    </div>
                    <div className="text-2xl font-semibold">
                      CONTRATO DE CRÉDITO VERDE
                    </div>
                  </div>

                  {/* Client Information */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-[#EB0029] mb-4 border-b-2 pb-2">
                      INFORMACIÓN DEL CLIENTE
                    </h3>
                    <div className="space-y-2">
                      <div className="flex">
                        <span className="font-bold min-w-[200px]">Nombre:</span>
                        <span>
                          {selectedCredit.cliente_nombre}{" "}
                          {selectedCredit.cliente_apellido}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-bold min-w-[200px]">
                          ID Cliente:
                        </span>
                        <span>{selectedCredit.credito.cliente_id}</span>
                      </div>
                      <div className="flex">
                        <span className="font-bold min-w-[200px]">
                          Credit Score:
                        </span>
                        <span
                          className={`font-bold ${
                            selectedCredit.cliente_credit_score >= 0.85
                              ? "text-green-600"
                              : selectedCredit.cliente_credit_score >= 0.64
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {selectedCredit.cliente_credit_score}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-bold min-w-[200px]">
                          Fecha de Contrato:
                        </span>
                        <span>
                          {new Date(
                            selectedCredit.credito.fecha_inicio
                          ).toLocaleDateString("es-MX", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Credit Terms */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-[#EB0029] mb-4 border-b-2 pb-2">
                      TÉRMINOS DEL CRÉDITO
                    </h3>
                    <div className="space-y-2">
                      <div className="flex">
                        <span className="font-bold min-w-[200px]">
                          Monto del Préstamo:
                        </span>
                        <span>
                          $
                          {selectedCredit.credito.prestamo.toLocaleString(
                            "es-MX",
                            {
                              minimumFractionDigits: 2,
                            }
                          )}{" "}
                          MXN
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-bold min-w-[200px]">
                          Tasa de Interés Anual:
                        </span>
                        <span>{selectedCredit.credito.interes}%</span>
                      </div>
                      <div className="flex">
                        <span className="font-bold min-w-[200px]">Plazo:</span>
                        <span>
                          {selectedCredit.credito.meses_originales} meses
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-bold min-w-[200px]">
                          Pago Mensual:
                        </span>
                        <span>
                          $
                          {calculateMonthlyPayment(
                            selectedCredit.credito.prestamo,
                            selectedCredit.credito.interes,
                            selectedCredit.credito.meses_originales
                          ).toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          MXN
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-bold min-w-[200px]">
                          Categoría:
                        </span>
                        <span>{selectedCredit.credito.categoria}</span>
                      </div>
                      <div className="flex">
                        <span className="font-bold min-w-[200px]">
                          Descripción:
                        </span>
                        <span>{selectedCredit.credito.descripcion}</span>
                      </div>
                    </div>
                  </div>

                  {/* Environmental Impact */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-[#EB0029] mb-4 border-b-2 pb-2">
                      IMPACTO AMBIENTAL ESTIMADO
                    </h3>
                    <div className="space-y-2">
                      <div className="flex">
                        <span className="font-bold min-w-[200px]">
                          Gasto Mensual Inicial:
                        </span>
                        <span>
                          $
                          {selectedCredit.credito.gasto_inicial_mes.toLocaleString(
                            "es-MX",
                            {
                              minimumFractionDigits: 2,
                            }
                          )}{" "}
                          MXN
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-bold min-w-[200px]">
                          Gasto Mensual Proyectado:
                        </span>
                        <span>
                          $
                          {selectedCredit.credito.gasto_final_mes.toLocaleString(
                            "es-MX",
                            { minimumFractionDigits: 2 }
                          )}{" "}
                          MXN
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-bold min-w-[200px]">
                          Ahorro Mensual Estimado:
                        </span>
                        <span className="text-[#6CC04A] font-semibold">
                          $
                          {(
                            selectedCredit.credito.gasto_inicial_mes -
                            selectedCredit.credito.gasto_final_mes
                          ).toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          MXN
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="mb-12">
                    <p className="text-justify text-sm leading-relaxed text-gray-700">
                      El presente contrato establece los términos y condiciones
                      bajo los cuales BANORTE otorga un crédito verde al cliente
                      mencionado. El cliente se compromete a realizar los pagos
                      mensuales en las fechas establecidas y a utilizar los
                      fondos exclusivamente para los fines ambientales
                      especificados en este documento.
                    </p>
                  </div>

                  {/* Signatures */}
                  <div className="flex justify-around mt-16">
                    <div className="text-center">
                      <div className="border-t-2 border-black w-48 mb-2 mt-12"></div>
                      <div className="font-semibold">Firma del Cliente</div>
                      <div className="text-sm text-gray-600">
                        {selectedCredit.cliente_nombre}{" "}
                        {selectedCredit.cliente_apellido}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="border-t-2 border-black w-48 mb-2 mt-12"></div>
                      <div className="font-semibold">
                        Firma del Representante
                      </div>
                      <div className="text-sm text-gray-600">BANORTE</div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-12 pt-6 border-t-2 text-center text-xs text-gray-600">
                    <p>BANORTE - Créditos Verdes | Sucursal Principal</p>
                    <p>
                      Este documento es legalmente vinculante una vez firmado
                      por ambas partes
                    </p>
                    <p>
                      Documento generado el{" "}
                      {new Date().toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
