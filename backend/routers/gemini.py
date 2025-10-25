from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from config import get_session
from models.cliente import Cliente
from models.transacciones import Transaccion

router = APIRouter(prefix="/gemini", tags=["Gemini"])

class GeminiRequest(BaseModel):
    last_message: str
    conversation_context: str
    user_id: int


async def get_conversation_context(request: GeminiRequest, session: AsyncSession) -> str:
    # Obtener datos del usuario
    user = await session.get(Cliente, request.user_id)
    if not user:
        return "Usuario no encontrado."
    user_info = f"Nombre: {user.nombre}, Apellido: {user.apellido}, Username: {user.username}, Edad: {user.edad}, Fecha de nacimiento: {user.fecha_nacimiento}, Saldo: {user.saldo}, Credit Score: {user.credit_score}, Ciudad: {user.ciudad}"

    # Obtener transacciones del usuario
    statement = select(Transaccion).where(Transaccion.cliente_id == request.user_id)
    result = await session.execute(statement)
    transacciones = result.scalars().all()
    if transacciones:
        trans_list = [
            f"ID: {t.id}, Monto: {t.monto}, Categoria: {t.categoria}, Descripcion: {t.descripcion}, Fecha: {t.fecha}" for t in transacciones
        ]
        transacciones_str = "\n".join(trans_list)
    else:
        transacciones_str = "No tiene transacciones registradas."

    # Construir contexto
    context = (
        f"Aqui estan los datos del usuario: {user_info}\n"
        f"Estas son sus transacciones: {transacciones_str}\n"
        f"Esta es la conversacion previa: {request.conversation_context}\n"
        f"Y este fue su ultimo mensaje hacia ti: {request.last_message}"
    )
    return context


@router.post("/chat")
async def gemini_chat_endpoint(request: GeminiRequest, session: AsyncSession = Depends(get_session)):
    """
    Endpoint que recibe el último mensaje, contexto de conversación y user_id.
    Retorna un contexto textual con datos del usuario, transacciones, contexto y último mensaje.
    """
    return await get_conversation_context(request, session)
