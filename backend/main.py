from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel, validator
from typing import List, Optional, Union
from datetime import datetime, timedelta
import logging
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

# Chargement des variables d'environnement
load_dotenv()

# Configuration des logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configuration CORS plus permissive
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permet toutes les origines
    allow_credentials=True,
    allow_methods=["*"],  # Permet toutes les méthodes
    allow_headers=["*"],  # Permet tous les headers
)

# Configuration JWT avec valeurs par défaut
SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Gestion des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Modèles de données
class User(BaseModel):
    username: str
    email: str
    role: str
    disabled: Optional[bool] = False

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# Base de données simulée des utilisateurs
users_db = {
    "admin": {
        "username": "admin",
        "email": "admin@transport-algerie.dz",
        "role": "admin",
        "hashed_password": pwd_context.hash("123"),  # Mot de passe simplifié: 123
        "disabled": False
    },
    "chauffeur1": {
        "username": "karim.benali",
        "email": "k.benali@transport-algerie.dz",
        "role": "chauffeur",
        "hashed_password": pwd_context.hash("123"),  # Mot de passe simplifié: 123
        "disabled": False
    },
    "chauffeur2": {
        "username": "ahmed.meziane",
        "email": "a.meziane@transport-algerie.dz",
        "role": "chauffeur",
        "hashed_password": pwd_context.hash("123"),  # Mot de passe simplifié: 123
        "disabled": False
    },
    "dispatcher1": {
        "username": "sofiane.hamdi",
        "email": "s.hamdi@transport-algerie.dz",
        "role": "dispatcher",
        "hashed_password": pwd_context.hash("123"),  # Mot de passe simplifié: 123
        "disabled": False
    }
}

# Fonctions d'authentification améliorées
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        logger.info(f"Tentative de vérification de mot de passe")
        result = pwd_context.verify(plain_password, hashed_password)
        if result:
            logger.info("Vérification du mot de passe réussie")
        else:
            logger.warning("Vérification du mot de passe échouée")
        return result
    except Exception as e:
        logger.error(f"Erreur lors de la vérification du mot de passe: {str(e)}")
        return False

def get_user(db: dict, username: str) -> Optional[UserInDB]:
    try:
        if username in db:
            user_dict = db[username].copy()
            return UserInDB(**user_dict)
        return None
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de l'utilisateur: {str(e)}")
        return None

def authenticate_user(db: dict, username: str, password: str) -> Optional[UserInDB]:
    try:
        logger.info(f"Tentative de connexion pour {username}")
        user = get_user(db, username)
        
        if not user:
            logger.warning(f"Utilisateur {username} non trouvé")
            return None
        
        logger.info(f"Vérification du mot de passe pour {username}")
        if not verify_password(password, user.hashed_password):
            logger.warning(f"Mot de passe incorrect pour {username}")
            return None
        
        logger.info(f"Connexion réussie pour {username}")
        return user
    except Exception as e:
        logger.error(f"Erreur lors de l'authentification: {str(e)}")
        return None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    try:
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except Exception as e:
        logger.error(f"Erreur lors de la création du token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la création du token"
        )

# Route d'authentification améliorée
@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        logger.info(f"Tentative de connexion pour l'utilisateur: {form_data.username}")
        
        # Vérifier si l'utilisateur existe
        if form_data.username not in users_db:
            logger.warning(f"Utilisateur non trouvé: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Nom d'utilisateur ou mot de passe incorrect",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Récupérer l'utilisateur et vérifier le mot de passe
        user = authenticate_user(users_db, form_data.username, form_data.password)
        if not user:
            logger.warning(f"Échec de l'authentification pour: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Nom d'utilisateur ou mot de passe incorrect",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Créer le token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username, "role": user.role},
            expires_delta=access_token_expires
        )
        
        logger.info(f"Token créé avec succès pour: {user.username}")
        
        # Retourner la réponse
        return Token(
            access_token=access_token,
            token_type="bearer",
            user={
                "username": user.username,
                "role": user.role,
                "email": user.email
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur inattendue lors de la connexion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la connexion"
        )

# Middleware de vérification du token amélioré
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Identifiants invalides",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None or role is None:
            logger.warning("Token invalide: username ou role manquant")
            raise credentials_exception
        token_data = TokenData(username=username, role=role)
    except JWTError as e:
        logger.error(f"Erreur de décodage du token: {str(e)}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Erreur inattendue lors de la vérification du token: {str(e)}")
        raise credentials_exception

    user = get_user(users_db, token_data.username)
    if user is None:
        logger.warning(f"Utilisateur {token_data.username} non trouvé")
        raise credentials_exception
    return user

# Décorateur de vérification des rôles
def check_role(allowed_roles: list):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Opération non autorisée"
            )
        return current_user
    return role_checker

