#!/usr/bin/env python
"""
Script to create an SQLite database in the db directory
"""
import sqlite3
import os

# Make sure the backend/db directory exists
os.makedirs('backend/db', exist_ok=True)

# Connect to the database (this will create it if it doesn't exist)
conn = sqlite3.connect('backend/db/db.sqlite')
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

# Sample data for versement_bon_achat
versement_bon_achat_data = [
    (1, 5000.00, 'Chèque', 1),
    (2, 3000.00, 'Espèce', 2),
    (3, 20000.00, 'Chèque', 3),
    (4, 15000.00, 'Espèce', 4),
    (5, 2000.00, 'Chèque', 5)
]

cursor.executemany('''
INSERT INTO Versement_Bon_Achat (id, montant, type, bon_achat_id)
VALUES (?, ?, ?, ?)
''', versement_bon_achat_data)

# Commit the changes and close the connection
conn.commit()
conn.close()

print("Database created successfully at backend/db/db.sqlite")
