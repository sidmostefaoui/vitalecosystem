#!/usr/bin/env python
"""
Script to create an SQLite database in the db directory
"""
import sqlite3
import os

# Make sure the backend/db directory exists
os.makedirs('backend/db', exist_ok=True)

# Connect to the database (this will create it if it doesn't exist)
conn = sqlite3.connect('db.sqlite')
cursor = conn.cursor()

# Add this line to enable foreign key constraints
cursor.execute('PRAGMA foreign_keys = ON;')

# Drop the Agents table if it exists to ensure a clean state
cursor.execute('DROP TABLE IF EXISTS Agents')

# Create the Agents table with columns matching the frontend Agents
cursor.execute('''
CREATE TABLE Agents (
    id INTEGER PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE,
    telephone TEXT NOT NULL UNIQUE,
    whatsapp TEXT NOT NULL UNIQUE,
    gps TEXT NOT NULL UNIQUE,
    regime TEXT NOT NULL,
    notification TEXT NOT NULL
)
''')

# Insert the same mock data that's used in the frontend
agents_data = [
    (1, 'Ahmed Kader', '0555123456', '0555123456', '36.75234, 3.04215', 'Forfait', 'Actif'),
    (2, 'Samira Boumediene', '0661234567', '0661234567', '35.69906, -0.63475', 'Réel', 'Pause'),
    (3, 'Karim Benali', '0770123456', '0770123456', '36.36752, 6.61290', 'Forfait & Réel', 'Actif')
]

cursor.executemany('''
INSERT INTO Agents (id, nom, telephone, whatsapp, gps, regime, notification)
VALUES (?, ?, ?, ?, ?, ?, ?)
''', agents_data)

# Create Produit table
cursor.execute('DROP TABLE IF EXISTS Produit')
cursor.execute('''
CREATE TABLE Produit (
    id INTEGER PRIMARY KEY,
    designation TEXT NOT NULL UNIQUE
)
''')

# Sample data for products
produit_data = [
    (1, 'Conteneur pour déchets 240L'),
    (2, 'Sacs poubelle industriels 100L'),
    (3, 'Kit de nettoyage professionnel')
]

cursor.executemany('''
INSERT INTO Produit (id, designation)
VALUES (?, ?)
''', produit_data)

# Create Service table
cursor.execute('DROP TABLE IF EXISTS Service')
cursor.execute('''
CREATE TABLE Service (
    id INTEGER PRIMARY KEY,
    designation TEXT NOT NULL UNIQUE,
    incineration TEXT NOT NULL CHECK (incineration IN ('Oui', 'Non'))
)
''')

# Sample data for services
service_data = [
    (1, 'Collecte de déchets industriels', 'Non'),
    (2, 'Nettoyage et assainissement', 'Non'),
    (3, 'Conseil en gestion des déchets', 'Oui')
]

cursor.executemany('''
INSERT INTO Service (id, designation, incineration)
VALUES (?, ?, ?)
''', service_data)

# Create Inventaire table
cursor.execute('DROP TABLE IF EXISTS Inventaire')
cursor.execute('''
CREATE TABLE Inventaire (
    id INTEGER PRIMARY KEY,
    produit TEXT NOT NULL UNIQUE,
    qte INTEGER NOT NULL CHECK (qte > 0),
    prix_dernier REAL NOT NULL CHECK (prix_dernier > 0)
)
''')

# Sample data for inventory
inventaire_data = [
    (1, 'Conteneur pour déchets 240L', 10, 15000.00),
    (2, 'Sacs poubelle industriels 100L', 250, 200.00),
    (3, 'Kit de nettoyage professionnel', 5, 8000.00)
]

cursor.executemany('''
INSERT INTO Inventaire (id, produit, qte, prix_dernier)
VALUES (?, ?, ?, ?)
''', inventaire_data)

