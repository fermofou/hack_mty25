from datetime import date
from typing import List, Optional
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import os
import ssl
from fastapi import Depends, FastAPI, HTTPException, Query , APIRouter
from sqlmodel import (
    Field,
    Relationship,
    Session,
    SQLModel,
    create_engine,
    select,
)
# ====================================================================
# 1. Configuración de la Base de Datos (Aiven + .env)
# ====================================================================

# === DB CONFIG ===

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("Missing DATABASE_URL in .env")

# Make sure the URL uses asyncpg
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)


# Path to your downloaded Aiven CA certificate
CA_FILE = "ca.pem"


# Create an SSL context that uses your CA
ssl_context = ssl.create_default_context(cafile=CA_FILE)

# Create the async engine with SSL
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    connect_args={"ssl": ssl_context},
)

# Create a session factory
AsyncSessionLocal = sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession
)

# Dependency for FastAPI
async def get_session():
    async with AsyncSessionLocal() as session:
        yield session

 
# ====================================================================
# 2. Inicialización de FastAPI
# ====================================================================

app = FastAPI(
    title="API de Créditos Verdes (Hackathon)",
    description="CRUD completo para el proyecto de finanzas sustentables.",
)

router = APIRouter()


# --- SE ELIMINÓ EL EVENTO on_startup Y create_db_and_tables ---


# ====================================================================
# 3. Definición de Modelos (SQLModel / Pydantic)
#
# NOTA: Usamos strings para las referencias de tipo ("Credito", "Cliente")
# para evitar errores de "Forward Reference" (referencias circulares).
# ====================================================================

# -----------------
# Modelo CLIENTES
# -----------------

class ClienteBase(SQLModel):
    nombre: str
    apellido: str
    username: str = Field(unique=True, index=True)
    edad: Optional[int] = Field(default=None, gt=0)
    fecha_nacimiento: Optional[date] = None
    saldo: float = Field(default=0.0)
    credit_score: Optional[float] = Field(default=None, ge=0, le=1)
    ciudad: Optional[str] = None

class Cliente(ClienteBase, table=True):
    __tablename__ = "clientes"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    pwd: str
    
    # Relación: Un cliente puede tener muchos créditos
    creditos: List["Credito"] = Relationship(back_populates="cliente")

class ClienteCreate(ClienteBase):
    pwd: str # Al crear, pedimos la contraseña

class ClienteRead(ClienteBase):
    id: int # Al leer, NO devolvemos la contraseña

class ClienteUpdate(SQLModel):
    # Modelo para actualizar, todos los campos son opcionales
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    edad: Optional[int] = None
    fecha_nacimiento: Optional[date] = None
    saldo: Optional[float] = None
    credit_score: Optional[float] = None
    ciudad: Optional[str] = None

# -----------------
# Modelo ITEMS
# -----------------

class ItemBase(SQLModel):
    nombre: str
    precio: float
    link: Optional[str] = None
    img_link: Optional[str] = None
    categoria: Optional[str] = None

class Item(ItemBase, table=True):
    __tablename__ = "items"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Relación: Un item puede estar en muchos créditos
    creditos: List["Credito"] = Relationship(back_populates="item")

class ItemCreate(ItemBase):
    pass

class ItemRead(ItemBase):
    id: int

class ItemUpdate(SQLModel):
    nombre: Optional[str] = None
    precio: Optional[float] = None
    link: Optional[str] = None
    img_link: Optional[str] = None
    categoria: Optional[str] = None

# -----------------
# Modelo ADMIN
# -----------------

class AdminBase(SQLModel):
    nombre: str
    apellido: str
    username: str = Field(unique=True)

class Admin(AdminBase, table=True):
    __tablename__ = "admin"
    
    # Tu schema usa id_admin, así que lo respetamos
    id_admin: Optional[int] = Field(default=None, primary_key=True)
    pwd: str

class AdminCreate(AdminBase):
    pwd: str # Al crear, pedimos la contraseña

class AdminRead(AdminBase):
    id_admin: int # Al leer, NO devolvemos la contraseña