# Modèles de base
class AdresseBase(BaseModel):
    rue: str
    ville: str
    wilaya: str
    code_postal: str
    complement: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class Mission(BaseModel):
    id: int
    client_id: int
    chauffeur_id: str  # Changé en str car on utilise les usernames
    type_mission: str
    description: str
    date_debut: str
    date_fin: str
    statut: str
    montant: float
    adresse_pickup: AdresseBase
    adresse_delivery: AdresseBase

# Base de données simulée pour les missions
missions_db = [
    {
        "id": 1,
        "client_id": 1,
        "chauffeur_id": "karim.benali",
        "type_mission": "Transport équipement pétrolier",
        "description": "Transport d'équipement de forage",
        "date_debut": "2024-03-20T08:00:00",
        "date_fin": "2024-03-20T16:00:00",
        "statut": "planifié",
        "montant": 85000.00,
        "adresse_pickup": {
            "rue": "Zone Industrielle",
            "ville": "Hassi Messaoud",
            "wilaya": "Ouargla",
            "code_postal": "30500"
        },
        "adresse_delivery": {
            "rue": "Site de forage HMD-123",
            "ville": "Hassi Messaoud",
            "wilaya": "Ouargla",
            "code_postal": "30500"
        }
    }
]

# Routes pour les missions
@app.get("/api/missions")
async def get_missions(current_user: User = Depends(get_current_user)):
    try:
        if current_user.role == "chauffeur":
            # Filtrer pour ne montrer que les missions du chauffeur
            user_missions = [m for m in missions_db if m["chauffeur_id"] == current_user.username]
            return user_missions
        # Admin et dispatcher voient toutes les missions
        return missions_db
    except Exception as e:
        logger.error(f"Erreur dans get_missions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération des missions"
        )

@app.post("/api/missions", response_model=Mission, status_code=201)
async def create_mission(mission: Mission):
    new_id = max(m["id"] for m in missions_db) + 1 if missions_db else 1
    new_mission = Mission(id=new_id, **mission.dict())
    missions_db.append(new_mission)
    return new_mission

@app.put("/api/missions/{mission_id}", response_model=Mission)
async def update_mission(mission_id: int, mission: Mission):
    mission_idx = next((idx for idx, m in enumerate(missions_db) if m["id"] == mission_id), None)
    if mission_idx is None:
        raise HTTPException(status_code=404, detail="Mission non trouvée")
    updated_mission = Mission(id=mission_id, **mission.dict())
    missions_db[mission_idx] = updated_mission
    return updated_mission

@app.delete("/api/missions/{mission_id}", status_code=204)
async def delete_mission(mission_id: int):
    mission_idx = next((idx for idx, m in enumerate(missions_db) if m["id"] == mission_id), None)
    if mission_idx is None:
        raise HTTPException(status_code=404, detail="Mission non trouvée")
    missions_db.pop(mission_idx)

# Nouvelle route pour obtenir l'itinéraire optimisé
@app.get("/api/missions/{mission_id}/route")
async def get_mission_route(mission_id: int):
    mission = next((m for m in missions_db if m["id"] == mission_id), None)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission non trouvée")
    
    if not mission["adresse_pickup"] or not mission["adresse_delivery"]:
        raise HTTPException(status_code=400, detail="Adresses manquantes")
    
    # Ici vous pourriez intégrer un service de calcul d'itinéraire
    # comme Google Maps Directions API ou OSRM
    return {
        "distance": "12.5 km",  # À calculer avec l'API
        "duration": "25 min",   # À calculer avec l'API
        "points": [
            {"lat": mission["adresse_pickup"]["latitude"], "lng": mission["adresse_pickup"]["longitude"]},
            {"lat": mission["adresse_delivery"]["latitude"], "lng": mission["adresse_delivery"]["longitude"]}
        ]
    } 