# Create Fournisseurs table
cursor.execute('DROP TABLE IF EXISTS Fournisseur')
cursor.execute('''
CREATE TABLE Fournisseur (
    id INTEGER PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE,
    telephone TEXT NOT NULL UNIQUE,
    adresse TEXT NOT NULL
)
''')

# Sample data for fournisseurs
fournisseur_data = [
    (1, 'EcoSolutions Algérie', '0555789123', '15 Rue Didouche Mourad, Alger'),
    (2, 'GreenTech SARL', '0661456789', '27 Boulevard Zighout Youcef, Oran'),
    (3, 'EnviroServices Maghreb', '0770234567', '8 Rue des Frères Bouadou, Constantine'),
    (4, 'RecyclAlgeria', '0555123789', '42 Avenue Hassiba Ben Bouali, Alger')
]

cursor.executemany('''
INSERT INTO Fournisseur (id, nom, telephone, adresse)
VALUES (?, ?, ?, ?)
''', fournisseur_data)

# Create Bon_Achats table
cursor.execute('DROP TABLE IF EXISTS Bon_Achats')
cursor.execute('''
CREATE TABLE Bon_Achats (
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL,
    fournisseur TEXT NOT NULL,
    montant_total REAL DEFAULT 0,
    montant_verse REAL DEFAULT 0
)
''')

# Sample data for bon_achats
bon_achats_data = [
    (1, '15/03/2024', 'EcoSolutions Algérie', 15200.00, 0),
    (2, '16/03/2024', 'GreenTech SARL', 8000.00, 0),
    (3, '17/03/2024', 'EnviroServices Maghreb', 45000.00, 0),
    (4, '20/03/2024', 'RecyclAlgeria', 40000.00, 0),
    (5, '22/03/2024', 'EcoSolutions Algérie', 8000.00, 0),
    (6, '25/03/2024', 'GreenTech SARL', 150000.00, 0),
    (7, '27/03/2024', 'EnviroServices Maghreb', 30000.00, 0),
    (8, '29/03/2024', 'RecyclAlgeria', 32000.00, 0),
    (9, '01/04/2024', 'EcoSolutions Algérie', 30000.00, 0),
    (10, '03/04/2024', 'GreenTech SARL', 25000.00, 0)
]

cursor.executemany('''
INSERT INTO Bon_Achats (id, date, fournisseur, montant_total, montant_verse)
VALUES (?, ?, ?, ?, ?)
''', bon_achats_data)

# Create Produits_Bon_Achat table
cursor.execute('DROP TABLE IF EXISTS Produits_Bon_Achat')
cursor.execute('''
CREATE TABLE Produits_Bon_Achat (
    id INTEGER PRIMARY KEY,
    produit TEXT NOT NULL,
    qte INTEGER NOT NULL CHECK (qte > 0),
    prix REAL CHECK (prix IS NULL OR prix > 0),
    bon_achat_id INTEGER NOT NULL,
    FOREIGN KEY (bon_achat_id) REFERENCES Bon_Achats(id) ON DELETE CASCADE
)
''')

# Sample data for produits_bon_achat
produits_bon_achat_data = [
    (1, 'Conteneur pour déchets 240L', 5, 15000.00, 1),
    (2, 'Sacs poubelle industriels 100L', 100, 200.00, 1),
    (3, 'Kit de nettoyage professionnel', 2, 8000.00, 2),
    (4, 'Conteneur pour déchets 240L', 3, 15000.00, 3),
    (5, 'Sacs poubelle industriels 100L', 200, 200.00, 4),
    (6, 'Kit de nettoyage professionnel', 1, 8000.00, 5),
    (7, 'Conteneur pour déchets 240L', 10, 15000.00, 6),
    (8, 'Sacs poubelle industriels 100L', 150, None, 7),  # Example with NULL price
    (9, 'Kit de nettoyage professionnel', 4, 8000.00, 8),
    (10, 'Conteneur pour déchets 240L', 2, 15000.00, 9)
]

