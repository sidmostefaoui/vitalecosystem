from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel, validator
from datetime import date
import re

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data
mock_stats = {
    "total_clients": 12,
    "factures": {
        "total": 45,
        "montant_total": 67800.50
    }
}

mock_clients = []

class Client(BaseModel):
    nom: str
    specialite: str
    mode_passage: int
    dernier_passage: date
    agent: str
    tel: str
    adresse: str
    montant_mensuel: int
    date_recrutement: date

    @validator('mode_passage')
    def validate_mode_passage(cls, v):
        if not 1 <= v <= 30:
            raise HTTPException(status_code=400, detail="Le mode de passage doit être entre 1 et 30")
        return v

    @validator('tel')
    def validate_phone(cls, v):
        if not re.match(r'^0\d{9}$', v):
            raise HTTPException(status_code=400, detail="Le numéro de téléphone doit commencer par 0 et contenir 10 chiffres")
        return v

    @validator('montant_mensuel')
    def validate_montant(cls, v):
        if v <= 0:
            raise HTTPException(status_code=400, detail="Le montant mensuel doit être supérieur à 0")
        return v

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    return mock_stats

@app.get("/api/clients")
async def get_clients():
    return mock_clients

@app.post("/api/clients")
async def create_client(client: Client):
    client_dict = client.dict()
    client_dict["id"] = len(mock_clients) + 1
    mock_clients.append(client_dict)
    return client_dict

@app.delete("/api/clients/{client_id}")
async def delete_client(client_id: int):
    global mock_clients
    mock_clients = [c for c in mock_clients if c["id"] != client_id]
    return {"message": "Client supprimé"} 