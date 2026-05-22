import json
from typing import List, Dict, Optional
from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """
Eres un asistente experto para un frigorífico de cerdos llamado 'J&E'. 
Tu tarea es extraer pedidos de mensajes de WhatsApp.
Debes devolver UNICAMENTE un objeto JSON con la lista de productos detectados.

Cada producto debe tener:
- "producto": nombre del corte o producto (ej: bola de lomo, bondiola, pechito).
- "cantidad": número detectado.
- "unidad": unidad de medida (kg, unidades, cajones, piezas).

Si el mensaje no parece un pedido, devuelve un objeto vacío: {"items": []}.

Ejemplo de Entrada: "Hola! Mandame 2 bondiolas, 5kg de asado y un cajon de pollo"
Ejemplo de Salida: 
{
  "items": [
    {"producto": "bondiola", "cantidad": 2, "unidad": "piezas"},
    {"producto": "asado", "cantidad": 5, "unidad": "kg"},
    {"producto": "pollo", "cantidad": 1, "unidad": "cajon"}
  ]
}
"""

async def parse_whatsapp_order(text: str) -> Dict:
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": text}
            ],
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        print(f"Error parsing AI order: {e}")
        return {"items": []}
