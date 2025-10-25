from typing import Optional
from pydantic import BaseModel


class ProductResponse(BaseModel):
    """
    Model to represent a product obtained from the external API.
    Not stored in database, only used for responses.
    """

    nombre: str
    link: str
    img_link: str
    precio: Optional[float] = None
