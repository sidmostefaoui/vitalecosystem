"""FastAPI backend for VITALECOSYSTEM's internal management system."""

import re
import sqlite3
import os
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from models import *
from pydantic import BaseModel, validator, Field
from datetime import date, datetime

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

def recalculate_montant_verse(bon_id: int, cursor):
    """Recalculate the total montant_verse for a bon d'achat based on versements"""
    cursor.execute("SELECT SUM(montant) FROM Versement_Bon_Achat WHERE bon_achat_id = ?", (bon_id,))
    total_versements = cursor.fetchone()[0]
    total_versements = total_versements if total_versements is not None else 0
    
    # Update the montant_verse field
    cursor.execute(
        "UPDATE Bon_Achats SET montant_verse = ? WHERE id = ?",
        (total_versements, bon_id)
    )
    return total_versements

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
        
        # Always start with montant_verse = 0 for new bons
        montant_verse = 0
        
        if id:
            # When recreating with specific ID, check if there are any versements
            cursor.execute("SELECT SUM(montant) FROM Versement_Bon_Achat WHERE bon_achat_id = ?", (id,))
            total_versements = cursor.fetchone()[0]
            
            # Update montant_verse if versements exist
            if total_versements is not None:
                montant_verse = total_versements
            
            # When recreating with specific ID (for update via delete and recreate)
            cursor.execute(
                "INSERT INTO Bon_Achats (id, date, fournisseur, montant_total, montant_verse) VALUES (?, ?, ?, ?, ?) RETURNING *",
                (id, bon.date, bon.fournisseur, bon.montant_total, montant_verse)
            )
        else:
            # Normal creation with auto-incremented ID
            cursor.execute(
                "INSERT INTO Bon_Achats (date, fournisseur, montant_total, montant_verse) VALUES (?, ?, ?, ?) RETURNING *",
                (bon.date, bon.fournisseur, bon.montant_total, montant_verse)
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
        
        # Calculate the actual montant_verse based on versements
        cursor.execute("SELECT SUM(montant) FROM Versement_Bon_Achat WHERE bon_achat_id = ?", (bon_id,))
        total_versements = cursor.fetchone()[0]
        total_versements = total_versements if total_versements is not None else 0
        
        # Ensure montant_verse matches the versements
        montant_verse = total_versements
            
        # Update the bon d'achat
        cursor.execute(
            "UPDATE Bon_Achats SET date = ?, fournisseur = ?, montant_total = ?, montant_verse = ? WHERE id = ? RETURNING *",
            (bon.date, bon.fournisseur, bon.montant_total, montant_verse, bon_id)
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

@app.get("/api/bon-achats/{bon_id}/versements", response_model=List[VersementBonAchat])
async def get_versements_bon_achat(bon_id: int, conn = Depends(get_db)):
    """Get all payments for a specific bon d'achat"""
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM Versement_Bon_Achat WHERE bon_achat_id = ? ORDER BY id",
            (bon_id,)
        )
        versements = cursor.fetchall()
        return [dict(row) for row in versements]
    except sqlite3.Error as e:
        print(f"Error fetching versements: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bon-achats/{bon_id}/versements", response_model=VersementBonAchat)
async def create_versement_bon_achat(bon_id: int, versement: VersementBonAchat, conn = Depends(get_db)):
    """Add a new payment to a bon d'achat"""
    try:
        # Verify that the bon_achat exists
        cursor = conn.cursor()
        cursor.execute("SELECT id, montant_total, montant_verse FROM Bon_Achats WHERE id = ?", (bon_id,))
        bon_achat = cursor.fetchone()
        if bon_achat is None:
            raise HTTPException(status_code=404, detail="Bon d'achat non trouvé")
        
        # Get current total paid amount
        current_montant_verse = bon_achat[2] or 0
        montant_total = bon_achat[1] or 0
        
        # Calculate new total paid amount
        new_montant_verse = current_montant_verse + versement.montant
        
        # Check if new payment exceeds total amount
        if new_montant_verse > montant_total:
            raise HTTPException(
                status_code=400, 
                detail=f"Le montant versé ({new_montant_verse} DA) ne peut pas dépasser le montant total ({montant_total} DA)"
            )
        
        # Insert the new payment
        cursor.execute(
            """
            INSERT INTO Versement_Bon_Achat (montant, type, bon_achat_id)
            VALUES (?, ?, ?) RETURNING *
            """,
            (versement.montant, versement.type, bon_id)
        )
        new_versement = cursor.fetchone()
        
        # Recalculate montant_verse
        recalculate_montant_verse(bon_id, cursor)
        
        conn.commit()
        return dict(new_versement)
    except sqlite3.Error as e:
        print(f"Error creating versement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/bon-achats/{bon_id}/versements/{versement_id}", response_model=VersementBonAchat)
async def update_versement_bon_achat(
    bon_id: int,
    versement_id: int,
    versement: VersementBonAchat,
    conn = Depends(get_db)
):
    """Update a payment in a bon d'achat"""
    try:
        cursor = conn.cursor()
        
        # First get the current versement
        cursor.execute(
            "SELECT montant FROM Versement_Bon_Achat WHERE id = ? AND bon_achat_id = ?",
            (versement_id, bon_id)
        )
        current_versement = cursor.fetchone()
        if current_versement is None:
            raise HTTPException(status_code=404, detail="Versement non trouvé")
        
        current_montant = current_versement[0]
        
        # Get the bon d'achat details
        cursor.execute("SELECT montant_total FROM Bon_Achats WHERE id = ?", (bon_id,))
        bon_achat = cursor.fetchone()
        montant_total = bon_achat[0]
        
        # Update the versement
        cursor.execute(
            """
            UPDATE Versement_Bon_Achat 
            SET montant = ?, type = ?
            WHERE id = ? AND bon_achat_id = ?
            RETURNING *
            """,
            (versement.montant, versement.type, versement_id, bon_id)
        )
        updated_versement = cursor.fetchone()
        
        # Recalculate the total versements for this bon d'achat
        total_versements = recalculate_montant_verse(bon_id, cursor)
        
        # Check if new total exceeds montant_total
        if total_versements > montant_total:
            # Rollback the transaction
            conn.rollback()
            raise HTTPException(
                status_code=400, 
                detail=f"Le montant versé ({total_versements} DA) ne peut pas dépasser le montant total ({montant_total} DA)"
            )
        
        conn.commit()
        return dict(updated_versement)
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/bon-achats/{bon_id}/versements/{versement_id}")
async def delete_versement_bon_achat(bon_id: int, versement_id: int, conn = Depends(get_db)):
    """Delete a payment from a bon d'achat"""
    try:
        cursor = conn.cursor()
        
        # First get the versement details
        cursor.execute(
            "SELECT id FROM Versement_Bon_Achat WHERE id = ? AND bon_achat_id = ?",
            (versement_id, bon_id)
        )
        versement = cursor.fetchone()
        
        if versement is None:
            raise HTTPException(status_code=404, detail="Versement non trouvé")
            
        # Delete the versement
        cursor.execute(
            "DELETE FROM Versement_Bon_Achat WHERE id = ? AND bon_achat_id = ?",
            (versement_id, bon_id)
        )
        
        # Recalculate the montant_verse
        recalculate_montant_verse(bon_id, cursor)
        
        conn.commit()
        return {"message": "Versement supprimé avec succès"}
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

# Client endpoints
@app.get("/api/clients", response_model=List[ClientModel])
async def get_clients(conn = Depends(get_db)):
    """Get all clients."""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Client_Forfait ORDER BY nom")
        clients = cursor.fetchall()
        
        # Convert to list of dicts for Pydantic model
        return [dict(client) for client in clients]
    except Exception as e:
        # Log the error for server-side debugging
        print(f"Error fetching clients: {str(e)}")
        # Return a user-friendly error
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.get("/api/clients/{client_id}", response_model=ClientModel)
async def get_client(client_id: int, conn = Depends(get_db)):
    """Get a specific client by ID."""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Client_Forfait WHERE id = ?", (client_id,))
        client = cursor.fetchone()
        
        if client is None:
            raise HTTPException(status_code=404, detail=f"Client_Forfait avec ID {client_id} non trouvé")
        
        return dict(client)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching client {client_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.post("/api/clients", response_model=ClientModel)
async def create_client(client: ClientModel, conn = Depends(get_db)):
    """Create a new client."""
    try:
        cursor = conn.cursor()
        
        # Check for unique name
        cursor.execute("SELECT id FROM Client_Forfait WHERE nom = ?", (client.nom,))
        if cursor.fetchone() is not None:
            raise HTTPException(status_code=400, detail=f"Un client avec le nom '{client.nom}' existe déjà")
        
        # Get next ID
        cursor.execute("SELECT MAX(id) FROM Client_Forfait")
        max_id = cursor.fetchone()[0]
        next_id = 1 if max_id is None else max_id + 1
        
        # Insert the new client
        cursor.execute("""
            INSERT INTO Client_Forfait (id, nom, specialite, tel, mode, agent, etat_contrat, debut_contrat, fin_contrat)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            next_id,
            client.nom,
            client.specialite,
            client.tel,
            client.mode,
            client.agent,
            client.etat_contrat,
            client.debut_contrat,
            client.fin_contrat
        ))
        
        conn.commit()
        
        # Return the created client with its ID
        return {**client.dict(), "id": next_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating client: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.delete("/api/clients/{client_id}")
async def delete_client(client_id: int, conn = Depends(get_db)):
    """Delete a client."""
    try:
        cursor = conn.cursor()
        
        # Check if client exists
        cursor.execute("SELECT id FROM Client_Forfait WHERE id = ?", (client_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail=f"Client_Forfait avec ID {client_id} non trouvé")
        
        # Delete the client
        cursor.execute("DELETE FROM Client_Forfait WHERE id = ?", (client_id,))
        conn.commit()
        
        return {"message": f"Client_Forfait avec ID {client_id} supprimé avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting client {client_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

# Contrat Forfait Endpoints
@app.get("/api/contrats-forfait", response_model=List[ContratForfaitModel])
async def get_contrats_forfait():
    """
    Récupère tous les contrats forfait
    """
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM Contrat_Forfait")
        contrats = cursor.fetchall()
        
        # Convertir les résultats en liste de dictionnaires
        result = []
        for contrat in contrats:
            result.append({
                "id": contrat[0],
                "date_debut": contrat[1],
                "date_fin": contrat[2],
                "montant": contrat[3],
                "client_id": contrat[4]
            })
        
        conn.close()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des contrats forfait: {str(e)}")

@app.get("/api/contrats-forfait/{contrat_id}", response_model=ContratForfaitModel)
async def get_contrat_forfait(contrat_id: int):
    """
    Récupère un contrat forfait spécifique par son ID
    """
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Récupérer le contrat
        cursor.execute("SELECT * FROM Contrat_Forfait WHERE id = ?", (contrat_id,))
        contrat = cursor.fetchone()
        
        conn.close()
        
        if contrat is None:
            raise HTTPException(status_code=404, detail="Contrat forfait non trouvé")
        
        # Retourner le contrat
        return {
            "id": contrat[0],
            "date_debut": contrat[1],
            "date_fin": contrat[2],
            "montant": contrat[3],
            "prix_exces_poids": contrat[4],
            "etat": contrat[5],
            "client_id": contrat[6]
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération du contrat forfait: {str(e)}")

@app.get("/api/clients/{client_id}/contrats-forfait", response_model=List[ContratForfaitModel])
async def get_contrats_forfait_by_client(client_id: int, conn = Depends(get_db)):
    """
    Récupère tous les contrats forfait d'un client spécifique
    """
    try:
        cursor = conn.cursor()
        
        # Vérifier si le client existe
        cursor.execute("SELECT * FROM Client_Forfait WHERE id = ?", (client_id,))
        client = cursor.fetchone()
        
        if client is None:
            conn.close()
            raise HTTPException(status_code=404, detail="Client_Forfait non trouvé")
        
        cursor.execute("SELECT * FROM Contrat_Forfait WHERE client_id = ?", (client_id,))
        contrats = cursor.fetchall()
        
        # Convertir les résultats en liste de dictionnaires
        result = []
        for contrat in contrats:
            result.append(dict(contrat))
        
        conn.close()
        return result
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des contrats forfait: {str(e)}")

@app.post("/api/contrats-forfait", response_model=ContratForfaitModel)
async def create_contrat_forfait(contrat: ContratForfaitModel, conn = Depends(get_db)):
    """
    Crée un nouveau contrat forfait
    """
    try:
        cursor = conn.cursor()
        
        # Vérifier si le client existe
        cursor.execute("SELECT * FROM Client_Forfait WHERE id = ?", (contrat.client_id,))
        client = cursor.fetchone()
        
        if client is None:
            conn.close()
            raise HTTPException(status_code=404, detail="Client_Forfait non trouvé")
        
        # Vérifier si un contrat actif ou en pause existe déjà pour ce client
        cursor.execute("SELECT * FROM Contrat_Forfait WHERE client_id = ? AND (etat = 'Actif' OR etat = 'Pause')", (contrat.client_id,))
        contrat_existant = cursor.fetchone()
        
        if contrat_existant is not None:
            raise HTTPException(status_code=400, detail="Un contrat actif ou en pause existe déjà pour ce client. Veuillez le mettre à l'état 'Terminé' avant d'en créer un nouveau.")
        
        # Insérer le nouveau contrat forfait (toujours actif par défaut)
        cursor.execute("""
            INSERT INTO Contrat_Forfait (date_debut, date_fin, montant, prix_exces_poids, client_id, etat)
            VALUES (?, ?, ?, ?, ?, 'Actif')
        """, (contrat.date_debut, contrat.date_fin, contrat.montant, contrat.prix_exces_poids, contrat.client_id))
        
        # Récupérer l'ID du contrat nouvellement créé
        contrat_id = cursor.lastrowid
        
        # Mettre à jour les informations du client avec les détails du contrat
        cursor.execute("""
            UPDATE Client_Forfait
            SET etat_contrat = 'Actif', debut_contrat = ?, fin_contrat = ?
            WHERE id = ?
        """, (contrat.date_debut, contrat.date_fin, contrat.client_id))
        
        conn.commit()
        
        # Retourner le contrat complet avec l'ID
        return {
            "id": contrat_id,
            "date_debut": contrat.date_debut,
            "date_fin": contrat.date_fin,
            "montant": contrat.montant,
            "prix_exces_poids": contrat.prix_exces_poids,
            "client_id": contrat.client_id,
            "etat": "Actif"
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du contrat forfait: {str(e)}")

@app.put("/api/contrats-forfait/{contrat_id}", response_model=ContratForfaitModel)
async def update_contrat_forfait(contrat_id: int, contrat: ContratForfaitModel, conn = Depends(get_db)):
    """
    Met à jour un contrat forfait existant
    """
    try:
        cursor = conn.cursor()
        
        # Vérifier si le contrat existe
        cursor.execute("SELECT * FROM Contrat_Forfait WHERE id = ?", (contrat_id,))
        existing_contrat = cursor.fetchone()
        
        if existing_contrat is None:
            conn.close()
            raise HTTPException(status_code=404, detail="Contrat forfait non trouvé")
        
        # Vérifier si le client existe
        cursor.execute("SELECT * FROM Client_Forfait WHERE id = ?", (contrat.client_id,))
        client = cursor.fetchone()
        
        if client is None:
            conn.close()
            raise HTTPException(status_code=404, detail="Client_Forfait non trouvé")
        
        # Si on essaie de passer le contrat à "Actif", vérifier qu'il n'existe pas déjà un contrat actif
        if contrat.etat == "Actif" and existing_contrat["etat"] != "Actif":
            cursor.execute("SELECT * FROM Contrat_Forfait WHERE client_id = ? AND etat = 'Actif' AND id != ?", 
                           (contrat.client_id, contrat_id))
            contrat_actif = cursor.fetchone()
            
            if contrat_actif is not None:
                raise HTTPException(status_code=400, 
                                  detail="Un contrat actif existe déjà pour ce client. Veuillez le mettre en pause avant d'activer celui-ci.")
        
        # Mettre à jour le contrat
        cursor.execute("""
            UPDATE Contrat_Forfait
            SET date_debut = ?, date_fin = ?, montant = ?, prix_exces_poids = ?, client_id = ?, etat = ?
            WHERE id = ?
        """, (contrat.date_debut, contrat.date_fin, contrat.montant, contrat.prix_exces_poids, 
              contrat.client_id, contrat.etat, contrat_id))
        
        # Mettre à jour les informations du client en fonction de l'état du contrat
        if contrat.etat == "Actif":
            # Si le contrat est actif, mettre à jour les infos du client
            cursor.execute("""
                UPDATE Client_Forfait
                SET etat_contrat = 'Actif', debut_contrat = ?, fin_contrat = ?
                WHERE id = ?
            """, (contrat.date_debut, contrat.date_fin, contrat.client_id))
        elif contrat.etat == "Pause":
            # Si le contrat est en pause, mettre à jour l'état du client
            cursor.execute("""
                UPDATE Client_Forfait
                SET etat_contrat = 'En Pause'
                WHERE id = ?
            """, (contrat.client_id,))
        elif contrat.etat == "Terminé":
            # Vérifier s'il y a un autre contrat actif ou en pause
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM Contrat_Forfait
                WHERE client_id = ? AND (etat = 'Actif' OR etat = 'Pause') AND id != ?
            """, (contrat.client_id, contrat_id))
            
            has_other_active = cursor.fetchone()['count'] > 0
            
            # S'il n'y a pas d'autre contrat actif, réinitialiser les infos du client
            if not has_other_active:
                cursor.execute("""
                    UPDATE Client_Forfait
                    SET etat_contrat = NULL, debut_contrat = NULL, fin_contrat = NULL
                    WHERE id = ?
                """, (contrat.client_id,))
        
        conn.commit()
        
        # Retourner le contrat mis à jour
        return {
            "id": contrat_id,
            "date_debut": contrat.date_debut,
            "date_fin": contrat.date_fin,
            "montant": contrat.montant,
            "prix_exces_poids": contrat.prix_exces_poids,
            "client_id": contrat.client_id,
            "etat": contrat.etat
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour du contrat forfait: {str(e)}")

@app.delete("/api/contrats-forfait/{contrat_id}")
async def delete_contrat_forfait(contrat_id: int, conn = Depends(get_db)):
    """
    Supprime un contrat forfait
    """
    try:
        cursor = conn.cursor()
        
        # Vérifier si le contrat existe
        cursor.execute("SELECT * FROM Contrat_Forfait WHERE id = ?", (contrat_id,))
        contrat = cursor.fetchone()
        
        if contrat is None:
            conn.close()
            raise HTTPException(status_code=404, detail="Contrat forfait non trouvé")
        
        client_id = contrat['client_id']
        was_active = contrat['etat'] in ('Actif', 'Pause')
        
        # Supprimer le contrat
        cursor.execute("DELETE FROM Contrat_Forfait WHERE id = ?", (contrat_id,))
        
        # Si le contrat était actif ou en pause, vérifier s'il y a d'autres contrats actifs
        if was_active:
            # Vérifier s'il y a un autre contrat actif ou en pause
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM Contrat_Forfait
                WHERE client_id = ? AND (etat = 'Actif' OR etat = 'Pause')
            """, (client_id,))
            
            has_other_active = cursor.fetchone()['count'] > 0
            
            # S'il n'y a pas d'autre contrat actif, réinitialiser les infos du client
            if not has_other_active:
                cursor.execute("""
                    UPDATE Client_Forfait
                    SET etat_contrat = NULL, debut_contrat = NULL, fin_contrat = NULL
                    WHERE id = ?
                """, (client_id,))
        
        conn.commit()
        
        return {"message": "Contrat forfait supprimé avec succès"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression du contrat forfait: {str(e)}")

# Bon Passage Forfait endpoints
@app.get("/api/bon-passage-forfait", response_model=List[BonPassageForfaitModel])
async def get_bons_passage_forfait(conn = Depends(get_db)):
    """Récupérer tous les bons de passage forfait"""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Bon_Passage_Forfait ORDER BY date DESC")
        bons = cursor.fetchall()
        return [dict(bon) for bon in bons]
    except Exception as e:
        print(f"Error fetching bons de passage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.get("/api/bon-passage-forfait/{bon_id}", response_model=BonPassageForfaitModel)
async def get_bon_passage_forfait(bon_id: int, conn = Depends(get_db)):
    """Récupérer un bon de passage forfait spécifique"""
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Bon_Passage_Forfait WHERE id = ?", (bon_id,))
        bon = cursor.fetchone()
        
        if bon is None:
            raise HTTPException(status_code=404, detail="Bon de passage forfait non trouvé")
            
        return dict(bon)
    except Exception as e:
        print(f"Error fetching bon de passage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.get("/api/clients/{client_id}/bon-passage-forfait", response_model=List[BonPassageForfaitModel])
async def get_bons_passage_forfait_by_client(client_id: int, conn = Depends(get_db)):
    """Récupérer tous les bons de passage forfait d'un client spécifique"""
    try:
        cursor = conn.cursor()
        
        # Vérifier si le client existe
        cursor.execute("SELECT * FROM Client_Forfait WHERE id = ?", (client_id,))
        client = cursor.fetchone()
        
        if client is None:
            raise HTTPException(status_code=404, detail="Client_Forfait non trouvé")
        
        cursor.execute("SELECT * FROM Bon_Passage_Forfait WHERE client_id = ? ORDER BY date DESC", (client_id,))
        bons = cursor.fetchall()
        
        return [dict(bon) for bon in bons]
    except Exception as e:
        print(f"Error fetching bons de passage for client: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.post("/api/bon-passage-forfait", response_model=BonPassageForfaitModel)
async def create_bon_passage_forfait(bon: BonPassageForfaitModel, conn = Depends(get_db)):
    """Créer un nouveau bon de passage forfait"""
    try:
        cursor = conn.cursor()
        
        # Vérifier si le client existe
        cursor.execute("SELECT * FROM Client_Forfait WHERE id = ?", (bon.client_id,))
        client = cursor.fetchone()
        
        if client is None:
            raise HTTPException(status_code=404, detail=f"Client_Forfait avec ID {bon.client_id} non trouvé")
        
        # Insérer le nouveau bon de passage avec montant et exces_poids
        cursor.execute("""
            INSERT INTO Bon_Passage_Forfait (date, client_id, montant, exces_poids)
            VALUES (?, ?, ?, ?) RETURNING *
        """, (bon.date, bon.client_id, bon.montant, bon.exces_poids))
        
        new_bon = cursor.fetchone()
        conn.commit()
        
        return dict(new_bon)
    except Exception as e:
        print(f"Error creating bon de passage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.put("/api/bon-passage-forfait/{bon_id}", response_model=BonPassageForfaitModel)
async def update_bon_passage_forfait(bon_id: int, bon: BonPassageForfaitModel, conn = Depends(get_db)):
    """Mettre à jour un bon de passage forfait"""
    try:
        cursor = conn.cursor()
        
        # Vérifier si le bon de passage existe
        cursor.execute("SELECT * FROM Bon_Passage_Forfait WHERE id = ?", (bon_id,))
        existing_bon = cursor.fetchone()
        
        if existing_bon is None:
            raise HTTPException(status_code=404, detail="Bon de passage forfait non trouvé")
        
        # Vérifier si le client existe
        cursor.execute("SELECT * FROM Client_Forfait WHERE id = ?", (bon.client_id,))
        client = cursor.fetchone()
        
        if client is None:
            raise HTTPException(status_code=404, detail="Client_Forfait non trouvé")
        
        # Mettre à jour le bon de passage avec montant et exces_poids
        cursor.execute("""
            UPDATE Bon_Passage_Forfait
            SET date = ?, client_id = ?, montant = ?, exces_poids = ?
            WHERE id = ? RETURNING *
        """, (bon.date, bon.client_id, bon.montant, bon.exces_poids, bon_id))
        
        updated_bon = cursor.fetchone()
        conn.commit()
        
        return dict(updated_bon)
    except Exception as e:
        print(f"Error updating bon de passage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.delete("/api/bon-passage-forfait/{bon_id}")
async def delete_bon_passage_forfait(bon_id: int, conn = Depends(get_db)):
    """Supprimer un bon de passage forfait"""
    try:
        cursor = conn.cursor()
        
        # Vérifier si le bon de passage existe
        cursor.execute("SELECT * FROM Bon_Passage_Forfait WHERE id = ?", (bon_id,))
        bon = cursor.fetchone()
        
        if bon is None:
            raise HTTPException(status_code=404, detail="Bon de passage forfait non trouvé")
        
        # Supprimer le bon de passage (les produits et services seront supprimés en cascade)
        cursor.execute("DELETE FROM Bon_Passage_Forfait WHERE id = ?", (bon_id,))
        conn.commit()
        
        return {"message": "Bon de passage forfait supprimé avec succès"}
    except Exception as e:
        print(f"Error deleting bon de passage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

# Endpoints pour les produits dans un bon de passage
@app.get("/api/bon-passage-forfait/{bon_id}/produits", response_model=List[BonPassageForfaitProduitModel])
async def get_produits_bon_passage(bon_id: int, conn = Depends(get_db)):
    """Récupérer tous les produits d'un bon de passage forfait"""
    try:
        cursor = conn.cursor()
        
        # Vérifier si le bon de passage existe
        cursor.execute("SELECT * FROM Bon_Passage_Forfait WHERE id = ?", (bon_id,))
        bon = cursor.fetchone()
        
        if bon is None:
            raise HTTPException(status_code=404, detail="Bon de passage forfait non trouvé")
        
        cursor.execute("SELECT * FROM Bon_Passage_Forfait_Produits WHERE bon_passage_id = ?", (bon_id,))
        produits = cursor.fetchall()
        
        return [dict(produit) for produit in produits]
    except Exception as e:
        print(f"Error fetching produits de bon de passage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.post("/api/bon-passage-forfait/{bon_id}/produits", response_model=BonPassageForfaitProduitModel)
async def create_produit_bon_passage(bon_id: int, produit: BonPassageForfaitProduitModel, conn = Depends(get_db)):
    """Ajouter un produit à un bon de passage forfait"""
    try:
        cursor = conn.cursor()
        
        print(f"Attempting to create produit for bon_id={bon_id}, produit data: {produit}")
        
        # Vérifier si le bon de passage existe
        cursor.execute("SELECT * FROM Bon_Passage_Forfait WHERE id = ?", (bon_id,))
        bon = cursor.fetchone()
        
        if bon is None:
            error_msg = f"Bon de passage forfait avec ID {bon_id} non trouvé"
            print(error_msg)
            raise HTTPException(status_code=404, detail=error_msg)
        
        # Insérer le produit
        try:
            cursor.execute("""
                INSERT INTO Bon_Passage_Forfait_Produits (produit, qte, prix, bon_passage_id)
                VALUES (?, ?, ?, ?) RETURNING *
            """, (produit.produit, produit.qte, produit.prix, bon_id))
            
            new_produit = cursor.fetchone()
            conn.commit()
            
            print(f"Produit created successfully: {new_produit}")
            return dict(new_produit)
        except Exception as sql_error:
            print(f"SQL error creating produit: {str(sql_error)}")
            raise HTTPException(
                status_code=400, 
                detail=f"Erreur lors de l'insertion du produit: {str(sql_error)}"
            )
    except Exception as e:
        print(f"Error creating produit de bon de passage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.put("/api/bon-passage-forfait/{bon_id}/produits/{produit_id}", response_model=BonPassageForfaitProduitModel)
async def update_produit_bon_passage(bon_id: int, produit_id: int, produit: BonPassageForfaitProduitModel, conn = Depends(get_db)):
    """Mettre à jour un produit dans un bon de passage forfait"""
    try:
        cursor = conn.cursor()
        
        # Vérifier si le produit existe dans ce bon de passage
        cursor.execute(
            "SELECT * FROM Bon_Passage_Forfait_Produits WHERE id = ? AND bon_passage_id = ?", 
            (produit_id, bon_id)
        )
        existing_produit = cursor.fetchone()
        
        if existing_produit is None:
            raise HTTPException(status_code=404, detail="Produit non trouvé dans ce bon de passage")
        
        # Mettre à jour le produit
        cursor.execute("""
            UPDATE Bon_Passage_Forfait_Produits
            SET produit = ?, qte = ?, prix = ?
            WHERE id = ? AND bon_passage_id = ? RETURNING *
        """, (produit.produit, produit.qte, produit.prix, produit_id, bon_id))
        
        updated_produit = cursor.fetchone()
        conn.commit()
        
        return dict(updated_produit)
    except Exception as e:
        print(f"Error updating produit de bon de passage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.delete("/api/bon-passage-forfait/{bon_id}/produits/{produit_id}")
async def delete_produit_bon_passage(bon_id: int, produit_id: int, conn = Depends(get_db)):
    """Supprimer un produit d'un bon de passage forfait"""
    try:
        cursor = conn.cursor()
        
        # Vérifier si le produit existe dans ce bon de passage
        cursor.execute(
            "SELECT * FROM Bon_Passage_Forfait_Produits WHERE id = ? AND bon_passage_id = ?", 
            (produit_id, bon_id)
        )
        produit = cursor.fetchone()
        
        if produit is None:
            raise HTTPException(status_code=404, detail="Produit non trouvé dans ce bon de passage")
        
        # Supprimer le produit
        cursor.execute(
            "DELETE FROM Bon_Passage_Forfait_Produits WHERE id = ? AND bon_passage_id = ?", 
            (produit_id, bon_id)
        )
        conn.commit()
        
        return {"message": "Produit supprimé avec succès du bon de passage"}
    except Exception as e:
        print(f"Error deleting produit de bon de passage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

# Endpoints pour les services dans un bon de passage
@app.get("/api/bon-passage-forfait/{bon_id}/services", response_model=List[BonPassageForfaitServiceModel])
async def get_services_bon_passage(bon_id: int, conn = Depends(get_db)):
    """Récupérer tous les services d'un bon de passage forfait"""
    try:
        cursor = conn.cursor()
        
        # Vérifier si le bon de passage existe
        cursor.execute("SELECT * FROM Bon_Passage_Forfait WHERE id = ?", (bon_id,))
        bon = cursor.fetchone()
        
        if bon is None:
            raise HTTPException(status_code=404, detail="Bon de passage forfait non trouvé")
        
        cursor.execute("SELECT * FROM Bon_Passage_Forfait_Services WHERE bon_passage_id = ?", (bon_id,))
        services = cursor.fetchall()
        
        return [dict(service) for service in services]
    except Exception as e:
        print(f"Error fetching services de bon de passage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.post("/api/bon-passage-forfait/{bon_id}/services", response_model=BonPassageForfaitServiceModel)
async def create_service_bon_passage(bon_id: int, service: BonPassageForfaitServiceModel, conn = Depends(get_db)):
    """Ajouter un service à un bon de passage forfait"""
    try:
        cursor = conn.cursor()
        
        print(f"Attempting to create service for bon_id={bon_id}, service data: {service}")
        
        # Vérifier si le bon de passage existe
        cursor.execute("SELECT * FROM Bon_Passage_Forfait WHERE id = ?", (bon_id,))
        bon = cursor.fetchone()
        
        if bon is None:
            error_msg = f"Bon de passage forfait avec ID {bon_id} non trouvé"
            print(error_msg)
            raise HTTPException(status_code=404, detail=error_msg)
        
        # Insérer le service
        try:
            cursor.execute("""
                INSERT INTO Bon_Passage_Forfait_Services (service, qte, bon_passage_id)
                VALUES (?, ?, ?) RETURNING *
            """, (service.service, service.qte, bon_id))
            
            new_service = cursor.fetchone()
            conn.commit()
            
            print(f"Service created successfully: {new_service}")
            return dict(new_service)
        except Exception as sql_error:
            print(f"SQL error creating service: {str(sql_error)}")
            raise HTTPException(
                status_code=400, 
                detail=f"Erreur lors de l'insertion du service: {str(sql_error)}"
            )
    except Exception as e:
        print(f"Error creating service de bon de passage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.put("/api/bon-passage-forfait/{bon_id}/services/{service_id}", response_model=BonPassageForfaitServiceModel)
async def update_service_bon_passage(bon_id: int, service_id: int, service: BonPassageForfaitServiceModel, conn = Depends(get_db)):
    """Mettre à jour un service dans un bon de passage forfait"""
    try:
        cursor = conn.cursor()
        
        # Vérifier si le service existe dans ce bon de passage
        cursor.execute(
            "SELECT * FROM Bon_Passage_Forfait_Services WHERE id = ? AND bon_passage_id = ?", 
            (service_id, bon_id)
        )
        existing_service = cursor.fetchone()
        
        if existing_service is None:
            raise HTTPException(status_code=404, detail="Service non trouvé dans ce bon de passage")
        
        # Mettre à jour le service
        cursor.execute("""
            UPDATE Bon_Passage_Forfait_Services
            SET service = ?, qte = ?
            WHERE id = ? AND bon_passage_id = ? RETURNING *
        """, (service.service, service.qte, service_id, bon_id))
        
        updated_service = cursor.fetchone()
        conn.commit()
        
        return dict(updated_service)
    except Exception as e:
        print(f"Error updating service de bon de passage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")

@app.delete("/api/bon-passage-forfait/{bon_id}/services/{service_id}")
async def delete_service_bon_passage(bon_id: int, service_id: int, conn = Depends(get_db)):
    """Supprimer un service d'un bon de passage forfait"""
    try:
        cursor = conn.cursor()
        
        # Vérifier si le service existe dans ce bon de passage
        cursor.execute(
            "SELECT * FROM Bon_Passage_Forfait_Services WHERE id = ? AND bon_passage_id = ?", 
            (service_id, bon_id)
        )
        service = cursor.fetchone()
        
        if service is None:
            raise HTTPException(status_code=404, detail="Service non trouvé dans ce bon de passage")
        
        # Supprimer le service
        cursor.execute(
            "DELETE FROM Bon_Passage_Forfait_Services WHERE id = ? AND bon_passage_id = ?", 
            (service_id, bon_id)
        )
        conn.commit()
        
        return {"message": "Service supprimé avec succès du bon de passage"}
    except Exception as e:
        print(f"Error deleting service de bon de passage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de serveur: {str(e)}")
