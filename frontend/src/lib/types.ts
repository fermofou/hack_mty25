// API Types based on real database structure
export interface Credito {
  prestamo: number;
  interes: number;
  meses_originales: number;
  deuda_acumulada: number;
  pagado: number;
  categoria: string;
  estado: "APROBADO" | "PENDIENTE" | "NEGADO" | "ACEPTADO";
  descripcion: string;
  gasto_inicial_mes: number;
  gasto_final_mes: number;
  cliente_id: number;
  item_id: number;
  id_cred: number;
  fecha_inicio: string;
}

// Crédito con información del cliente para admin
export interface CreditoConNombreCliente {
  credito: Credito;
  cliente_nombre: string;
  cliente_apellido: string;
  cliente_credit_score: number;
}

export interface Transaction {
  cliente_id: number;
  monto: number;
  categoria: string;
  descripcion: string;
  fecha: string;
  id: number;
}

export interface ClienteAlerta {
  nombre: string;
  cliente_id: number;
  id_cred: number;
  descripcion: string;
  pagoEsperado: number;
  pagadoActual: number;
  diferencia: number;
}

export interface AhorroTotal {
  id_cred: number;
  descripcion: string;
  ahorroMensual: number;
  ahorroAnual: number;
  ahorroTotal10Anos: number;
}
