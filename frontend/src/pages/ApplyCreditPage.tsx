import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { UserTopBar } from "@/components/UserTopBar";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User } from "lucide-react";

interface Message {
  role: "assistant" | "user";
  content: string;
}

export default function ApplyCreditPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hola, soy tu asistente virtual de Banorte. Estoy aquí para ayudarte a solicitar un crédito. ¿Para qué necesitas el crédito?",
    },
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [creditData, setCreditData] = useState({
    purpose: "",
    amount: "",
    term: "",
    income: "",
  });

  if (!user) {
    return null;
  }

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      let assistantResponse = "";

      if (step === 0) {
        setCreditData((prev) => ({ ...prev, purpose: input }));
        assistantResponse = "Perfecto. ¿Cuánto dinero necesitas? Por favor ingresa el monto en pesos mexicanos.";
        setStep(1);
      } else if (step === 1) {
        setCreditData((prev) => ({ ...prev, amount: input }));
        assistantResponse = "Entendido. ¿En cuántos meses te gustaría pagar el crédito? (12, 24, 36, 48 o 60 meses)";
        setStep(2);
      } else if (step === 2) {
        setCreditData((prev) => ({ ...prev, term: input }));
        assistantResponse = "Excelente. Para finalizar, ¿cuál es tu ingreso mensual aproximado?";
        setStep(3);
      } else if (step === 3) {
        setCreditData((prev) => ({ ...prev, income: input }));
        assistantResponse = `Gracias por la información. He registrado tu solicitud de crédito:\n\n• Propósito: ${creditData.purpose}\n• Monto: $${creditData.amount}\n• Plazo: ${input} meses\n• Ingreso mensual: $${input}\n\nTu solicitud será revisada por nuestro equipo y recibirás una respuesta en 24-48 horas. ¿Deseas enviar la solicitud?`;
        setStep(4);
      } else if (step === 4) {
        if (
          input.toLowerCase().includes("sí") ||
          input.toLowerCase().includes("si") ||
          input.toLowerCase().includes("enviar")
        ) {
          assistantResponse =
            "¡Solicitud enviada exitosamente! Puedes revisar el estado de tu solicitud en la sección 'Mis créditos'. Te notificaremos cuando haya una actualización.";
          setTimeout(() => {
            navigate("/user/credits");
          }, 2000);
        } else {
          assistantResponse = "Entendido. Si deseas hacer cambios, puedes comenzar de nuevo o salir de esta página.";
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: assistantResponse }]);
    }, 500);

    setInput("");
  };

  return (
    <div className="min-h-screen bg-background">
      <UserTopBar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Title section - removed back button */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Solicitar crédito</h1>
          <p className="text-muted-foreground">Completa la información con nuestro asistente virtual</p>
        </div>

        {/* Chat interface */}
        <Card className="h-[600px] flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
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
                  <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#586670]">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}
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
