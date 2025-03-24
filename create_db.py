#!/usr/bin/env python
"""
Script to create an SQLite database in the db directory
with tables for Agents, Produit, and Service
"""
import sqlite3
import os

# Make sure the backend/db directory exists
os.makedirs('backend/db', exist_ok=True)

# Connect to the database (this will create it if it doesn't exist)
conn = sqlite3.connect('backend/db/db.sqlite')
cursor = conn.cursor()

# Drop the Agents table if it exists to ensure a clean state
cursor.execute('DROP TABLE IF EXISTS Agents')

# Create the Agents table with columns matching the frontend Agents
cursor.execute('''
CREATE TABLE Agents (
    id INTEGER PRIMARY KEY,
    nom TEXT NOT NULL,
    telephone TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    gps TEXT NOT NULL,
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

# Create Fournisseurs table
cursor.execute('DROP TABLE IF EXISTS Fournisseur')
cursor.execute('''
CREATE TABLE Fournisseur (
    id INTEGER PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE,
    telephone TEXT NOT NULL,
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

# Commit the changes and close the connection
conn.commit()
conn.close()

print("Database created successfully at backend/db/db.sqlite")
print("Created Agents table with columns: id, nom, telephone, whatsapp, gps, regime, notification")
print(f"Inserted {len(agents_data)} records into the Agents table")
print("Created Produit table with columns: id, designation")
print(f"Inserted {len(produit_data)} records into the Produit table")
print("Created Service table with columns: id, designation, incineration")
print(f"Inserted {len(service_data)} records into the Service table")
print("Created Fournisseur table with columns: id, nom, telephone, adresse")
print(f"Inserted {len(fournisseur_data)} records into the Fournisseur table") 
