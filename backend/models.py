from pydantic import BaseModel, validator, Field
from datetime import date, datetime
from typing import Optional
from fastapi import HTTPException
import re


class Client(BaseModel):
    """Base client model for Client_Forfait table"""
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

# Versement_Bon_Achat model
class VersementBonAchat(BaseModel):
    """Versement bon d'achat model"""
    id: Optional[int] = None
    montant: float
    type: str
    bon_achat_id: int

    @validator('montant')
    def validate_montant(cls, v):
        if v <= 0:
            raise HTTPException(
                status_code=400,
                detail="Le montant versé doit être supérieur à 0"
            )
        return v

    @validator('type')
    def validate_type(cls, v):
        valid_types = ['Chèque', 'Espèce']
        if v not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Le type de versement doit être l'un des suivants: {', '.join(valid_types)}"
            )
        return v

# Client model for the Client_Forfait table
class ClientModel(BaseModel):
    """Client_Forfait model"""
    id: Optional[int] = None
    nom: str
    specialite: Optional[str] = None
    tel: str
    mode: int
    agent: str
    etat_contrat: Optional[str] = None
    debut_contrat: Optional[str] = None
    fin_contrat: Optional[str] = None
    
    @validator('tel')
    def validate_tel(cls, v):
        if not re.match(r'^0\d{8,9}$', v):
            raise HTTPException(status_code=400, detail="Le numéro de téléphone doit commencer par 0 et contenir 9 ou 10 chiffres")
        return v
    
    @validator('mode')
    def validate_mode(cls, v):
        valid_modes = [30, 60, 90]
        if v not in valid_modes:
            raise HTTPException(status_code=400, detail=f"Le mode doit être l'un des suivants: {', '.join(map(str, valid_modes))}")
        return v
    
    @validator('etat_contrat')
    def validate_etat_contrat(cls, v):
        if v is None:
            return None
        valid_etats = ['Actif', 'Pause', 'Terminé']
        if v not in valid_etats:
            raise HTTPException(status_code=400, detail=f"L'état du contrat doit être l'un des suivants: {', '.join(valid_etats)}")
        return v
    
    @validator('debut_contrat', 'fin_contrat')
    def validate_date(cls, v):
        if v is None:
            return None
        # Validate date format dd/mm/yyyy
        try:
            datetime.strptime(v, '%d/%m/%Y')
        except ValueError:
            raise HTTPException(status_code=400, detail="Format de date invalide. Utilisez le format dd/mm/yyyy")
        return v

# Contrat_Forfait model
class ContratForfaitModel(BaseModel):
    """Modèle pour contrat forfait"""
    id: Optional[int] = None
    date_debut: str
    date_fin: str
    montant: int
    prix_exces_poids: int
    poids_forfait: int
    client_id: int
    etat: str = "Actif"
    
    @validator('date_debut', 'date_fin')
    def validate_date_format(cls, v):
        try:
            datetime.strptime(v, '%d/%m/%Y')
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Format de date invalide. Utilisez le format dd/mm/yyyy"
            )
        return v
    
    @validator('date_fin')
    def validate_date_fin_greater(cls, v, values):
        if 'date_debut' in values:
            try:
                debut = datetime.strptime(values['date_debut'], '%d/%m/%Y')
                fin = datetime.strptime(v, '%d/%m/%Y')
                if fin <= debut:
                    raise HTTPException(
                        status_code=400,
                        detail="La date de fin doit être postérieure à la date de début"
                    )
            except ValueError:
                # Already handled by validate_date_format
                pass
        return v
    
    @validator('montant')
    def validate_montant(cls, v):
        if v <= 0:
            raise HTTPException(
                status_code=400,
                detail="Le montant doit être supérieur à 0"
            )
        return v
        
    @validator('prix_exces_poids')
    def validate_prix_exces_poids(cls, v):
        if v <= 0:
            raise HTTPException(
                status_code=400,
                detail="Le prix d'excès de poids doit être supérieur à 0"
            )
        return v
        
    @validator('poids_forfait')
    def validate_poids_forfait(cls, v):
        if v <= 0:
            raise HTTPException(
                status_code=400,
                detail="Le poids forfaitaire doit être supérieur à 0"
            )
        return v

    @validator('etat')
    def validate_etat(cls, v):
        valid_etats = ['Actif', 'Pause', 'Terminé']
        if v not in valid_etats:
            raise HTTPException(
                status_code=400,
                detail=f"L'état du contrat doit être l'un des suivants: {', '.join(valid_etats)}"
            )
        return v

    class Config:
        schema_extra = {
            "example": {
                "date_debut": "01/01/2024",
                "date_fin": "31/12/2024",
                "montant": 120000,
                "prix_exces_poids": 1000,
                "poids_forfait": 100,
                "client_id": 1,
                "etat": "Actif"
            }
        }

