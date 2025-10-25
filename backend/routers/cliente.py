from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlmodel import select, or_
from datetime import date, datetime, timedelta
from pydantic import BaseModel

from config import get_session
from models.cliente import Cliente, ClienteCreate, ClienteRead, ClienteUpdate
from models.transacciones import Transaccion, TransaccionRead
from models.credito import Credito
from models.item import Item

router = APIRouter(prefix="/clientes", tags=["Clientes"])


# Endpoint to get monthly expenses by category over the last 12 months
@router.get("/{cliente_id}/monthly_expenses", tags=["Transacciones"])
async def get_monthly_expenses(
    cliente_id: int, session: AsyncSession = Depends(get_session)
):
    """
    Returns monthly expenses by category for the last 12 months.

    Response structure:
    {
        "category_name": {
            "monthly_expenses": [
                {"month": "2024-11", "amount": 1500.50},
                {"month": "2024-12", "amount": 1600.75},
                ...
            ],
            "average": 1550.25,
            "total": 18603.00
        },
        ...
    }
    """
    today = datetime.now()
    twelve_months_ago = today - timedelta(days=365)

    # Get all transactions from the last 12 months
    statement = select(Transaccion).where(
        Transaccion.cliente_id == cliente_id, Transaccion.fecha >= twelve_months_ago
    )
    result = await session.execute(statement)
    transacciones = result.scalars().all()

    # Organize expenses by category and month
    expenses_by_category = {}

    for t in transacciones:
        if t.categoria:
            # Format month as YYYY-MM
            month_key = t.fecha.strftime("%Y-%m")

            if t.categoria not in expenses_by_category:
                expenses_by_category[t.categoria] = {}

            if month_key not in expenses_by_category[t.categoria]:
                expenses_by_category[t.categoria][month_key] = 0

            expenses_by_category[t.categoria][month_key] += t.monto

    # Build the response with monthly breakdown and statistics
    response = {}
    for categoria, monthly_data in expenses_by_category.items():
        monthly_expenses = [
            {"month": month, "amount": amount}
            for month, amount in sorted(monthly_data.items())
        ]

        total = sum(monthly_data.values())
        average = total / len(monthly_data) if monthly_data else 0

        response[categoria] = {
            "monthly_expenses": monthly_expenses,
            "average": round(average, 2),
            "total": round(total, 2),
        }

    return response


# Endpoint para cambiar el estado de un crédito a ACEPTADO
@router.patch("/{cliente_id}/creditos/{credito_id}/aceptar")
async def aceptar_credito_cliente(
    cliente_id: int, credito_id: int, session: AsyncSession = Depends(get_session)
):
    credito = await session.get(Credito, credito_id)
    if not credito or credito.cliente_id != cliente_id:
        raise HTTPException(
            status_code=404, detail="Crédito no encontrado para este cliente"
        )
    credito.estado = "ACEPTADO"
    session.add(credito)
    await session.commit()
    await session.refresh(credito)
    return {"ok": True, "id_cred": credito.id_cred, "nuevo_estado": credito.estado}


# Endpoint para cambiar el estado de un crédito a NEGADO
@router.patch("/{cliente_id}/creditos/{credito_id}/negar")
async def negar_credito_cliente(
    cliente_id: int, credito_id: int, session: AsyncSession = Depends(get_session)
):
    credito = await session.get(Credito, credito_id)
    if not credito or credito.cliente_id != cliente_id:
        raise HTTPException(
            status_code=404, detail="Crédito no encontrado para este cliente"
        )
    credito.estado = "NEGADO"
    session.add(credito)
    await session.commit()
    await session.refresh(credito)
    return {"ok": True, "id_cred": credito.id_cred, "nuevo_estado": credito.estado}


# Helper para armar la respuesta de créditos
async def build_creditos_response(creditos, session):
    response = []
    for credito in creditos:
        cliente = await session.get(Cliente, credito.cliente_id)
        item = await session.get(Item, credito.item_id) if credito.item_id else None
        response.append(
            {
                "credito": {
                    "id_cred": credito.id_cred,
                    "prestamo": credito.prestamo,
                    "interes": credito.interes,
                    "meses_originales": credito.meses_originales,
                    "categoria": credito.categoria,
                    "descripcion": credito.descripcion,
                    "gasto_inicial_mes": credito.gasto_inicial_mes,
                    "gasto_final_mes": credito.gasto_final_mes,
                },
                "cliente": {
                    "nombre": cliente.nombre,
                    "apellido": cliente.apellido,
                    "edad": cliente.edad,
                    "fecha_nacimiento": cliente.fecha_nacimiento,
                    "saldo": cliente.saldo,
                    "credit_score": cliente.credit_score,
                }
                if cliente
                else None,
                "item": {
                    "nombre": item.nombre,
                    "link": item.link,
                    "img_link": item.img_link,
                    "precio": item.precio,
                }
                if item
                else None,
            }
        )
    return response


# Endpoint para todos los créditos del usuario
@router.get("/{cliente_id}/creditos", tags=["Creditos"])
async def get_all_creditos_cliente(
    cliente_id: int, session: AsyncSession = Depends(get_session)
):
    statement = select(Credito).where(Credito.cliente_id == cliente_id)
    result = await session.execute(statement)
    creditos = result.scalars().all()
    return await build_creditos_response(creditos, session)


