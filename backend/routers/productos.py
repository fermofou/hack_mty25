from fastapi import APIRouter
import http.client
import ssl
import certifi
import urllib.parse
import json
import re
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/productos", tags=["Productos"])

class ProductoResponse(BaseModel):
    nombre: str
    link: str
    img_link: str
    precio: Optional[float]

def parse_price(price_str):
    """
    Convert a price string like 'MX$3,140.50' or 'USD 1,200.75' into a float.
    Returns None if parsing fails.
    """
    if not price_str:
        return None
    # Remove all non-digit, non-dot, non-comma characters
    cleaned = re.sub(r"[^\d.,]", "", price_str)
    # If both comma and dot exist, assume dot is decimal separator
    if "." in cleaned and "," in cleaned:
        cleaned = cleaned.replace(",", "")
    # If only comma exists, assume it's decimal separator
    elif "," in cleaned and "." not in cleaned:
        cleaned = cleaned.replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None

def buscar_productos(query, page=1, country="mx"):
    # Use certifi's CA bundle for SSL verification
    context = ssl.create_default_context(cafile=certifi.where())
    conn = http.client.HTTPSConnection("product-search-api.p.rapidapi.com", context=context)

    payload = urllib.parse.urlencode({
        "query": query,
        "page": page,
        "country": country
    })

    headers = {
        'x-rapidapi-key': "ae5dfb3c2amsh0245873f3cc2ae5p1dd10cjsn99b478674369",
        'x-rapidapi-host': "product-search-api.p.rapidapi.com",
        'Content-Type': "application/x-www-form-urlencoded"
    }

    conn.request("POST", "/shopping", payload, headers)
    res = conn.getresponse()
    data = res.read()

    products_data = json.loads(data.decode("utf-8")).get("products", [])

    simplified_products = [
        {
            "nombre": p.get("title", ""),
            "link": p.get("link", ""),
            "img_link": p.get("imageUrl", ""),
            "precio": parse_price(p.get("price", ""))
        }
        for p in products_data[:20]
    ]

    return simplified_products

@router.get("/buscar/", response_model=List[ProductoResponse])
async def buscar_productos_endpoint(
    query: str,
    page: int = 1,
    country: str = "mx"
):
    """
    Busca productos usando la API externa.
    
    - **query**: Término de búsqueda
    - **page**: Número de página (por defecto 1)
    - **country**: País de búsqueda (por defecto "mx")
    """
    return buscar_productos(query, page, country)