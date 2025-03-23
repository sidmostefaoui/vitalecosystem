"""FastAPI backend for VITALECOSYSTEM's internal management system."""

import re
import sqlite3
import os
from pydantic import BaseModel, validator, Field
from datetime import date, datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

# Database connection setup
def get_db():
    """Get a database connection."""
    db_path = "db/db.sqlite"
    if not os.path.exists(db_path):
        raise HTTPException(status_code=500, detail=f"Database file not found: {db_path}")
    
    # Add check_same_thread=False to allow SQLite connections across different threads
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    try:
        yield conn
    finally:
        conn.close()

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
    },
    "notifications": {
        "total": 3
    }
}

mock_clients = []
mock_factures = []

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

class Facture(BaseModel):
    client_id: int
    numero: str
    date_emission: date
    date_echeance: date
    montant: float
    statut: str
    description: Optional[str] = None

# Agent model
class Agent(BaseModel):
    id: Optional[int] = None
    nom: str
    telephone: str
    whatsapp: str
    gps: str
    regime: str = Field(..., description="Peut être 'Forfait', 'Réel', ou 'Forfait & Réel'")
    notification: str = Field(..., description="Peut être 'Actif' ou 'Pause'")

    @validator('telephone', 'whatsapp')
    def validate_phone(cls, v):
        if not re.match(r'^0\d{9}$', v):
            raise HTTPException(status_code=400, detail="Le numéro de téléphone doit commencer par 0 et contenir 10 chiffres")
        return v

    @validator('gps')
    def validate_gps(cls, v):
        # Format attendu: "latitude,longitude" avec 5 décimales chacun
        gps_pattern = r'^(-?\d+\.\d{5}),\s*(-?\d+\.\d{5})$'
        if not re.match(gps_pattern, v):
            raise HTTPException(
                status_code=400, 
                detail="Format GPS invalide. Utilisez le format latitude,longitude avec 5 décimales (ex: 36.75234, 3.04215)"
            )
        return v

    @validator('regime')
    def validate_regime(cls, v):
        valid_regimes = ['Forfait', 'Réel', 'Forfait & Réel']
        if v not in valid_regimes:
            raise HTTPException(
                status_code=400,
                detail=f"Régime invalide. Valeurs acceptées: {', '.join(valid_regimes)}"
            )
        return v

    @validator('notification')
    def validate_notification(cls, v):
        valid_notifications = ['Actif', 'Pause']
        if v not in valid_notifications:
            raise HTTPException(
                status_code=400,
                detail=f"État de notification invalide. Valeurs acceptées: {', '.join(valid_notifications)}"
            )
        return v

    class Config:
        schema_extra = {
            "example": {
                "nom": "Ahmed Kader",
                "telephone": "0555123456",
                "whatsapp": "0555123456",
                "gps": "36.75234, 3.04215",
                "regime": "Forfait",
                "notification": "Actif"
            }
        }

# API Endpoints
@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    return mock_stats

# Client endpoints
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

# Facture endpoints
@app.get("/api/factures")
async def get_factures():
    return mock_factures

@app.post("/api/factures")
async def create_facture(facture: Facture):
    facture_dict = facture.dict()
    facture_dict["id"] = len(mock_factures) + 1
    mock_factures.append(facture_dict)
    return facture_dict

@app.delete("/api/factures/{facture_id}")
async def delete_facture(facture_id: int):
    global mock_factures
    mock_factures = [f for f in mock_factures if f["id"] != facture_id]
    return {"message": "Facture supprimée"}

# Agent endpoints
@app.get("/api/agents", response_model=List[Agent])
async def get_agents(conn = Depends(get_db)):
    """Get all agents."""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Agents")
        agents = cursor.fetchall()
        
        # Convert to list of dicts for Pydantic model
        return [dict(agent) for agent in agents]
    except Exception as e:
        # Log the error for server-side debugging
        print(f"Error fetching agents: {str(e)}")
        # Return a user-friendly error
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.get("/api/agents/{agent_id}", response_model=Agent)
async def get_agent(agent_id: int, conn = Depends(get_db)):
    """Get a specific agent by ID."""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Agents WHERE id = ?", (agent_id,))
        agent = cursor.fetchone()
        
        if agent is None:
            raise HTTPException(status_code=404, detail=f"Agent avec ID {agent_id} non trouvé")
        
        return dict(agent)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching agent {agent_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.post("/api/agents", response_model=Agent)
async def create_agent(agent: Agent, conn = Depends(get_db)):
    """Create a new agent."""
    try:
        cursor = conn.cursor()
        
        # Get next ID
        cursor.execute("SELECT MAX(id) FROM Agents")
        max_id = cursor.fetchone()[0]
        next_id = 1 if max_id is None else max_id + 1
        
        # Insert the new agent
        cursor.execute("""
            INSERT INTO Agents (id, nom, telephone, whatsapp, gps, regime, notification)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            next_id,
            agent.nom,
            agent.telephone,
            agent.whatsapp,
            agent.gps,
            agent.regime,
            agent.notification
        ))
        
        conn.commit()
        
        # Return the created agent with its ID
        return {**agent.dict(), "id": next_id}
    except Exception as e:
        print(f"Error creating agent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.put("/api/agents/{agent_id}", response_model=Agent)
async def update_agent(agent_id: int, agent: Agent, conn = Depends(get_db)):
    """Update an existing agent."""
    try:
        cursor = conn.cursor()
        
        # Check if agent exists
        cursor.execute("SELECT id FROM Agents WHERE id = ?", (agent_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail=f"Agent avec ID {agent_id} non trouvé")
        
        # Update the agent
        cursor.execute("""
            UPDATE Agents
            SET nom = ?, telephone = ?, whatsapp = ?, gps = ?, regime = ?, notification = ?
            WHERE id = ?
        """, (
            agent.nom,
            agent.telephone,
            agent.whatsapp,
            agent.gps,
            agent.regime,
            agent.notification,
            agent_id
        ))
        
        conn.commit()
        
        # Return the updated agent
        return {**agent.dict(), "id": agent_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating agent {agent_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.delete("/api/agents/{agent_id}")
async def delete_agent(agent_id: int, conn = Depends(get_db)):
    """Delete an agent."""
    try:
        cursor = conn.cursor()
        
        # Check if agent exists
        cursor.execute("SELECT id FROM Agents WHERE id = ?", (agent_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail=f"Agent avec ID {agent_id} non trouvé")
        
        # Delete the agent
        cursor.execute("DELETE FROM Agents WHERE id = ?", (agent_id,))
        conn.commit()
        
        return {"message": f"Agent avec ID {agent_id} supprimé avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting agent {agent_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")