cursor.executemany('''
INSERT INTO Produits_Bon_Achat (id, produit, qte, prix, bon_achat_id)
VALUES (?, ?, ?, ?, ?)
''', produits_bon_achat_data)

# Create Versement_Bon_Achat table
cursor.execute('DROP TABLE IF EXISTS Versement_Bon_Achat')
cursor.execute('''
CREATE TABLE Versement_Bon_Achat (
    id INTEGER PRIMARY KEY,
    montant REAL NOT NULL CHECK (montant > 0),
    type TEXT NOT NULL CHECK (type IN ('Chèque', 'Espèce')),
    bon_achat_id INTEGER NOT NULL,
    FOREIGN KEY (bon_achat_id) REFERENCES Bon_Achats(id) ON DELETE CASCADE
)
''')

# Create Client_Forfait table (formerly Client)
cursor.execute('DROP TABLE IF EXISTS Client_Forfait')
cursor.execute('''
CREATE TABLE Client_Forfait (
    id INTEGER PRIMARY KEY,
    nom TEXT NOT NULL,
    specialite TEXT,
    tel TEXT NOT NULL,
    mode INTEGER NOT NULL CHECK (mode IN (30, 60, 90)),
    agent TEXT NOT NULL,
    etat_contrat TEXT CHECK (etat_contrat IS NULL OR etat_contrat IN ('Actif', 'Pause', 'Terminé')),
    debut_contrat TEXT,
    fin_contrat TEXT
)
''')

# Sample data for clients
client_data = [
    (1, 'Algérie Telecom', 'Télécommunications', '023456789', 30, 'Ahmed Kader', None, None, None),
    (2, 'SEAAL', 'Services des eaux', '021234567', 60, 'Samira Boumediene', None, None, None),
    (3, 'Clinique El Azhar', 'Santé', '0555123456', 90, 'Karim Benali', None, None, None),
    (4, 'El Watan', 'Presse', '0661234567', 30, 'Ahmed Kader', None, None, None),
    (5, 'Air Algérie', 'Transport aérien', '021987654', 60, 'Samira Boumediene', None, None, None)
]

cursor.executemany('''
INSERT INTO Client_Forfait (id, nom, specialite, tel, mode, agent, etat_contrat, debut_contrat, fin_contrat)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
''', client_data)

# Create Contrat_Forfait table
cursor.execute('DROP TABLE IF EXISTS Contrat_Forfait')
cursor.execute('''
CREATE TABLE Contrat_Forfait (
    id INTEGER PRIMARY KEY,
    date_debut TEXT NOT NULL,
    date_fin TEXT NOT NULL,
    montant INTEGER NOT NULL CHECK (montant > 0),
    prix_exces_poids INTEGER NOT NULL CHECK (prix_exces_poids > 0),
    poids_forfait INTEGER NOT NULL CHECK (poids_forfait > 0),
    etat TEXT NOT NULL DEFAULT 'Actif' CHECK (etat IN ('Actif', 'Pause', 'Terminé')),
    client_id INTEGER NOT NULL,
    FOREIGN KEY (client_id) REFERENCES Client_Forfait(id) ON DELETE CASCADE,
    CHECK (date_fin > date_debut)
)
''')

