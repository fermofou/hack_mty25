"use client";

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router"; // Asumo que usas react-router, no next/navigation
import { useAuth } from "../hooks/useAuth"; // Ajusta la ruta si es necesario
import { AdminTopBar } from "../components/AdminTopBar"; // Ajusta la ruta si es necesario
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BanorteButton } from "@/components/ui/BanorteButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Importa Tabs
import {
  Check,
  X,
  Eye,
  DollarSign,
  Percent,
  Clock,
  User,
  Download,
  Loader2,
  FileX,
  PackageCheck,
  PackageSearch,
} from "lucide-react";
import { api } from "@/lib/api";
import type { CreditoConNombreCliente } from "@/lib/types"; // Asumo que tus tipos están aquí

// --- Mock de Componentes (Solo para que el archivo sea autónomo) ---
// (Asumimos que tienes este componente en otra parte)
// const AdminTopBar = () => (
//   <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
//     <div className="container flex h-14 items-center">
//       <div className="mr-4 hidden md:flex">
//         <a className="mr-6 flex items-center space-x-2" href="/admin/dashboard">
//           <Sparkles className="h-6 w-6 text-[#6CC04A]" />
//           <span className="hidden font-bold sm:inline-block">Banerde Admin</span>
//         </a>
//       </div>
//     </div>
//   </header>
// )

// (Asumimos que tienes este componente en otra parte)
// const BanorteButton = ({ variant, className, children, ...props }: any) => (
//   <button className={`px-4 py-2 rounded-md font-semibold ${className}`} {...props}>
//     {children}
//   </button>
// )
// --- Fin de Mocks ---

type CreditStatus = "PENDIENTE" | "APROBADO" | "NEGADO" | "ACEPTADO";

// Function to convert SVG to base64 for embedding
const getSvgAsBase64 = async (svgPath: string): Promise<string> => {
  try {
    const response = await fetch(svgPath);
    if (!response.ok) throw new Error("Network response was not ok");
    const svgText = await response.text();
    return `data:image/svg+xml;base64,${btoa(svgText)}`;
  } catch (error) {
    console.error("Error loading SVG:", error);
    return "";
  }
};

