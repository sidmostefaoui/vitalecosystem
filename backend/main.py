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

# Product model
class Produit(BaseModel):
    id: Optional[int] = None
    designation: str

# Service model
class Service(BaseModel):
    id: Optional[int] = None
    designation: str
    incineration: str = Field(..., description="Peut être 'Oui' ou 'Non'")
    
    @validator('incineration')
    def validate_incineration(cls, v):
        valid_values = ['Oui', 'Non']
        if v not in valid_values:
            raise HTTPException(
                status_code=400,
                detail=f"Valeur d'incinération invalide. Valeurs acceptées: {', '.join(valid_values)}"
            )
        return v

# Fournisseur model
class Fournisseur(BaseModel):
    """Fournisseur model"""
    id: Optional[int] = None
    nom: str
    telephone: str
    adresse: str

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

# Product endpoints
@app.get("/api/produits", response_model=List[Produit])
async def get_produits(conn = Depends(get_db)):
    """Get all products."""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Produit")
        produits = cursor.fetchall()
        
        # Convert to list of dicts for Pydantic model
        return [dict(produit) for produit in produits]
    except Exception as e:
        # Log the error for server-side debugging
        print(f"Error fetching products: {str(e)}")
        # Return a user-friendly error
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.post("/api/produits", response_model=Produit)
async def create_produit(produit: Produit, conn = Depends(get_db)):
    """Create a new product."""
    try:
        cursor = conn.cursor()
        
        # Check for unique designation
        cursor.execute("SELECT id FROM Produit WHERE designation = ?", (produit.designation,))
        if cursor.fetchone() is not None:
            raise HTTPException(status_code=400, detail=f"Un produit avec la désignation '{produit.designation}' existe déjà")
        
        # Get next ID
        cursor.execute("SELECT MAX(id) FROM Produit")
        max_id = cursor.fetchone()[0]
        next_id = 1 if max_id is None else max_id + 1
        
        # Insert the new product
        cursor.execute("""
            INSERT INTO Produit (id, designation)
            VALUES (?, ?)
        """, (
            next_id,
            produit.designation
        ))
        
        conn.commit()
        
        # Return the created product with its ID
        return {**produit.dict(), "id": next_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating product: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.put("/api/produits/{produit_id}", response_model=Produit)
async def update_produit(produit_id: int, produit: Produit, conn = Depends(get_db)):
    """Update an existing product."""
    try:
        cursor = conn.cursor()
        
        # Check if product exists
        cursor.execute("SELECT id FROM Produit WHERE id = ?", (produit_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail=f"Produit avec ID {produit_id} non trouvé")
        
        # Check for unique designation (excluding current product)
        cursor.execute("SELECT id FROM Produit WHERE designation = ? AND id != ?", 
                      (produit.designation, produit_id))
        if cursor.fetchone() is not None:
            raise HTTPException(status_code=400, detail=f"Un produit avec la désignation '{produit.designation}' existe déjà")
        
        # Update the product
        cursor.execute("""
            UPDATE Produit
            SET designation = ?
            WHERE id = ?
        """, (
            produit.designation,
            produit_id
        ))
        
        conn.commit()
        
        # Return the updated product
        return {**produit.dict(), "id": produit_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating product {produit_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.delete("/api/produits/{produit_id}")
async def delete_produit(produit_id: int, conn = Depends(get_db)):
    """Delete a product."""
    try:
        cursor = conn.cursor()
        
        # Check if product exists
        cursor.execute("SELECT id FROM Produit WHERE id = ?", (produit_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail=f"Produit avec ID {produit_id} non trouvé")
        
        # Delete the product
        cursor.execute("DELETE FROM Produit WHERE id = ?", (produit_id,))
        conn.commit()
        
        return {"message": f"Produit avec ID {produit_id} supprimé avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting product {produit_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

# Service endpoints
@app.get("/api/services", response_model=List[Service])
async def get_services(conn = Depends(get_db)):
    """Get all services."""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Service")
        services = cursor.fetchall()
        
        # Convert to list of dicts for Pydantic model
        return [dict(service) for service in services]
    except Exception as e:
        # Log the error for server-side debugging
        print(f"Error fetching services: {str(e)}")
        # Return a user-friendly error
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.post("/api/services", response_model=Service)
async def create_service(service: Service, conn = Depends(get_db)):
    """Create a new service."""
    try:
        cursor = conn.cursor()
        
        # Check for unique designation
        cursor.execute("SELECT id FROM Service WHERE designation = ?", (service.designation,))
        if cursor.fetchone() is not None:
            raise HTTPException(status_code=400, detail=f"Un service avec la désignation '{service.designation}' existe déjà")
        
        # Get next ID
        cursor.execute("SELECT MAX(id) FROM Service")
        max_id = cursor.fetchone()[0]
        next_id = 1 if max_id is None else max_id + 1
        
        # Insert the new service
        cursor.execute("""
            INSERT INTO Service (id, designation, incineration)
            VALUES (?, ?, ?)
        """, (
            next_id,
            service.designation,
            service.incineration
        ))
        
        conn.commit()
        
        # Return the created service with its ID
        return {**service.dict(), "id": next_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating service: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.put("/api/services/{service_id}", response_model=Service)
async def update_service(service_id: int, service: Service, conn = Depends(get_db)):
    """Update an existing service."""
    try:
        cursor = conn.cursor()
        
        # Check if service exists
        cursor.execute("SELECT id FROM Service WHERE id = ?", (service_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail=f"Service avec ID {service_id} non trouvé")
        
        # Check for unique designation (excluding current service)
        cursor.execute("SELECT id FROM Service WHERE designation = ? AND id != ?", 
                      (service.designation, service_id))
        if cursor.fetchone() is not None:
            raise HTTPException(status_code=400, detail=f"Un service avec la désignation '{service.designation}' existe déjà")
        
        # Update the service
        cursor.execute("""
            UPDATE Service
            SET designation = ?, incineration = ?
            WHERE id = ?
        """, (
            service.designation,
            service.incineration,
            service_id
        ))
        
        conn.commit()
        
        # Return the updated service
        return {**service.dict(), "id": service_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating service {service_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.delete("/api/services/{service_id}")
async def delete_service(service_id: int, conn = Depends(get_db)):
    """Delete a service."""
    try:
        cursor = conn.cursor()
        
        # Check if service exists
        cursor.execute("SELECT id FROM Service WHERE id = ?", (service_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail=f"Service avec ID {service_id} non trouvé")
        
        # Delete the service
        cursor.execute("DELETE FROM Service WHERE id = ?", (service_id,))
        conn.commit()
        
        return {"message": f"Service avec ID {service_id} supprimé avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting service {service_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

# Fournisseur endpoints
@app.get("/api/fournisseurs", response_model=List[Fournisseur])
async def get_fournisseurs(conn = Depends(get_db)):
    """Get all suppliers."""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, nom, telephone, adresse FROM Fournisseur ORDER BY id")
        rows = cursor.fetchall()
        
        fournisseurs = []
        for row in rows:
            fournisseurs.append({
                "id": row[0],
                "nom": row[1],
                "telephone": row[2],
                "adresse": row[3]
            })
        
        return fournisseurs
    except Exception as e:
        print(f"Error fetching suppliers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.get("/api/fournisseurs/{fournisseur_id}", response_model=Fournisseur)
async def get_fournisseur(fournisseur_id: int, conn = Depends(get_db)):
    """Get a single supplier by ID."""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, nom, telephone, adresse FROM Fournisseur WHERE id = ?", (fournisseur_id,))
        row = cursor.fetchone()
        
        if row is None:
            raise HTTPException(status_code=404, detail=f"Fournisseur avec ID {fournisseur_id} non trouvé")
        
        return {
            "id": row[0],
            "nom": row[1],
            "telephone": row[2],
            "adresse": row[3]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching supplier {fournisseur_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.post("/api/fournisseurs", response_model=Fournisseur)
async def create_fournisseur(fournisseur: Fournisseur, conn = Depends(get_db)):
    """Create a new supplier."""
    try:
        cursor = conn.cursor()
        
        # Check for unique name
        cursor.execute("SELECT id FROM Fournisseur WHERE nom = ?", (fournisseur.nom,))
        if cursor.fetchone() is not None:
            raise HTTPException(status_code=400, detail=f"Un fournisseur avec le nom '{fournisseur.nom}' existe déjà")
        
        # Get next ID
        cursor.execute("SELECT MAX(id) FROM Fournisseur")
        max_id = cursor.fetchone()[0]
        next_id = 1 if max_id is None else max_id + 1
        
        # Insert the new supplier
        cursor.execute("""
            INSERT INTO Fournisseur (id, nom, telephone, adresse)
            VALUES (?, ?, ?, ?)
        """, (
            next_id,
            fournisseur.nom,
            fournisseur.telephone,
            fournisseur.adresse
        ))
        
        conn.commit()
        
        # Return the created supplier with its ID
        return {**fournisseur.dict(), "id": next_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating supplier: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.put("/api/fournisseurs/{fournisseur_id}", response_model=Fournisseur)
async def update_fournisseur(fournisseur_id: int, fournisseur: Fournisseur, conn = Depends(get_db)):
    """Update an existing supplier."""
    try:
        cursor = conn.cursor()
        
        # Check if supplier exists
        cursor.execute("SELECT id FROM Fournisseur WHERE id = ?", (fournisseur_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail=f"Fournisseur avec ID {fournisseur_id} non trouvé")
        
        # Check for unique name (excluding current supplier)
        cursor.execute("SELECT id FROM Fournisseur WHERE nom = ? AND id != ?", 
                      (fournisseur.nom, fournisseur_id))
        if cursor.fetchone() is not None:
            raise HTTPException(status_code=400, detail=f"Un fournisseur avec le nom '{fournisseur.nom}' existe déjà")
        
        # Update the supplier
        cursor.execute("""
            UPDATE Fournisseur
            SET nom = ?, telephone = ?, adresse = ?
            WHERE id = ?
        """, (
            fournisseur.nom,
            fournisseur.telephone,
            fournisseur.adresse,
            fournisseur_id
        ))
        
        conn.commit()
        
        # Return the updated supplier
        return {**fournisseur.dict(), "id": fournisseur_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating supplier {fournisseur_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.delete("/api/fournisseurs/{fournisseur_id}")
async def delete_fournisseur(fournisseur_id: int, conn = Depends(get_db)):
    """Delete a supplier."""
    try:
        cursor = conn.cursor()
        
        # Check if supplier exists
        cursor.execute("SELECT id FROM Fournisseur WHERE id = ?", (fournisseur_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail=f"Fournisseur avec ID {fournisseur_id} non trouvé")
        
        # Delete the supplier
        cursor.execute("DELETE FROM Fournisseur WHERE id = ?", (fournisseur_id,))
        conn.commit()
        
        return {"message": f"Fournisseur avec ID {fournisseur_id} supprimé avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting supplier {fournisseur_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")
