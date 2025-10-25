import type { Credito, ClienteAlerta, AhorroTotal } from "./types";

// Calculate months since start date
export function calcularMesesDesdeInicio(fechaInicio: string): number {
  const inicio = new Date(fechaInicio);
  const ahora = new Date();
  const diffTime = ahora.getTime() - inicio.getTime();
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
  return Math.max(0, diffMonths);
}

// Calculate expected payment based on loan terms
export function calcularPagoEsperado(credito: Credito): number {
  const mesesTranscurridos = calcularMesesDesdeInicio(credito.fecha_inicio);
  const pagoMensual =
    (credito.prestamo * (1 + credito.interes / 100)) / credito.meses_originales;
  return pagoMensual * mesesTranscurridos;
}

// Check if client is behind on payments
export function estaAtrasadoEnPagos(credito: Credito): boolean {
  const pagoEsperado = calcularPagoEsperado(credito);
  return pagoEsperado > credito.pagado;
}

// Get clients with payment alerts
export function obtenerClientesConAlertas(
  creditos: Credito[]
): ClienteAlerta[] {
  return creditos
    .filter(
      (credito) => credito.estado === "ACEPTADO" && estaAtrasadoEnPagos(credito)
    )
    .map((credito) => {
      const pagoEsperado = calcularPagoEsperado(credito);
      return {
        nombre: `Cliente ${credito.cliente_id}`,
        cliente_id: credito.cliente_id,
        id_cred: credito.id_cred,
        descripcion: credito.descripcion,
        pagoEsperado: Math.round(pagoEsperado),
        pagadoActual: credito.pagado,
        diferencia: Math.round(pagoEsperado - credito.pagado),
      };
    });
}

// Calculate total interest earned
export function calcularInteresGanado(creditos: Credito[]): number {
  return creditos
    .filter((c) => c.estado === "ACEPTADO")
    .reduce((total, credito) => {
      const interesTotal = credito.prestamo * (credito.interes / 100);
      const porcentajePagado =
        credito.pagado / (credito.prestamo * (1 + credito.interes / 100));
      return total + interesTotal * porcentajePagado;
    }, 0);
}

// Calculate savings for green credits
export function calcularAhorrosPorCredito(creditos: Credito[]): AhorroTotal[] {
  return creditos
    .filter((c) => c.estado === "ACEPTADO" && c.gasto_inicial_mes > 0)
    .map((credito) => {
      const ahorroMensual = credito.gasto_inicial_mes - credito.gasto_final_mes;
      const ahorroAnual = ahorroMensual * 12;
      const ahorroTotal10Anos = ahorroAnual * 10;

      return {
        id_cred: credito.id_cred,
        descripcion: credito.descripcion,
        ahorroMensual,
        ahorroAnual,
        ahorroTotal10Anos,
      };
    });
}

// Calculate percentage of clients on track with payments
export function calcularPorcentajeAlDia(creditos: Credito[]): number {
  const creditosActivos = creditos.filter((c) => c.estado === "ACEPTADO");
  if (creditosActivos.length === 0) return 100;

  const clientesAlDia = creditosActivos.filter(
    (c) => !estaAtrasadoEnPagos(c)
  ).length;
  return Math.round((clientesAlDia / creditosActivos.length) * 100);
}

// Get unique clients with active credits
export function obtenerClientesConCreditos(creditos: Credito[]): number {
  const clientesSet = new Set<number>();
  creditos.forEach((credito) => {
    if (credito.estado === "ACEPTADO") {
      clientesSet.add(credito.cliente_id);
    }
  });
  return Array.from(clientesSet).length;
}
