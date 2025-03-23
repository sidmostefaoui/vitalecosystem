#!/usr/bin/env python
"""
Script to create an SQLite database in the db directory
with an Agents table matching the frontend structure
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

# Create the Agents table with columns matching the frontend AgentList
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

# Commit the changes and close the connection
conn.commit()
conn.close()

print("Database created successfully at backend/db/db.sqlite")
print("Created Agents table with columns: id, nom, telephone, whatsapp, gps, regime, notification")
print(f"Inserted {len(agents_data)} records into the Agents table") 