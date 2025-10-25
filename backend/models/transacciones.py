from datetime import datetime
from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship

# -----------------
# Modelo TRANSACCIONES
# -----------------

class TransaccionBase(SQLModel):
    cliente_id: int
    monto: float
    categoria: Optional[str] = None
    descripcion: Optional[str] = None
    fecha: Optional[datetime] = None

class Transaccion(TransaccionBase, table=True):
    __tablename__ = "transacciones"
    
    id: Optional[int] = Field(default=None, primary_key=True)

class TransaccionCreate(TransaccionBase):
    pass

class TransaccionRead(TransaccionBase):
    id: int
    fecha: datetime

class TransaccionUpdate(SQLModel):
    monto: Optional[float] = None
    categoria: Optional[str] = None
    descripcion: Optional[str] = None
    fecha: Optional[datetime] = None
