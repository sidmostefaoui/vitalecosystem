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
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")
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

# Bon_Achats model
class BonAchats(BaseModel):
    """Bon d'achats model"""
    id: Optional[int] = None
    date: str
    fournisseur: str
    montant_total: float = 0
    montant_verse: float = 0

    @validator('date')
    def validate_date(cls, v):
        try:
            datetime.strptime(v, '%d/%m/%Y')
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Format de date invalide. Utilisez le format dd/mm/yyyy"
            )
        return v

# Produit_Bon_Achat model
class ProduitBonAchat(BaseModel):
    """Produit bon d'achat model"""
    id: Optional[int] = None
    produit: str
    qte: int
    prix: Optional[float] = None
    bon_achat_id: int

    @validator('qte')
    def validate_qte(cls, v):
        if v <= 0:
            raise HTTPException(
                status_code=400,
                detail="La quantité doit être supérieure à 0"
            )
        return v

    @validator('prix')
    def validate_prix(cls, v):
        if v is not None and v <= 0:
            raise HTTPException(
                status_code=400,
                detail="Le prix doit être supérieur à 0"
            )
        return v

# Inventaire model
class Inventaire(BaseModel):
    """Inventaire model"""
    id: Optional[int] = None
    produit: str
    qte: int
    prix_dernier: float

    @validator('qte')
    def validate_qte(cls, v):
        if v <= 0:
            raise HTTPException(status_code=400, detail="La quantité doit être supérieure à 0")
        return v

    @validator('prix_dernier')
    def validate_prix(cls, v):
        if v <= 0:
            raise HTTPException(status_code=400, detail="Le prix doit être supérieur à 0")
        return v

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
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Fournisseur WHERE id = ?", (fournisseur_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
        conn.commit()
        return {"message": "Fournisseur supprimé avec succès"}
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

# Bon d'achats endpoints
@app.get("/api/bon-achats", response_model=List[BonAchats])
async def get_bon_achats(conn = Depends(get_db)):
    """Get all bon d'achats"""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Bon_Achats ORDER BY date DESC")
        bon_achats = cursor.fetchall()
        return [dict(row) for row in bon_achats]
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/bon-achats/{bon_id}", response_model=BonAchats)
async def get_bon_achat(bon_id: int, conn = Depends(get_db)):
    """Get a specific bon d'achat by ID"""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Bon_Achats WHERE id = ?", (bon_id,))
        bon = cursor.fetchone()
        if bon is None:
            raise HTTPException(status_code=404, detail="Bon d'achat non trouvé")
        return dict(bon)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bon-achats", response_model=BonAchats)
async def create_bon_achat(bon: BonAchats, id: Optional[int] = None, conn = Depends(get_db)):
    """Create a new bon d'achat with optional ID for recreating after deletion"""
    try:
        cursor = conn.cursor()
        
        if id:
            # When recreating with specific ID (for update via delete and recreate)
            cursor.execute(
                "INSERT INTO Bon_Achats (id, date, fournisseur, montant_total, montant_verse) VALUES (?, ?, ?, ?, ?) RETURNING *",
                (id, bon.date, bon.fournisseur, bon.montant_total, bon.montant_verse)
            )
        else:
            # Normal creation with auto-incremented ID
            cursor.execute(
                "INSERT INTO Bon_Achats (date, fournisseur, montant_total, montant_verse) VALUES (?, ?, ?, ?) RETURNING *",
                (bon.date, bon.fournisseur, bon.montant_total, bon.montant_verse)
            )
            
        new_bon = cursor.fetchone()
        conn.commit()
        return dict(new_bon)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/bon-achats/{bon_id}", response_model=BonAchats)
async def update_bon_achat(bon_id: int, bon: BonAchats, conn = Depends(get_db)):
    """Update a bon d'achat"""
    try:
        cursor = conn.cursor()
        
        # First get the current bon d'achat to check if it exists
        cursor.execute("SELECT id FROM Bon_Achats WHERE id = ?", (bon_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Bon d'achat non trouvé")
            
        # Update the bon d'achat
        cursor.execute(
            "UPDATE Bon_Achats SET date = ?, fournisseur = ?, montant_total = ?, montant_verse = ? WHERE id = ? RETURNING *",
            (bon.date, bon.fournisseur, bon.montant_total, bon.montant_verse, bon_id)
        )
        updated_bon = cursor.fetchone()
        conn.commit()
        
        return dict(updated_bon)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/bon-achats/{bon_id}")
async def delete_bon_achat(bon_id: int, conn = Depends(get_db)):
    """Delete a bon d'achat"""
    try:
        cursor = conn.cursor()
        
        # First, get all products associated with this bon d'achat
        cursor.execute("SELECT produit, qte FROM Produits_Bon_Achat WHERE bon_achat_id = ?", (bon_id,))
        products = cursor.fetchall()
        
        if not products:
            # No products found, just delete the bon d'achat
            cursor.execute("DELETE FROM Bon_Achats WHERE id = ?", (bon_id,))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Bon d'achat non trouvé")
        else:
            # Update inventory for each product
            for product in products:
                produit_name = product[0]
                qte_to_remove = product[1]
                
                # Get current inventory
                cursor.execute("SELECT id, qte FROM Inventaire WHERE produit = ?", (produit_name,))
                inventory_item = cursor.fetchone()
                
                if inventory_item:
                    inventory_id = inventory_item[0]
                    current_qte = inventory_item[1]
                    
                    # Calculate new quantity
                    new_qte = current_qte - qte_to_remove
                    
                    if new_qte <= 0:
                        # If new quantity would be zero or negative, delete the inventory item
                        cursor.execute("DELETE FROM Inventaire WHERE id = ?", (inventory_id,))
                    else:
                        # Otherwise update the quantity
                        cursor.execute("UPDATE Inventaire SET qte = ? WHERE id = ?", (new_qte, inventory_id))
            
            # Now delete the bon d'achat (cascade will delete its products)
            cursor.execute("DELETE FROM Bon_Achats WHERE id = ?", (bon_id,))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Bon d'achat non trouvé")
        
        conn.commit()
        return {"message": "Bon d'achat supprimé avec succès"}
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

# API Endpoints for Produits_Bon_Achat
@app.get("/api/bon-achats/{bon_id}/produits", response_model=List[ProduitBonAchat])
async def get_produits_bon_achat(bon_id: int, conn = Depends(get_db)):
    """Get all products for a specific bon d'achat"""
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM Produits_Bon_Achat WHERE bon_achat_id = ? ORDER BY id",
            (bon_id,)
        )
        produits = cursor.fetchall()
        return [dict(row) for row in produits]
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/bon-achats/{bon_id}/produits/{produit_id}", response_model=ProduitBonAchat)
async def get_produit_bon_achat(bon_id: int, produit_id: int, conn = Depends(get_db)):
    """Get a specific product from a bon d'achat"""
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM Produits_Bon_Achat WHERE id = ? AND bon_achat_id = ?",
            (produit_id, bon_id)
        )
        produit = cursor.fetchone()
        if produit is None:
            raise HTTPException(status_code=404, detail="Produit non trouvé")
        return dict(produit)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bon-achats/{bon_id}/produits", response_model=ProduitBonAchat)
