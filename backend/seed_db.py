#!/usr/bin/env python3
"""
Seed the leads.db with sample lead rows for testing.
Run: python seed_db.py
"""
from pathlib import Path
import sqlite3
from datetime import datetime

BASE = Path(__file__).resolve().parent
DB_PATH = BASE / 'leads.db'

SAMPLES = [
    {"name": "Alice Johnson", "phone": "+919876543210", "email": "alice@example.com", "regarding": "Service Inquiry"},
    {"name": "Bob Kumar", "phone": "+919812345678", "email": "bob@example.com", "regarding": "Pricing"},
    {"name": "Chitra Singh", "phone": "+919900112233", "email": "chitra@example.com", "regarding": "Technical Support"},
]

CREATE_SQL = '''
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    regarding TEXT NOT NULL,
    created_at TEXT NOT NULL
);
'''

if __name__ == '__main__':
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(CREATE_SQL)
    cur = conn.cursor()

    inserted = 0
    for s in SAMPLES:
        cur.execute('INSERT INTO leads (name, phone, email, regarding, created_at) VALUES (?, ?, ?, ?, ?)',
                    (s['name'], s['phone'], s.get('email',''), s['regarding'], datetime.utcnow().isoformat(sep=' ', timespec='seconds')))
        inserted += 1

    conn.commit()
    conn.close()
    print(f'Inserted {inserted} sample leads into {DB_PATH}')
