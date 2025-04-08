#!/usr/bin/env python
import sqlite3
import os

# This script is run from database/prod directory, so no need to create other directories
# Just create the database in the current directory
conn = sqlite3.connect('db.sqlite')
cursor = conn.cursor()

cursor.execute('PRAGMA foreign_keys = ON;')

cursor.execute('DROP TABLE IF EXISTS Agents')

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

cursor.execute('DROP TABLE IF EXISTS Produit')
cursor.execute('''
CREATE TABLE Produit (
    id INTEGER PRIMARY KEY,
    designation TEXT NOT NULL UNIQUE
)
''')

cursor.execute('DROP TABLE IF EXISTS Service')
cursor.execute('''
CREATE TABLE Service (
    id INTEGER PRIMARY KEY,
    designation TEXT NOT NULL UNIQUE,
    incineration TEXT NOT NULL CHECK (incineration IN ('Oui', 'Non'))
)
''')

cursor.execute('DROP TABLE IF EXISTS Inventaire')
cursor.execute('''
CREATE TABLE Inventaire (
    id INTEGER PRIMARY KEY,
    produit TEXT NOT NULL UNIQUE,
    qte INTEGER NOT NULL CHECK (qte > 0),
    prix_dernier REAL NOT NULL CHECK (prix_dernier > 0)
)
''')

cursor.execute('DROP TABLE IF EXISTS Fournisseur')
cursor.execute('''
CREATE TABLE Fournisseur (
    id INTEGER PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE,
    telephone TEXT NOT NULL UNIQUE,
    adresse TEXT NOT NULL
)
''')

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

conn.commit()
conn.close()

print("Database created successfully at database/prod/db.sqlite") 