# Nouvelle route pour créer des missions récurrentes
@app.post("/api/missions/recurrence", response_model=List[Mission])
async def create_recurring_missions(mission: Mission):
    if not mission.recurrence:
        raise HTTPException(status_code=400, detail="Récurrence non spécifiée")

    missions_created = []
    date_debut = datetime.strptime(mission.date_debut, "%Y-%m-%dT%H:%M:%S")
    date_fin = datetime.strptime(mission.date_fin, "%Y-%m-%dT%H:%M:%S")
    duree = date_fin - date_debut

    current_date = date_debut
    occurrences = 0

    while True:
        # Vérifier les conditions d'arrêt
        if mission.recurrence.fin_recurrence:
            fin_recurrence = datetime.strptime(mission.recurrence.fin_recurrence, "%Y-%m-%d")
            if current_date > fin_recurrence:
                break

        if mission.recurrence.nombre_occurrences and occurrences >= mission.recurrence.nombre_occurrences:
            break

        # Créer la nouvelle mission
        new_mission_data = mission.dict(exclude={'recurrence'})
        new_mission_data.update({
            'date_debut': current_date.strftime("%Y-%m-%dT%H:%M:%S"),
            'date_fin': (current_date + duree).strftime("%Y-%m-%dT%H:%M:%S")
        })

        # Ajouter à la base de données
        new_id = max(m["id"] for m in missions_db) + 1 if missions_db else 1
        new_mission = Mission(id=new_id, **new_mission_data)
        missions_db.append(new_mission)
        missions_created.append(new_mission)

        # Calculer la prochaine date
        if mission.recurrence.type == "daily":
            current_date += timedelta(days=mission.recurrence.interval)
        elif mission.recurrence.type == "weekly":
            current_date += timedelta(weeks=mission.recurrence.interval)
        elif mission.recurrence.type == "monthly":
            # Ajouter des mois tout en préservant le jour du mois
            next_month = current_date.replace(day=1) + timedelta(days=32 * mission.recurrence.interval)
            current_date = next_month.replace(day=min(current_date.day, (next_month.replace(day=1) + timedelta(days=32)).day - 1))

        occurrences += 1

    return missions_created 

# Base de données simulée pour les paramètres utilisateur
user_settings_db = {}

@app.get("/api/users/settings")
async def get_user_settings(current_user: User = Depends(get_current_user)):
    if current_user.username not in user_settings_db:
        # Paramètres par défaut
        user_settings_db[current_user.username] = {
            "notifications": {
                "email": True,
                "push": True,
                "sound": False
            },
            "display": {
                "darkMode": False,
                "animations": True
            },
            "security": {
                "twoFactorEnabled": False
            }
        }
    return user_settings_db[current_user.username]

@app.put("/api/users/settings")
async def update_user_settings(
    settings: dict,
    current_user: User = Depends(get_current_user)
):
    user_settings_db[current_user.username] = settings
    return settings

@app.put("/api/users/password")
async def change_password(
    old_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user)
):
    if not verify_password(old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Ancien mot de passe incorrect"
        )
    
    # Mettre à jour le mot de passe
    user_idx = next((idx for idx, u in enumerate(users_db) 
                    if u["username"] == current_user.username), None)
    if user_idx is not None:
        users_db[user_idx]["hashed_password"] = pwd_context.hash(new_password)
    
    return {"message": "Mot de passe mis à jour avec succès"} 

# Modèle pour les notifications
class Notification(BaseModel):
    id: int
    type: str
    message: str
    date: str
    priorite: str
    lu: bool = False

# Base de données simulée pour les notifications
notifications_db = []

@app.get("/api/notifications")
async def get_notifications(current_user: User = Depends(get_current_user)):
    try:
        user_notifications = []
        
        # Notifications d'échéances pour admin
        if current_user.role == "admin":
            echeances = await get_echeances()
            for notif in echeances:
                user_notifications.append({
                    "id": len(user_notifications) + 1,
                    "type": "renouvellement",
                    "message": f"Renouvellement - {notif['client']}",
                    "date": notif['date_echeance'],
                    "priorite": notif['priorite'],
                    "lu": False
                })
        
        # Notifications de missions pour chauffeur
        if current_user.role == "chauffeur":
            chauffeur_missions = [m for m in missions_db if m["chauffeur_id"] == current_user.username]
            for mission in chauffeur_missions:
                if mission["date_debut"]:
                    try:
                        date_debut = datetime.strptime(mission["date_debut"], "%Y-%m-%dT%H:%M:%S")
                        if date_debut > datetime.now():
                            user_notifications.append({
                                "id": len(user_notifications) + 1,
                                "type": "mission",
                                "message": f"Mission prévue - {mission['type_mission']}",
                                "date": mission["date_debut"],
                                "priorite": "normale",
                                "lu": False
                            })
                    except ValueError as e:
                        logger.error(f"Erreur de format de date: {e}")
                        continue

        return user_notifications
    except Exception as e:
        logger.error(f"Erreur dans get_notifications: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération des notifications"
        )

@app.put("/api/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user)
):
    notification = next(
        (n for n in notifications_db if n["id"] == notification_id), 
        None
    )
    if notification:
        notification["lu"] = True
    return {"success": True} 

