import { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { UserTopBar } from "@/components/UserTopBar";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card, CardContent } from "@/components/ui/card";
import { CreditOfferCard } from "@/components/CreditOfferCard";
import { CreditOfferModal } from "@/components/CreditOfferModal";
import { Send, Bot, User, ChevronLeft } from "lucide-react";
import { Link } from 'react-router';

type Message =
  | { role: "assistant" | "user"; content: string }
  | { role: "offers"; offers: any[] };

export default function ApplyCreditPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hola, soy tu asistente virtual de Banorte. Estoy aquí para ayudarte a solicitar un crédito. ¿Para qué necesitas el crédito?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Remove creditOffers state
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Build conversation_context string from messages
  const buildConversationContext = (msgs: Message[]) => {
    return msgs
      .filter((m): m is { role: "assistant" | "user"; content: string } => "content" in m)
      .map((m) =>
        m.role === "user"
          ? `cliente: ${m.content}`
          : `AI: ${m.content}`
      )
      .join("\n");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) {
    return null;
  }

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];

  setMessages(newMessages);
  setInput(""); // Clear input immediately
  setIsLoading(true);

    try {
      const conversation_context = buildConversationContext(newMessages);
      const res = await api.post("/gemini/process", {
        last_message: input,
        conversation_context,
        user_id: user.id || 0,
      });
      const data = res.data;
      console.log("Gemini response:", data);
      if (data.response_type === "text") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.text_response }
        ]);
      } else if (data.response_type === "credit" && data.creditOffers?.creditOffers) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Te recomiendo estas opciones de crédito para: ${data.object_in_response}` },
          { role: "offers", offers: data.creditOffers.creditOffers }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "No se pudo procesar la respuesta de la IA." }
        ]);
      }
    } catch (err) {
      console.log("este fue el error", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Ocurrió un error al contactar a la IA." }
      ]);
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <UserTopBar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Title section with back button */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link
              to="/user/credits"
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-7 w-7 text-[#EB0029]" />
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Solicitar crédito</h1>
          </div>
          <p className="text-muted-foreground ml-13">Completa la información con nuestro asistente virtual</p>
        </div>

        {/* Chat interface */}
        <Card className="h-[600px] flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => {
              if (message.role === "offers") {
                return (
                  <div key={index} className="flex flex-row gap-4 justify-center mt-6">
                    {message.offers.slice(0, 3).map((offer, idx) => (
                      <CreditOfferCard
                        key={idx}
                        offer={offer}
                        onClick={() => setSelectedOffer(offer)}
                      />
                    ))}
                    {selectedOffer && (
                      <CreditOfferModal
                        offer={selectedOffer}
                        onClose={() => setSelectedOffer(null)}
                        onRequestCredit={async () => {
                          const offer = selectedOffer;
                          // 1. Create item
                          const itemPayload = {
                            nombre: offer.product.nombre,
                            precio: offer.product.precio,
                            link: offer.product.link,
                            img_link: offer.product.img_link,
                            categoria: offer.product.categoria,
                          };
                          let itemId = null;
                          try {
                            const itemRes = await api.post("/items/", itemPayload);
                            itemId = itemRes.data.id;
                          } catch (e) {
                            toast.error("Error creando el producto (item)");
                            return;
                          }
                          // 2. Create credito
                          const creditoPayload = {
                            prestamo: offer.prestamo,
                            interes: offer.interes,
                            meses_originales: offer.meses_originales,
                            deuda_acumulada: 0,
                            pagado: 0,
                            categoria: offer.product.categoria,
                            estado: "PENDIENTE",
                            descripcion: offer.descripcion,
                            gasto_inicial_mes: offer.gasto_inicial_mes,
                            gasto_final_mes: offer.gasto_final_mes,
                            cliente_id: user.id,
                            item_id: itemId,
                            // id_cred and fecha_inicio are set by backend
                          };
                          try {
                            await api.post("/creditos/", creditoPayload);
                            toast.success("¡Crédito solicitado exitosamente!");
                          } catch (e) {
                            toast.error("Error solicitando el crédito");
                          }
                        }}
                      />
                    )}
                  </div>
                );
              }
              // Normal chat message
              return (
                <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EB0029]">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === "user" ? "bg-[#EB0029] text-white" : "bg-secondary text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line leading-relaxed">{(message as any).content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#586670]">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              );
            })}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EB0029]">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-secondary text-foreground">
                  <span className="flex space-x-1">
                    <span className="bg-gray-400 rounded-full w-2 h-2 animate-bounce [animation-delay:0s]"></span>
                    <span className="bg-gray-400 rounded-full w-2 h-2 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="bg-gray-400 rounded-full w-2 h-2 animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                </div>
              </div>
            )}
            {/* Scroll anchor must be the very last child */}
            <div ref={chatEndRef} />
          </CardContent>

          {/* Input area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Escribe tu respuesta..."
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSend()}
                className="flex-1"
              />
              <Button variant="primary" onClick={handleSend} className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