# Sample data for terminated contracts
contrat_data = [
    # Terminated contracts for Algérie Telecom (Client ID 1)
    ('01/01/2023', '30/06/2023', 100000, 500, 100, 'Terminé', 1),
    ('01/07/2023', '31/12/2023', 120000, 600, 100, 'Terminé', 1),
    
    # Terminated contracts for SEAAL (Client ID 2)
    ('01/03/2023', '31/08/2023', 150000, 700, 100, 'Terminé', 2),
    
    # Terminated contracts for Clinique El Azhar (Client ID 3)
    ('01/01/2023', '30/04/2023', 80000, 400, 100, 'Terminé', 3),
    ('01/05/2023', '31/08/2023', 85000, 450, 100, 'Terminé', 3),
    ('01/09/2023', '31/12/2023', 90000, 500, 100, 'Terminé', 3),
    
    # Terminated contract for El Watan (Client ID 4)
    ('01/01/2023', '31/03/2023', 60000, 300, 100, 'Terminé', 4),
    ('01/04/2023', '30/06/2023', 65000, 350, 100, 'Terminé', 4),
    ('01/07/2023', '30/09/2023', 70000, 400, 100, 'Terminé', 4),
    ('01/10/2023', '31/12/2023', 75000, 450, 100, 'Terminé', 4),
    
    # Terminated contract for Air Algérie (Client ID 5)
    ('01/01/2023', '31/03/2023', 200000, 1000, 100, 'Terminé', 5),
    ('01/04/2023', '30/06/2023', 220000, 1100, 100, 'Terminé', 5),
    ('01/07/2023', '31/12/2023', 240000, 1200, 100, 'Terminé', 5)
]

cursor.executemany('''
INSERT INTO Contrat_Forfait (date_debut, date_fin, montant, prix_exces_poids, poids_forfait, etat, client_id)
VALUES (?, ?, ?, ?, ?, ?, ?)
''', contrat_data)

# Create Bon_Passage_Forfait table
cursor.execute('DROP TABLE IF EXISTS Bon_Passage_Forfait')
cursor.execute('''
CREATE TABLE Bon_Passage_Forfait (
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL,
    montant INTEGER NOT NULL CHECK (montant >= 0),
    exces_poids INTEGER NOT NULL CHECK (exces_poids >= 0),
    poids_collecte INTEGER NOT NULL CHECK (poids_collecte > 0),
    client_id INTEGER NOT NULL,
    contrat_id INTEGER NOT NULL,
    FOREIGN KEY (client_id) REFERENCES Client_Forfait(id) ON DELETE CASCADE,
    FOREIGN KEY (contrat_id) REFERENCES Contrat_Forfait(id) ON DELETE CASCADE
)
''')

# Create Bon_Passage_Forfait_Produits table
cursor.execute('DROP TABLE IF EXISTS Bon_Passage_Forfait_Produits')
cursor.execute('''
CREATE TABLE Bon_Passage_Forfait_Produits (
    id INTEGER PRIMARY KEY,
    produit TEXT NOT NULL,
    qte REAL NOT NULL CHECK (qte > 0),
    prix INTEGER NOT NULL CHECK (prix > 0),
    bon_passage_id INTEGER NOT NULL,
    FOREIGN KEY (bon_passage_id) REFERENCES Bon_Passage_Forfait(id) ON DELETE CASCADE
)
''')

# Create Bon_Passage_Forfait_Services table
cursor.execute('DROP TABLE IF EXISTS Bon_Passage_Forfait_Services')
cursor.execute('''
CREATE TABLE Bon_Passage_Forfait_Services (
    id INTEGER PRIMARY KEY,
    service TEXT NOT NULL,
    qte REAL CHECK (qte IS NULL OR qte > 0),
    bon_passage_id INTEGER NOT NULL,
    FOREIGN KEY (bon_passage_id) REFERENCES Bon_Passage_Forfait(id) ON DELETE CASCADE
)
''')

# Create Versement_Forfait table
cursor.execute('DROP TABLE IF EXISTS Versement_Forfait')
cursor.execute('''
CREATE TABLE Versement_Forfait (
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL,
    montant INTEGER NOT NULL CHECK (montant > 0),
    client_id INTEGER NOT NULL,
    contrat_id INTEGER NOT NULL,
    FOREIGN KEY (client_id) REFERENCES Client_Forfait(id) ON DELETE CASCADE,
    FOREIGN KEY (contrat_id) REFERENCES Contrat_Forfait(id) ON DELETE CASCADE
)
''')

# Commit the changes and close the connection
conn.commit()
conn.close()

print("Database created successfully at backend/db/db.sqlite")