class AdminUpdate(SQLModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None

# -----------------
# Modelo CREDITOS
# -----------------

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
    
    # Foreign Keys
    cliente_id: int = Field(foreign_key="clientes.id")
    item_id: Optional[int] = Field(default=None, foreign_key="items.id")

class Credito(CreditoBase, table=True):
    __tablename__ = "creditos"
    
    # Tu schema usa id_cred, así que lo respetamos
    id_cred: Optional[int] = Field(default=None, primary_key=True)
    fecha_inicio: date = Field(default_factory=date.today)
    
    # Relaciones: Un crédito pertenece a UN cliente y a UN item
    cliente: "Cliente" = Relationship(back_populates="creditos")
    item: Optional["Item"] = Relationship(back_populates="creditos")

class CreditoCreate(CreditoBase):
    pass # Hereda todos los campos necesarios de CreditoBase

class CreditoRead(CreditoBase):
    id_cred: int
    fecha_inicio: date

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


# ====================================================================
# 4. Endpoints CRUD para CLIENTES
# ====================================================================

@app.post("/clientes/", response_model=ClienteRead, tags=["Clientes"])
async def create_cliente(
    cliente_in: ClienteCreate, session: AsyncSession = Depends(get_session)
):
    """Crea un nuevo cliente."""
    # Hashing simple para hackathon. En producción: usar passlib
    hashed_pwd = cliente_in.pwd + "_hackathon_hash"
    
    cliente_data = cliente_in.dict()
    cliente_data["pwd"] = hashed_pwd
    
    db_cliente = Cliente(**cliente_data)
    
    session.add(db_cliente)
    await session.commit()
    await session.refresh(db_cliente)
    return db_cliente


@router.get("/clientes/", response_model=List[ClienteRead])
async def read_clientes(skip: int = 0, limit: int = 100, session: AsyncSession = Depends(get_session)):
    statement = select(Cliente).offset(skip).limit(limit)
    result = await session.execute(statement)  # <-- use execute, not exec
    clientes = result.scalars().all()          # <-- scalars() unwraps ORM objects
    return clientes



@app.get("/clientes/{cliente_id}", response_model=ClienteRead, tags=["Clientes"])
async def read_cliente(cliente_id: int, session: AsyncSession = Depends(get_session)):
    """Lee un cliente específico por ID."""
    db_cliente = await session.get(Cliente, cliente_id)
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_cliente


@app.patch("/clientes/{cliente_id}", response_model=ClienteRead, tags=["Clientes"])
async def update_cliente(
    cliente_id: int,
    cliente_in: ClienteUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Actualiza un cliente."""
    db_cliente = await session.get(Cliente, cliente_id)
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    update_data = cliente_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_cliente, key, value)
    
    session.add(db_cliente)
    await session.commit()
    await session.refresh(db_cliente)
    return db_cliente


@app.delete("/clientes/{cliente_id}", tags=["Clientes"])
async def delete_cliente(cliente_id: int, session: AsyncSession = Depends(get_session)):
    """Elimina un cliente."""
    db_cliente = await session.get(Cliente, cliente_id)
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    await session.delete(db_cliente)
    await session.commit()
    return {"ok": True, "detail": "Cliente eliminado"}


# ====================================================================
# 5. Endpoints CRUD para ITEMS
# ====================================================================

@app.post("/items/", response_model=ItemRead, tags=["Items"])
async def create_item(
    item_in: ItemCreate, session: AsyncSession = Depends(get_session)
):
    """Crea un nuevo item (producto verde)."""
    db_item = Item.from_orm(item_in)
    session.add(db_item)
    await session.commit()
    await session.refresh(db_item)
    return db_item


@app.get("/items/", response_model=List[ItemRead], tags=["Items"])
async def read_items(
    skip: int = 0, limit: int = 100, session: AsyncSession = Depends(get_session)
):
    """Lee una lista de items."""
    statement = select(Item).offset(skip).limit(limit)
    result = await session.execute(statement)   # <-- use execute()
    items = result.scalars().all()              
    return items


@app.get("/items/{item_id}", response_model=ItemRead, tags=["Items"])
async def read_item(item_id: int, session: AsyncSession = Depends(get_session)):
    """Lee un item específico por ID."""
    db_item = await session.get(Item, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return db_item


@app.patch("/items/{item_id}", response_model=ItemRead, tags=["Items"])
async def update_item(
    item_id: int,
    item_in: ItemUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Actualiza un item."""
    db_item = await session.get(Item, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    update_data = item_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    
    session.add(db_item)
    await session.commit()
    await session.refresh(db_item)
    return db_item


@app.delete("/items/{item_id}", tags=["Items"])
async def delete_item(item_id: int, session: AsyncSession = Depends(get_session)):
    """Elimina un item."""
    db_item = await session.get(Item, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    await session.delete(db_item)
    await session.commit()
    return {"ok": True, "detail": "Item eliminado"}


# ====================================================================
# 6. Endpoints CRUD para ADMIN
# ====================================================================

@app.post("/admin/", response_model=AdminRead, tags=["Admins"])
async def create_admin(
    admin_in: AdminCreate, session: AsyncSession = Depends(get_session)
):
    """Crea un nuevo administrador."""
    hashed_pwd = admin_in.pwd + "_hackathon_hash"
    
    admin_data = admin_in.dict()
    admin_data["pwd"] = hashed_pwd
    
    db_admin = Admin(**admin_data)
    
    session.add(db_admin)
    await session.commit()
    await session.refresh(db_admin)
    return db_admin


@app.get("/admin/", response_model=List[AdminRead], tags=["Admins"])
async def read_admins(
    skip: int = 0, limit: int = 100, session: AsyncSession = Depends(get_session)
):
    """Lee una lista de administradores."""
    statement = select(Admin).offset(skip).limit(limit)
    result = await session.execute(statement)
    admins = result.scalars().all()
    return admins


@app.get("/admin/{admin_id}", response_model=AdminRead, tags=["Admins"])
async def read_admin(admin_id: int, session: AsyncSession = Depends(get_session)):
    """Lee un admin específico por ID."""
    db_admin = await session.get(Admin, admin_id)
    if not db_admin:
        raise HTTPException(status_code=404, detail="Admin no encontrado")
    return db_admin


@app.patch("/admin/{admin_id}", response_model=AdminRead, tags=["Admins"])
async def update_admin(
    admin_id: int,
    admin_in: AdminUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Actualiza un admin."""
    db_admin = await session.get(Admin, admin_id)
    if not db_admin:
        raise HTTPException(status_code=44, detail="Admin no encontrado")
    
    update_data = admin_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_admin, key, value)
    
    session.add(db_admin)
    await session.commit()
    await session.refresh(db_admin)
    return db_admin


@app.delete("/admin/{admin_id}", tags=["Admins"])
async def delete_admin(admin_id: int, session: AsyncSession = Depends(get_session)):
    """Elimina un admin."""
    db_admin = await session.get(Admin, admin_id)
    if not db_admin:
        raise HTTPException(status_code=404, detail="Admin no encontrado")
    
    await session.delete(db_admin)
    await session.commit()
    return {"ok": True, "detail": "Admin eliminado"}


# ====================================================================
# 7. Endpoints CRUD para CREDITOS
# ====================================================================

@app.post("/creditos/", response_model=CreditoRead, tags=["Creditos"])
async def create_credito(
    credito_in: CreditoCreate, session: AsyncSession = Depends(get_session)
):
    """Crea un nuevo crédito verde."""
    # Valida que el cliente exista
    cliente = await session.get(Cliente, credito_in.cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail=f"No se puede crear crédito: Cliente con id {credito_in.cliente_id} no existe.")

    # Valida que el item exista (si se proporciona)
    if credito_in.item_id:
        item = await session.get(Item, credito_in.item_id)
        if not item:
            raise HTTPException(status_code=404, detail=f"No se puede crear crédito: Item con id {credito_in.item_id} no existe.")

    db_credito = Credito.from_orm(credito_in)
    session.add(db_credito)
    await session.commit()
    await session.refresh(db_credito)
    return db_credito


@app.get("/creditos/", response_model=List[CreditoRead], tags=["Creditos"])
async def read_creditos(
    skip: int = 0, limit: int = 100, session: AsyncSession = Depends(get_session)
):
    """Lee una lista de créditos."""
    statement = select(Credito).offset(skip).limit(limit)
    result = await session.execute(statement)
    creditos = result.scalars().all()
    return creditos


@app.get("/creditos/{credito_id}", response_model=CreditoRead, tags=["Creditos"])
async def read_credito(credito_id: int, session: AsyncSession = Depends(get_session)):
    """Lee un crédito específico por ID (id_cred)."""
    db_credito = await session.get(Credito, credito_id)
    if not db_credito:
        raise HTTPException(status_code=404, detail="Credito no encontrado")
    return db_credito


@app.patch("/creditos/{credito_id}", response_model=CreditoRead, tags=["Creditos"])
async def update_credito(
    credito_id: int,
    credito_in: CreditoUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Actualiza un crédito."""
    db_credito = await session.get(Credito, credito_id)
    if not db_credito:
        raise HTTPException(status_code=404, detail="Credito no encontrado")
    
    update_data = credito_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_credito, key, value)
    
    session.add(db_credito)
    await session.commit()
    await session.refresh(db_credito)
    return db_credito


@app.delete("/creditos/{credito_id}", tags=["Creditos"])
async def delete_credito(credito_id: int, session: AsyncSession = Depends(get_session)):
    """Elimina un crédito."""
    db_credito = await session.get(Credito, credito_id)
    if not db_credito:
        raise HTTPException(status_code=404, detail="Credito no encontrado")
    
    await session.delete(db_credito)
    await session.commit()
    return {"ok": True, "detail": "Credito eliminado"}