# Endpoint para créditos por estado
def creditos_estado_endpoint(estado):
    async def endpoint(cliente_id: int, session: AsyncSession = Depends(get_session)):
        statement = select(Credito).where(
            Credito.cliente_id == cliente_id, Credito.estado == estado
        )
        result = await session.execute(statement)
        creditos = result.scalars().all()
        return await build_creditos_response(creditos, session)

    return endpoint


@router.get("/{cliente_id}/creditos/aceptado", tags=["Creditos"])
async def get_creditos_aceptado(
    cliente_id: int, session: AsyncSession = Depends(get_session)
):
    return await creditos_estado_endpoint("ACEPTADO")(cliente_id, session)


@router.get("/{cliente_id}/creditos/aprovado", tags=["Creditos"])
async def get_creditos_aprovado(
    cliente_id: int, session: AsyncSession = Depends(get_session)
):
    return await creditos_estado_endpoint("APROBADO")(cliente_id, session)


@router.get("/{cliente_id}/creditos/negado", tags=["Creditos"])
async def get_creditos_negado(
    cliente_id: int, session: AsyncSession = Depends(get_session)
):
    return await creditos_estado_endpoint("NEGADO")(cliente_id, session)


@router.get("/{cliente_id}/creditos/pendiente", tags=["Creditos"])
async def get_creditos_pendiente(
    cliente_id: int, session: AsyncSession = Depends(get_session)
):
    return await creditos_estado_endpoint("PENDIENTE")(cliente_id, session)


class ClienteSignup(BaseModel):
    nombre: str
    apellido: str
    username: str
    fecha_nacimiento: date
    pwd: str
    saldo: float = 0.0
    credit_score: float = None
    ciudad: str = None


@router.post("/signup", response_model=ClienteRead)
async def cliente_signup(
    cliente_in: ClienteSignup, session: AsyncSession = Depends(get_session)
):
    result = await session.execute(
        select(Cliente).where(Cliente.username == cliente_in.username)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    # Calcular edad
    today = date.today()
    edad = (
        today.year
        - cliente_in.fecha_nacimiento.year
        - (
            (today.month, today.day)
            < (cliente_in.fecha_nacimiento.month, cliente_in.fecha_nacimiento.day)
        )
    )
    cliente_data = cliente_in.dict()
    cliente_data["edad"] = edad
    db_cliente = Cliente(**cliente_data)
    session.add(db_cliente)
    await session.commit()
    await session.refresh(db_cliente)
    return db_cliente


# Login endpoint para Cliente
class ClienteLogin(BaseModel):
    username: str
    pwd: str


@router.post("/login", response_model=ClienteRead)
async def cliente_login(
    login: ClienteLogin, session: AsyncSession = Depends(get_session)
):
    statement = select(Cliente).where(
        Cliente.username == login.username, Cliente.pwd == login.pwd
    )
    result = await session.execute(statement)
    cliente = result.scalar_one_or_none()
    if not cliente:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    return cliente


@router.post("/", response_model=ClienteRead)
async def create_cliente(
    cliente_in: ClienteCreate, session: AsyncSession = Depends(get_session)
):
    result = await session.execute(
        select(Cliente).where(Cliente.username == cliente_in.username)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    cliente_data = cliente_in.dict()
    db_cliente = Cliente(**cliente_data)
    session.add(db_cliente)
    await session.commit()
    await session.refresh(db_cliente)
    return db_cliente


@router.get("/", response_model=List[ClienteRead])
async def read_clientes(
    skip: int = 0, limit: int = 100, session: AsyncSession = Depends(get_session)
):
    statement = select(Cliente).offset(skip).limit(limit)
    result = await session.execute(statement)
    return result.scalars().all()


@router.get("/{cliente_id}", response_model=ClienteRead)
async def read_cliente(cliente_id: int, session: AsyncSession = Depends(get_session)):
    db_cliente = await session.get(Cliente, cliente_id)
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_cliente


@router.patch("/{cliente_id}", response_model=ClienteRead)
async def update_cliente(
    cliente_id: int,
    cliente_in: ClienteUpdate,
    session: AsyncSession = Depends(get_session),
):
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


@router.delete("/{cliente_id}")
async def delete_cliente(cliente_id: int, session: AsyncSession = Depends(get_session)):
    db_cliente = await session.get(Cliente, cliente_id)
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    await session.delete(db_cliente)
    await session.commit()
    return {"ok": True, "detail": "Cliente eliminado"}


# Endpoint para obtener todas las transacciones de un cliente
@router.get("/{cliente_id}/transacciones", response_model=List[TransaccionRead])
async def get_transacciones_cliente(
    cliente_id: int, session: AsyncSession = Depends(get_session)
):
    """Devuelve todas las transacciones correspondientes a un cliente específico."""
    statement = select(Transaccion).where(Transaccion.cliente_id == cliente_id)
    result = await session.execute(statement)
    transacciones = result.scalars().all()
    return transacciones