async def create_produit_bon_achat(bon_id: int, produit: ProduitBonAchat, conn = Depends(get_db)):
    """Add a new product to a bon d'achat"""
    try:
        # Verify that the bon_achat exists
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM Bon_Achats WHERE id = ?", (bon_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Bon d'achat non trouvé")

        # Insert the new product
        cursor.execute(
            """
            INSERT INTO Produits_Bon_Achat (produit, qte, prix, bon_achat_id)
            VALUES (?, ?, ?, ?) RETURNING *
            """,
            (produit.produit, produit.qte, produit.prix, bon_id)
        )
        new_produit = cursor.fetchone()
        
        # Update inventory
        # Check if product exists in inventory
        cursor.execute("SELECT id, qte, prix_dernier FROM Inventaire WHERE produit = ?", (produit.produit,))
        existing_product = cursor.fetchone()
        
        if existing_product:
            # Product exists, update quantity and price
            product_id = existing_product[0]
            new_qte = existing_product[1] + produit.qte
            
            cursor.execute(
                "UPDATE Inventaire SET qte = ?, prix_dernier = ? WHERE id = ?",
                (new_qte, produit.prix or existing_product[2], product_id)
            )
        else:
            # Product doesn't exist, add it to inventory
            if produit.prix:  # Only add to inventory if price is provided
                cursor.execute(
                    "INSERT INTO Inventaire (produit, qte, prix_dernier) VALUES (?, ?, ?)",
                    (produit.produit, produit.qte, produit.prix)
                )
        
        conn.commit()
        return dict(new_produit)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/bon-achats/{bon_id}/produits/{produit_id}", response_model=ProduitBonAchat)
async def update_produit_bon_achat(
    bon_id: int,
    produit_id: int,
    produit: ProduitBonAchat,
    conn = Depends(get_db)
):
    """Update a product in a bon d'achat"""
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE Produits_Bon_Achat 
            SET produit = ?, qte = ?, prix = ?
            WHERE id = ? AND bon_achat_id = ?
            RETURNING *
            """,
            (produit.produit, produit.qte, produit.prix, produit_id, bon_id)
        )
        updated_produit = cursor.fetchone()
        if updated_produit is None:
            raise HTTPException(status_code=404, detail="Produit non trouvé")
        conn.commit()
        return dict(updated_produit)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/bon-achats/{bon_id}/produits/{produit_id}")
async def delete_produit_bon_achat(bon_id: int, produit_id: int, conn = Depends(get_db)):
    """Delete a product from a bon d'achat"""
    try:
        cursor = conn.cursor()
        
        # First get the product details
        cursor.execute(
            "SELECT produit, qte FROM Produits_Bon_Achat WHERE id = ? AND bon_achat_id = ?",
            (produit_id, bon_id)
        )
        product = cursor.fetchone()
        
        if product is None:
            raise HTTPException(status_code=404, detail="Produit non trouvé")
            
        produit_name = product[0]
        qte_to_remove = product[1]
        
        # Update inventory
        cursor.execute("SELECT id, qte FROM Inventaire WHERE produit = ?", (produit_name,))
        inventory_item = cursor.fetchone()
        
        if inventory_item:
            inventory_id = inventory_item[0]
            current_qte = inventory_item[1]
            
            # Calculate new quantity
            new_qte = current_qte - qte_to_remove
            
            if new_qte <= 0:
                # If new quantity would be zero or negative, delete the inventory item
                cursor.execute("DELETE FROM Inventaire WHERE id = ?", (inventory_id,))
            else:
                # Otherwise update the quantity
                cursor.execute("UPDATE Inventaire SET qte = ? WHERE id = ?", (new_qte, inventory_id))
        
        # Now delete the product
        cursor.execute(
            "DELETE FROM Produits_Bon_Achat WHERE id = ? AND bon_achat_id = ?",
            (produit_id, bon_id)
        )
        
        conn.commit()
        return {"message": "Produit supprimé avec succès"}
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

# Inventaire endpoint
@app.get("/api/inventaire", response_model=List[Inventaire])
async def get_inventaire(conn = Depends(get_db)):
    """Get all inventory items"""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Inventaire ORDER BY produit")
        items = cursor.fetchall()
        return [dict(item) for item in items]
    except sqlite3.Error as e:
        print(f"Error fetching inventory: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")
