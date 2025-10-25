from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/gemini", tags=["Gemini"])

class GeminiRequest(BaseModel):
    last_message: str
    conversation_context: str
    user_id: int

@router.post("/chat")
async def gemini_chat_endpoint(request: GeminiRequest):
    """
    Endpoint que recibe el último mensaje, contexto de conversación y user_id.
    Por ahora solo retorna "hello".
    """
    return "hello"
