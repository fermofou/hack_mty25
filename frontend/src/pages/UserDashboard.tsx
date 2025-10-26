"use client";

import { useEffect, useState } from "react";
import { Modal } from "../components/ui/modal";
import { Input } from "../components/Input";
import { api } from "../lib/api";
import toast from "react-hot-toast";
// import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { UserTopBar } from "../components/UserTopBar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import TransactionList from "@/components/TransactionList";
import { Button } from "@/components/Button";
import PreapprovedCreditCard from "@/components/PreapprovedCreditCard";
import {
  type CreditOffer,
  fetchPreapprovedCredits,
  transformCreditOffer,
} from "@/lib/creditOfferUtils";

export default function UserDashboard() {
  const navigate = useNavigate();
  // const { user, loginUser } = useAuth();
  const [preapprovedCredits, setPreapprovedCredits] = useState<CreditOffer[]>([]);
  const [loadingCredits, setLoadingCredits] = useState(false);

  // Modal state for transaction registration
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    monto: "",
    categoria: "Luz",
    descripcion: "",
    fecha: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const categorias = [
    { value: "Luz", label: "Electricidad" },
    { value: "Transporte", label: "Transporte" },
    { value: "Agua", label: "Agua" },
    { value: "Gas", label: "Gas" },
    { value: "Otro", label: "Otro" },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Helper to reset form
  const resetForm = () => {
    setForm({ monto: "", categoria: "Luz", descripcion: "", fecha: "" });
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const payload = {
        cliente_id: user.id,
        monto: Number(form.monto),
        categoria: form.categoria,
        descripcion: form.descripcion,
        fecha: form.fecha,
      };
      const { data } = await api.post("/transacciones/registrar", payload);
  // Update user context (reload user info) -- removed unnecessary loginUser call
      toast.success("Transacción registrada exitosamente");
      setIsModalOpen(false);
      resetForm();
      // Optionally: trigger TransactionList refresh (could use a context or event)
      // For now, reload page or rely on TransactionList's useEffect on user
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Error al registrar transacción");
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch preapproved credits
  useEffect(() => {
    const loadPreapprovedCredits = async () => {
      if (!user?.id) return;

      setLoadingCredits(true);
      const credits = await fetchPreapprovedCredits(user.id);
      setPreapprovedCredits(credits);
      setLoadingCredits(false);
    };

    loadPreapprovedCredits();
  }, [user?.id]);

  useEffect(() => {
    if (user === null) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <UserTopBar />

      <main className="container mx-auto px-4 py-8 max-w-[1200px]">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Hola, {user.nombre.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Aquí está el resumen de tu cuenta
          </p>
        </div>

        {/* Balance card */}
        <Card className="mb-8 border-none bg-linear-to-br from-[#EB0029] to-[#DB0026] text-white">
          <CardHeader>
            <CardTitle className="text-white/90 text-sm font-medium">
              Saldo disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold mb-2">
                  $
                  {user.saldo.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preapproved credits - Dynamic rendering */}
        {/* {loadingCredits && (
          <Card className="mb-8 bg-linear-to-br from-green-50 to-green-100 border-green-300 shadow-lg">
            <CardContent className="py-8 text-center text-green-700">
              Cargando créditos preaprobados...
            </CardContent>
          </Card>
        )} */}

        {/* {!loadingCredits &&
          !creditsError &&
          preapprovedCredits.length === 0 && (
            <Card className="mb-8 bg-linear-to-br from-gray-50 to-gray-100 border-gray-300 shadow-lg">
              <CardContent className="py-8 text-center text-gray-700">
                No tienes créditos preaprobados en este momento.
              </CardContent>
            </Card>
          )} */}

        {!loadingCredits && preapprovedCredits.length > 0 && (
          <PreapprovedCreditCard
            offer={transformCreditOffer(preapprovedCredits[0])}
            showDetailsInModal={false}
            className="mb-8"
            onApply={() => {
              const productLink = preapprovedCredits[0].product?.link;
              if (productLink) {
                window.open(productLink, "_blank");
              }
            }}
          />
        )}

        {/* Transactions section with button */}
        <div className="flex items-center justify-between mt-12 mb-2">
          <h2 className="text-xl font-semibold">Transacciones recientes</h2>
          <Button
            variant="primary"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#EB0029] hover:bg-[#c90022] text-white ml-4"
            style={{ minWidth: 'fit-content' }}
            onClick={() => setIsModalOpen(true)}
          >
            Registrar transacción
          </Button>
          {/* Modal for transaction registration */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <div className="px-2 pt-6 pb-2">
              <h2 className="text-2xl font-bold text-[#23272F] mb-8 text-center">Registrar transacción</h2>
              <form
                className="flex flex-col gap-6 bg-white max-w-[440px] min-w-[260px] mx-auto"
                style={{ boxSizing: 'border-box' }}
                onSubmit={handleSubmit}
              >
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[16px] font-bold text-[#23272F] mb-1">Monto</label>
                    <Input
                      name="monto"
                      type="number"
                      value={form.monto}
                      onChange={handleInputChange}
                      required
                      min={1}
                      step="0.01"
                      placeholder="Ingresa el monto"
                      disabled={submitting}
                      className="text-[16px] font-medium placeholder:text-[#A0A4A8] bg-[#F7F8FA] border border-[#E5E7EB] focus:border-[#EB0029] rounded-lg px-4 py-3 transition shadow-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[16px] font-bold text-[#23272F] mb-1">Categoría</label>
                    <div className="relative">
                      <select
                        name="categoria"
                        value={form.categoria}
                        onChange={handleInputChange}
                        className="w-full h-[44px] bg-[#F7F8FA] border border-[#E5E7EB] focus:border-[#EB0029] rounded-lg px-4 text-[16px] font-medium text-[#23272F] transition appearance-none shadow-sm"
                        required
                        disabled={submitting}
                        style={{ fontFamily: 'Gotham, sans-serif' }}
                      >
                        {categorias.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A4A8] text-lg">▼</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[16px] font-bold text-[#23272F] mb-1">Descripción</label>
                    <Input
                      name="descripcion"
                      value={form.descripcion}
                      onChange={handleInputChange}
                      required
                      maxLength={60}
                      placeholder="Ej. Pago de recibo de luz"
                      disabled={submitting}
                      className="text-[16px] font-medium placeholder:text-[#A0A4A8] bg-[#F7F8FA] border border-[#E5E7EB] focus:border-[#EB0029] rounded-lg px-4 py-3 transition shadow-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[16px] font-bold text-[#23272F] mb-1">Fecha</label>
                    <Input
                      name="fecha"
                      type="date"
                      value={form.fecha}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                      alwaysFloatLabel
                      className="text-[16px] font-medium bg-[#F7F8FA] border border-[#E5E7EB] focus:border-[#EB0029] rounded-lg px-4 py-3 transition shadow-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-[#F0F1F3]">
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting} className="min-w-[120px] text-[16px] font-semibold border border-[#A0A4A8] text-[#23272F] bg-white hover:bg-gray-100 rounded-lg py-2">
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" disabled={submitting} className="min-w-[120px] text-[16px] font-semibold bg-[#EB0029] hover:bg-[#c90022] rounded-lg py-2">
                    {submitting ? "Registrando..." : "Registrar"}
                  </Button>
                </div>
              </form>
            </div>
          </Modal>
        </div>
        {/* Only the filter buttons and transaction list below, no extra heading */}
        <TransactionList />
      </main>
    </div>
  );
}