# Base de données simulée pour les clients
clients_db = [
    {
        "id": 1,
        "nom": "Sonatrach",
        "contact": "Mohamed Boudiaf",
        "email": "contact@sonatrach.dz",
        "telephone": "+213 21 54 70 00",
        "adresse": {
            "rue": "Djenane El Malik",
            "ville": "Hydra",
            "wilaya": "Alger",
            "code_postal": "16000"
        }
    },
    {
        "id": 2,
        "nom": "Naftal",
        "contact": "Ahmed Benali",
        "email": "contact@naftal.dz",
        "telephone": "+213 21 44 55 66",
        "adresse": {
            "rue": "Route de Bab Ezzouar",
            "ville": "Alger",
            "wilaya": "Alger",
            "code_postal": "16000"
        }
    }
]

# Routes pour les clients
@app.get("/api/clients")
async def get_clients(current_user: User = Depends(check_role(["admin", "dispatcher"]))):
    try:
        return clients_db
    except Exception as e:
        logger.error(f"Erreur dans get_clients: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération des clients"
        )

@app.get("/api/clients/{client_id}")
async def get_client(client_id: int, current_user: User = Depends(get_current_user)):
    client = next((c for c in clients_db if c["id"] == client_id), None)
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return client

# Base de données simulée des chauffeurs
chauffeurs_db = [user for user in users_db.values() if user["role"] == "chauffeur"]

# Routes pour les chauffeurs
@app.get("/api/chauffeurs")
async def get_chauffeurs(current_user: User = Depends(check_role(["admin", "dispatcher"]))):
    try:
        return chauffeurs_db
    except Exception as e:
        logger.error(f"Erreur dans get_chauffeurs: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération des chauffeurs"
        )

@app.get("/api/chauffeurs/{chauffeur_id}")
async def get_chauffeur(chauffeur_id: int, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "dispatcher"]:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    chauffeur = next((c for c in chauffeurs_db if c["id"] == chauffeur_id), None)
    if not chauffeur:
        raise HTTPException(status_code=404, detail="Chauffeur non trouvé")
    return chauffeur

# Fonction pour obtenir les échéances (utilisée dans les notifications)
async def get_echeances():
    # Simuler des échéances pour les contrats/factures
    return [
        {
            "client": "Sonatrach",
            "date_echeance": "2024-04-01",
            "priorite": "haute"
        },
        {
            "client": "Cevital",
            "date_echeance": "2024-04-15",
            "priorite": "normale"
        }
    ]

# Ajout de plus de missions dans la base de données
missions_db.extend([
    {
        "id": 2,
        "client_id": 2,
        "chauffeur_id": "ahmed.meziane",
        "type_mission": "Transport alimentaire",
        "description": "Transport de produits Cevital",
        "date_debut": "2024-03-21T07:00:00",
        "date_fin": "2024-03-21T19:00:00",
        "statut": "planifié",
        "montant": 65000.00,
        "adresse_pickup": {
            "rue": "Zone Industrielle",
            "ville": "Béjaïa",
            "wilaya": "Béjaïa",
            "code_postal": "06000"
        },
        "adresse_delivery": {
            "rue": "Marché de gros",
            "ville": "Sétif",
            "wilaya": "Sétif",
            "code_postal": "19000"
        }
    }
]) 

# Routes pour le dashboard
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    try:
        total_missions = len(missions_db)
        missions_en_cours = len([m for m in missions_db if m["statut"] == "en_cours"])
        missions_planifiees = len([m for m in missions_db if m["statut"] == "planifié"])
        missions_terminees = len([m for m in missions_db if m["statut"] == "terminé"])
        
        return {
            "total_missions": total_missions,
            "missions_en_cours": missions_en_cours,
            "missions_planifiees": missions_planifiees,
            "missions_terminees": missions_terminees,
            "total_chauffeurs": len(chauffeurs_db),
            "total_clients": len(clients_db)
        }
    except Exception as e:
        logger.error(f"Erreur dans get_dashboard_stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération des statistiques"
        )

# Routes pour les notifications
@app.get("/api/notifications/echeances")
async def get_notifications(current_user: User = Depends(get_current_user)):
    try:
        # Simuler des notifications basées sur les missions à venir
        notifications = []
        today = datetime.now()
        
        for mission in missions_db:
            date_debut = datetime.fromisoformat(mission["date_debut"])
            if date_debut > today and (date_debut - today).days <= 7:
                notifications.append({
                    "id": len(notifications) + 1,
                    "type": "mission_proche",
                    "message": f"Mission {mission['id']} prévue pour le {mission['date_debut']}",
                    "date": today.isoformat(),
                    "lu": False
                })
        
        return notifications
    except Exception as e:
        logger.error(f"Erreur dans get_notifications: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la récupération des notifications"
        )

# Route de test pour l'authentification
@app.get("/api/test-auth")
async def test_auth(current_user: User = Depends(get_current_user)):
    return {
        "message": "Authentification réussie",
        "user": {
            "username": current_user.username,
            "role": current_user.role,
            "email": current_user.email
        }
    } 