// ====================================================================
// 1. Componente Principal
// ====================================================================
export default function AdminCredits() {
  const navigate = useNavigate();
  const { admin } = useAuth();
  const [allCredits, setAllCredits] = useState<CreditoConNombreCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredit, setSelectedCredit] =
    useState<CreditoConNombreCliente | null>(null);
  const [showContract, setShowContract] = useState(false);
  const [banorteLogo, setBanorteLogo] = useState<string>("");
  const [currentTab, setCurrentTab] = useState<CreditStatus>("PENDIENTE");

  // Carga el logo de Banorte
  useEffect(() => {
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

  // Carga TODOS los créditos
  useEffect(() => {
    api
      .get("/creditos/todos")
      .then((res) => {
        const data_creditos: CreditoConNombreCliente[] = res.data;
        console.log("Loaded credits data:", data_creditos); // Debug log
        console.log("First credit structure:", data_creditos[0]); // Debug log
        // Ya no necesitamos ordenar aquí porque el backend ordena por fecha_inicio
        setAllCredits(data_creditos);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching creditos:", error);
        setLoading(false);
      });
  }, []);

  // Redirige si no es admin
  useEffect(() => {
    if (admin === null) {
      navigate("/admin");
    }
  }, [admin, navigate]);

  // Memoiza los créditos filtrados para evitar re-cálculos
  const filteredCredits = useMemo(() => {
    return allCredits.filter((c) => c.credito.estado === currentTab);
  }, [allCredits, currentTab]);

  // --- Handlers de API ---

  const updateCreditStatus = async (
    creditId: number,
    newStatus: CreditStatus
  ) => {
    try {
      console.log("Updating credit:", creditId, "to status:", newStatus); // Debug log
      console.log("Type of creditId:", typeof creditId); // Debug log

      if (!creditId || creditId === undefined) {
        throw new Error("Credit ID is undefined or null");
      }

      // Solo envía el campo que se va a actualizar
      const response = await api.patch(`/creditos/${creditId}`, {
        estado: newStatus,
      });

      if (response.status !== 200) {
        throw new Error(
          `Falló al actualizar el crédito (status: ${response.status})`
        );
      }

      console.log("Credit updated successfully"); // Debug log

      // Actualiza el estado local SÓLO después de que la API tenga éxito
      setAllCredits((prev) =>
        prev.map((c) =>
          c.credito.id_cred === creditId
            ? { ...c, credito: { ...c.credito, estado: newStatus } }
            : c
        )
      );
    } catch (error) {
      console.error(`Error updating credit to ${newStatus}:`, error);
    }
    setSelectedCredit(null);
  };
  const handleApprove = (creditId: number) => {
    console.log(
      "handleApprove called with creditId:",
      creditId,
      typeof creditId
    );
    return updateCreditStatus(creditId, "APROBADO");
  };
  const handleReject = (creditId: number) => {
    console.log(
      "handleReject called with creditId:",
      creditId,
      typeof creditId
    );
    return updateCreditStatus(creditId, "NEGADO");
  };
  const handleAccept = (creditId: number) => {
    console.log(
      "handleAccept called with creditId:",
      creditId,
      typeof creditId
    );
    return updateCreditStatus(creditId, "APROBADO");
  };

  // --- Render ---

  if (!admin) {
    return null; // Muestra un loader o nada mientras redirige
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminTopBar />
        <main className="container mx-auto px-4 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mt-12" />
          <p className="text-center text-muted-foreground mt-4">
            Cargando solicitudes...
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <AdminTopBar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Gestionar Créditos
          </h1>
          <p className="text-muted-foreground">
            Revisa, aprueba o niega las solicitudes de crédito.
          </p>
        </div>

        {/* --- TABS --- */}
        <Tabs
          value={currentTab}
          onValueChange={(value: string) =>
            setCurrentTab(value as CreditStatus)
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 md:w-[600px]">
            <TabsTrigger value="PENDIENTE">
              <PackageSearch className="mr-2 h-4 w-4" />
              Pendientes (
              {
                allCredits.filter((c) => c.credito.estado === "PENDIENTE")
                  .length
              }
              )
            </TabsTrigger>
            <TabsTrigger value="APROBADO">
              <PackageCheck className="mr-2 h-4 w-4" />
              Ofertas (
              {allCredits.filter((c) => c.credito.estado === "APROBADO").length}
              )
            </TabsTrigger>
            <TabsTrigger value="ACEPTADO">
              <Check className="mr-2 h-4 w-4" />
              Activos (
              {allCredits.filter((c) => c.credito.estado === "ACEPTADO").length}
              )
            </TabsTrigger>
            <TabsTrigger value="NEGADO">
              <FileX className="mr-2 h-4 w-4" />
              Negados (
              {allCredits.filter((c) => c.credito.estado === "NEGADO").length})
            </TabsTrigger>
          </TabsList>

          {/* Contenido de cada Tab */}
          <TabsContent value="PENDIENTE" className="mt-6">
            <CreditList
              credits={filteredCredits}
              onCreditClick={setSelectedCredit}
            />
          </TabsContent>
          <TabsContent value="APROBADO" className="mt-6">
            <CreditList
              credits={filteredCredits}
              onCreditClick={setSelectedCredit}
            />
          </TabsContent>
          <TabsContent value="ACEPTADO" className="mt-6">
            <CreditList
              credits={filteredCredits}
              onCreditClick={setSelectedCredit}
            />
          </TabsContent>
          <TabsContent value="NEGADO" className="mt-6">
            <CreditList
              credits={filteredCredits}
              onCreditClick={setSelectedCredit}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* --- Modales --- */}

      {/* Modal de Detalles del Crédito */}
      <CreditModal
        credit={selectedCredit}
        onClose={() => setSelectedCredit(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onAccept={handleAccept}
        onShowContract={() => setShowContract(true)}
      />

      {/* Modal del Contrato (PDF/HTML) */}
      <ContractModal
        credit={selectedCredit}
        adminName={`${admin.nombre} ${admin.apellido}`} // Pasa el nombre del admin
        logoBase64={banorteLogo}
        show={showContract}
        onClose={() => setShowContract(false)}
      />
    </div>
  );
}

// ====================================================================
// 2. Componente: Lista de Créditos
// ====================================================================
interface CreditListProps {
  credits: CreditoConNombreCliente[];
  onCreditClick: (credit: CreditoConNombreCliente) => void;
}

function CreditList({ credits, onCreditClick }: CreditListProps) {
  if (credits.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Check className="h-12 w-12 text-[#6CC04A] mb-4" />
          <p className="text-muted-foreground">
            No hay solicitudes en esta categoría.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {credits.map((credit) => (
        <CreditCard
          key={credit.credito.id_cred}
          credit={credit}
          onClick={onCreditClick}
        />
      ))}
    </div>
  );
}

// ====================================================================
// 3. Componente: Tarjeta de Crédito Individual
// ====================================================================
interface CreditCardProps {
  credit: CreditoConNombreCliente;
  onClick: (credit: CreditoConNombreCliente) => void;
}

function CreditCard({ credit, onClick }: CreditCardProps) {
  const { credito, cliente_nombre, cliente_apellido, cliente_credit_score } =
    credit;

  const getBadgeClass = (estado: CreditStatus) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-[#FFA400] text-white hover:bg-[#FFA400]";
      case "APROBADO":
        return "bg-[#2563EB] text-white hover:bg-[#2563EB]"; // Azul para ofertas
      case "ACEPTADO":
        return "bg-[#6CC04A] text-white hover:bg-[#6CC04A]"; // Verde para activos
      case "NEGADO":
        return "bg-[#EB0029] text-white hover:bg-[#EB0029]";
    }
  };

  const getScoreColor = (score: number) => {
    return score >= 0.85
      ? "text-green-600"
      : score >= 0.65
      ? "text-yellow-600"
      : "text-red-600";
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:border-[#EB0029]"
      onClick={() => onClick(credit)}
    >
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <Badge className={getBadgeClass(credito.estado)}>
              {credito.estado}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(credito.fecha_inicio).toLocaleDateString("es-MX")}
            </span>
          </div>

          <div>
            <p className="text-2xl font-bold text-foreground">
              ${credito.prestamo.toLocaleString("es-MX")}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {credito.descripcion}
            </p>
          </div>

          <div className="pt-3 border-t space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium truncate">
                {cliente_nombre} {cliente_apellido}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground ml-6">Credit Score:</span>
              <span
                className={`font-bold ${getScoreColor(cliente_credit_score)}`}
              >
                {cliente_credit_score}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Plazo:</span>
              <span className="font-medium">
                {credito.meses_originales} meses
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Interés:</span>
              <span className="font-medium">{credito.interes}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ====================================================================
// 4. Componente: Modal de Detalles del Crédito
// ====================================================================
interface CreditModalProps {
  credit: CreditoConNombreCliente | null;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onAccept: (id: number) => void;
  onShowContract: () => void;
}

function CreditModal({
  credit,
  onClose,
  onApprove,
  onReject,
  onAccept,
  onShowContract,
}: CreditModalProps) {
  if (!credit) return null;

  const { credito, cliente_nombre, cliente_apellido, cliente_credit_score } =
    credit;

  // Debug log para verificar el id_cred
  console.log("CreditModal - credito object:", credito);
  console.log(
    "CreditModal - credito.id_cred:",
    credito.id_cred,
    typeof credito.id_cred
  );

  const monthlyPayment = calculateMonthlyPayment(
    credito.prestamo,
    credito.interes,
    credito.meses_originales
  );
  const scoreColor =
    cliente_credit_score >= 0.85
      ? "text-green-600"
      : cliente_credit_score >= 0.64
      ? "text-yellow-600"
      : "text-red-600";
  const scoreLabel =
    cliente_credit_score >= 0.85
      ? " (Excelente)"
      : cliente_credit_score > 0.64
      ? " (Bueno)"
      : " (Riesgo)";

  return (
    <Dialog open={credit !== null} onOpenChange={onClose}>
      <DialogContent className="w-[70vw] max-w-none max-h-[90vh] overflow-y-auto">
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
                <span className="text-muted-foreground">Nombre Completo:</span>
                <span className="font-medium">
                  {cliente_nombre} {cliente_apellido}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID Cliente:</span>
                <span className="font-medium">{credito.cliente_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credit Score:</span>
                <span className={`font-bold ${scoreColor}`}>
                  {cliente_credit_score}
                  {scoreLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Fecha de Solicitud:
                </span>
                <span className="font-medium">
                  {new Date(credito.fecha_inicio).toLocaleDateString("es-MX")}
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
              <InfoRow
                icon={DollarSign}
                label="Monto solicitado"
                value={`$${credito.prestamo.toLocaleString("es-MX")}`}
                isLarge
              />
              <InfoRow
                icon={Clock}
                label="Plazo"
                value={`${credito.meses_originales} meses`}
              />
              <InfoRow
                icon={Percent}
                label="Tasa de interés"
                value={`${credito.interes}% anual`}
              />
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-1">Categoría:</p>
                <p className="text-sm font-medium">{credito.categoria}</p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-1">
                  Descripción:
                </p>
                <p className="text-sm font-medium">{credito.descripcion}</p>
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
                <span className="text-muted-foreground">Pago mensual:</span>
                <span className="font-semibold">
                  $
                  {monthlyPayment.toLocaleString("es-MX", {
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
                    credito.gasto_inicial_mes - credito.gasto_final_mes
                  ).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* --- Botones de Acción --- */}
          <div className="pt-4 border-t flex flex-col gap-3">
            {/* Solo muestra "Visualizar Contrato" si NO está NEGADO */}
            {credito.estado !== "NEGADO" && (
              <BanorteButton
                variant="secondary"
                className="w-full border-[#EB0029] text-[#EB0029] hover:bg-[#EB0029] hover:text-white"
                onClick={onShowContract}
              >
                <Eye className="mr-2 h-4 w-4" />
                Visualizar Contrato
              </BanorteButton>
            )}

            {/* Botones para créditos PENDIENTES, si estam pendientes, si se aprueban se aceptan */}
            {credito.estado === "PENDIENTE" && (
              <div className="flex gap-3">
                <BanorteButton
                  variant="primary"
                  className="flex-1 bg-[#6CC04A] hover:bg-[#5CB03A] text-white"
                  onClick={() => onAccept(credito.id_cred)}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Aprobar
                </BanorteButton>
                <BanorteButton
                  variant="secondary"
                  className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-white"
                  onClick={() => onReject(credito.id_cred)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Negar
                </BanorteButton>
              </div>
            )}

            {/* no debe haber botón para créditos APROBADOS (ofertas) */}
            {credito.estado === "APROBADO" && (
              <BanorteButton
                variant="secondary"
                className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-white"
                onClick={() => onReject(credito.id_cred)}
              >
                <Check className="mr-2 h-4 w-4" />
                Cancelar Crédito
              </BanorteButton>
            )}

            {/* Info para créditos ACEPTADOS (activos) */}
            {credito.estado === "ACEPTADO" && (
              <div className="text-center text-sm text-muted-foreground">
                <Check className="mx-auto h-8 w-8 text-[#6CC04A] mb-2" />
                Crédito activo y en uso
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ====================================================================
// 5. Componente: Modal del Contrato
// ====================================================================
interface ContractModalProps {
  credit: CreditoConNombreCliente | null;
  adminName: string;
  logoBase64: string;
  show: boolean;
  onClose: () => void;
}

function ContractModal({
  credit,
  adminName,
  logoBase64,
  show,
  onClose,
}: ContractModalProps) {
  if (!credit) return null;

  const handleDownloadContract = async () => {
    if (!credit) return;

    try {
      // Generate HTML content with SVG logo
      const contractHTML = await generateContractHTML(
        credit,
        adminName,
        logoBase64,
        false // false para modo PDF
      );

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
            downloadAsHTML(contractHTML, credit.credito.id_cred);
          }
          document.body.removeChild(iframe);
        }, 1000);
      }
    } catch (error) {
      console.error("Error generating contract:", error);
      // Fallback to simple HTML generation
      const contractHTML = await generateContractHTML(
        credit,
        adminName,
        logoBase64,
        false
      );
      downloadAsHTML(contractHTML, credit.credito.id_cred);
    }
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="w-[70vw] max-w-none max-h-[90vh] overflow-y-auto">
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

        {/* El HTML se renderiza directamente aquí para la visualización */}
        <div
          className="border rounded-lg p-8 bg-white text-black overflow-y-auto"
          dangerouslySetInnerHTML={{
            __html: generateContractHTML(credit, adminName, logoBase64, true), // 'true' para modo preview
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

// ====================================================================
// 6. Funciones de Ayuda
// ====================================================================

/**
 * Componente helper para filas de información en el modal
 */
function InfoRow({ icon: Icon, label, value, isLarge = false }: any) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`font-semibold ${isLarge ? "text-lg" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

/**
 * Calcula el pago mensual
 */
const calculateMonthlyPayment = (
  principal: number,
  annualRate: number,
  months: number
) => {
  if (annualRate === 0) return principal / months; // Caso sin interés
  const monthlyRate = annualRate / 100 / 12;
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return isNaN(payment) ? 0 : payment;
};

/**
 * Genera el HTML del contrato
 */
const generateContractHTML = (
  creditoConCliente: CreditoConNombreCliente,
  adminName: string,
  logoBase64: string,
  isPreview: boolean = false
): string => {
  const { credito, cliente_nombre, cliente_apellido, cliente_credit_score } =
    creditoConCliente;
  const clienteNombreCompleto = `${cliente_nombre} ${cliente_apellido}`;
  const monthlyPayment = calculateMonthlyPayment(
    credito.prestamo,
    credito.interes,
    credito.meses_originales
  );

  // Determinar si mostrar nombres en negritas (solo para créditos activos)
  const isActive = credito.estado === "ACEPTADO";
  const clienteNameStyle = isActive
    ? "font-weight: bold; color: #000;"
    : "color: #666;";
  const adminNameStyle = isActive
    ? "font-weight: bold; color: #000;"
    : "color: #666;";

  // El estilo es un poco diferente si es un preview (sin @page)
  const previewStyles = isPreview
    ? `
    body { 
      font-family: Arial, sans-serif; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 20px; 
      line-height: 1.6; 
      color: #333;
    }
  `
    : `
    @page { 
      size: A4; 
      margin: 2cm; 
    }
    body { 
      font-family: Arial, sans-serif; 
      margin: 0;
      padding: 0;
      line-height: 1.6; 
      color: #333;
    }
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Contrato de Crédito Verde - Banorte</title>
      <style>
        ${previewStyles}
        .header { text-align: center; border-bottom: 3px solid #EB0029; padding-bottom: 20px; margin-bottom: 30px; }
        .logo-container { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px; }
        .logo-svg { width: 80px; height: auto; }
        .logo-text { color: #EB0029; font-size: 32px; font-weight: bold; }
        .title { font-size: 24px; margin-top: 10px; color: #333; font-weight: bold; }
        .section { margin: 30px 0; page-break-inside: avoid; }
        .section-title { font-size: 18px; font-weight: bold; color: #EB0029; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 5px; }
        .field { margin: 10px 0; display: flex; }
        .field-label { font-weight: bold; min-width: 200px; }
        .field-value { flex: 1; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #eee; text-align: center; color: #666; font-size: 12px; }
        .signature-section { margin-top: 60px; display: flex; justify-content: space-around; page-break-inside: avoid; }
        .signature-box { text-align: center; }
        .signature-line { border-top: 2px solid #333; width: 200px; margin: 40px auto 10px; }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
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
        <div class="title">CONTRATO DE CRÉDITO VERDE${
          isActive
            ? ' - <span style="color: #6CC04A; font-weight: bold;">ACTIVO</span>'
            : ""
        }</div>
      </div>

      <div class="section">
        <div class="section-title">INFORMACIÓN DEL CLIENTE</div>
        <div class="field">
          <div class="field-label">Nombre:</div>
          <div class="field-value">${clienteNombreCompleto}</div>
        </div>
        <div class="field">
          <div class="field-label">ID Cliente:</div>
          <div class="field-value">${credito.cliente_id}</div>
        </div>
        <div class="field">
          <div class="field-label">Credit Score:</div>
          <div class="field-value">${cliente_credit_score.toFixed(2)}</div>
        </div>
        <div class="field">
          <div class="field-label">Fecha de Contrato:</div>
          <div class="field-value">${new Date(
            credito.fecha_inicio
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
          <div class="field-value">$${credito.prestamo.toLocaleString("es-MX", {
            minimumFractionDigits: 2,
          })} MXN</div>
        </div>
        <div class="field">
          <div class="field-label">Tasa de Interés Anual:</div>
          <div class="field-value">${credito.interes}%</div>
        </div>
        <div class="field">
          <div class="field-label">Plazo:</div>
          <div class="field-value">${credito.meses_originales} meses</div>
        </div>
        <div class="field">
          <div class="field-label">Pago Mensual:</div>
          <div class="field-value">$${monthlyPayment.toLocaleString("es-MX", {
            minimumFractionDigits: 2,
          })} MXN</div>
        </div>
        <div class="field">
          <div class="field-label">Categoría:</div>
          <div class="field-value">${credito.categoria}</div>
        </div>
        <div class="field">
          <div class="field-label">Descripción:</div>
          <div class="field-value">${credito.descripcion}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">IMPACTO AMBIENTAL ESTIMADO</div>
        <div class="field">
          <div class="field-label">Gasto Mensual Inicial:</div>
          <div class="field-value">$${credito.gasto_inicial_mes.toLocaleString(
            "es-MX",
            { minimumFractionDigits: 2 }
          )} MXN</div>
        </div>
        <div class="field">
          <div class="field-label">Gasto Mensual Proyectado:</div>
          <div class="field-value">$${credito.gasto_final_mes.toLocaleString(
            "es-MX",
            { minimumFractionDigits: 2 }
          )} MXN</div>
        </div>
        <div class="field">
          <div class="field-label">Ahorro Mensual Estimado:</div>
          <div class="field-value" style="color: #6CC04A; font-weight: bold;">$${(
            credito.gasto_inicial_mes - credito.gasto_final_mes
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
          ${
            isActive
              ? `<div style="font-size: 14px; ${clienteNameStyle} margin-bottom: 10px;">${clienteNombreCompleto}</div>`
              : ""
          }
          <div class="signature-line"></div>
          <div style="margin-top: 10px;">Cliente</div>
          <div style="font-size: 12px; color: #666;">${clienteNombreCompleto}</div>
        </div>
        <div class="signature-box">
          ${
            isActive
              ? `<div style="font-size: 14px; ${adminNameStyle} margin-bottom: 10px;">${adminName}</div>`
              : ""
          }
          <div class="signature-line"></div>
          <div style="margin-top: 10px;">Representante</div>
          <div style="font-size: 12px; color: #666;">${adminName} (BANORTE)</div>
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

/**
 * Descarga el contrato como un archivo .html
 */
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
