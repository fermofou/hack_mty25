from typing import List, Optional
from datetime import date
from sqlmodel import SQLModel, Field, Relationship


class CreditoBase(SQLModel):
    prestamo: float
    interes: float = Field(ge=0)
    meses_originales: int = Field(gt=0)
    deuda_acumulada: float = Field(default=0.0)
    pagado: float = Field(default=0.0)
    categoria: Optional[str] = None
    estado: str = Field(default="PENDIENTE")
    descripcion: Optional[str] = None
    gasto_inicial_mes: Optional[float] = None
    gasto_final_mes: Optional[float] = None
    fecha_inicio: Optional[date] = None
    oferta: Optional[bool] = Field(default=False)

    # Foreign Keys
    cliente_id: int = Field(foreign_key="clientes.id")
    item_id: Optional[int] = Field(default=None, foreign_key="items.id")


class Credito(CreditoBase, table=True):
    __tablename__ = "creditos"

    # Tu schema usa id_cred, así que lo respetamos
    id_cred: Optional[int] = Field(default=None, primary_key=True)
    fecha_inicio: Optional[date] = Field(default_factory=date.today)

    # Relaciones: Un crédito pertenece a UN cliente y a UN item
    cliente: "Cliente" = Relationship(back_populates="creditos")
    item: Optional["Item"] = Relationship(back_populates="creditos")


class CreditoCreate(CreditoBase):
    pass  # Hereda todos los campos necesarios de CreditoBase


class CreditoRead(CreditoBase):
    id_cred: int
    fecha_inicio: Optional[date] = None


class CreditoUpdate(SQLModel):
    prestamo: Optional[float] = None
    interes: Optional[float] = None
    meses_originales: Optional[int] = None
    deuda_acumulada: Optional[float] = None
    pagado: Optional[float] = None
    categoria: Optional[str] = None
    estado: Optional[str] = None
    descripcion: Optional[str] = None
    gasto_inicial_mes: Optional[float] = None
    gasto_final_mes: Optional[float] = None
    item_id: Optional[int] = None
    fecha_inicio: Optional[date] = None


class CreditoConNombreCliente(SQLModel):
    credito: CreditoRead
    cliente_nombre: str
    cliente_apellido: str
    cliente_credit_score: float