# Bon de passage forfait models
class BonPassageForfaitModel(BaseModel):
    """Modèle pour bon de passage forfait"""
    id: Optional[int] = None
    date: str
    client_id: int
    montant: int = 0
    exces_poids: int = 0
    poids_collecte: int
    contrat_id: Optional[int] = None
    
    @validator('date')
    def validate_date_format(cls, v):
        try:
            datetime.strptime(v, '%d/%m/%Y')
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Format de date invalide. Utilisez le format dd/mm/yyyy"
            )
        return v
    
    @validator('montant')
    def validate_montant(cls, v):
        if v < 0:
            raise HTTPException(
                status_code=400,
                detail="Le montant ne peut pas être négatif"
            )
        return v
    
    @validator('exces_poids')
    def validate_exces_poids(cls, v):
        if v < 0:
            raise HTTPException(
                status_code=400,
                detail="L'excès de poids ne peut pas être négatif"
            )
        return v
    
    @validator('poids_collecte')
    def validate_poids_collecte(cls, v):
        if v <= 0:
            raise HTTPException(
                status_code=400,
                detail="Le poids collecté doit être supérieur à 0"
            )
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "date": "15/05/2024",
                "client_id": 1,
                "montant": 5000,
                "exces_poids": 10,
                "poids_collecte": 15
            }
        }

class BonPassageForfaitProduitModel(BaseModel):
    """Modèle pour produit dans un bon de passage forfait"""
    id: Optional[int] = None
    produit: str
    qte: float
    prix: int
    bon_passage_id: int
    
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
        if v <= 0:
            raise HTTPException(
                status_code=400,
                detail="Le prix doit être supérieur à 0"
            )
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "produit": "Conteneur pour déchets 240L",
                "qte": 2.0,
                "prix": 5000,
                "bon_passage_id": 1
            }
        }

class BonPassageForfaitServiceModel(BaseModel):
    """Modèle pour service dans un bon de passage forfait"""
    id: Optional[int] = None
    service: str
    qte: Optional[float] = None
    bon_passage_id: int
    
    @validator('qte')
    def validate_qte(cls, v):
        if v is not None and v <= 0:
            raise HTTPException(
                status_code=400,
                detail="La quantité doit être supérieure à 0"
            )
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "service": "Collecte de déchets industriels",
                "qte": 1.0,
                "bon_passage_id": 1
            }
        }

class VersementForfaitModel(BaseModel):
    """Modèle pour les versements de contrats forfait"""
    id: Optional[int] = None
    date: str
    montant: int
    client_id: int
    contrat_id: int
    
    @validator('date')
    def validate_date_format(cls, v):
        try:
            datetime.strptime(v, '%d/%m/%Y')
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Format de date invalide. Utilisez le format dd/mm/yyyy"
            )
        return v
    
    @validator('montant')
    def validate_montant(cls, v):
        if v <= 0:
            raise HTTPException(
                status_code=400,
                detail="Le montant doit être supérieur à 0"
            )
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "date": "15/05/2024",
                "montant": 50000,
                "client_id": 1,
                "contrat_id": 1
            }
        }