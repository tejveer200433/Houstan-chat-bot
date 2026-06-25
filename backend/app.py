from datetime import datetime
import sqlite3
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / 'leads.db'

app = Flask(__name__)
CORS(app)

CREATE_TABLE_SQL = '''
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    regarding TEXT NOT NULL,
    created_at TEXT NOT NULL
);
'''


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = get_db_connection()
    conn.execute(CREATE_TABLE_SQL)
    conn.commit()
    conn.close()


@app.before_request
def startup():
    init_db()


@app.route('/api/leads', methods=['POST'])
def save_lead():
    payload = request.get_json(silent=True) or {}
    name = (payload.get('name') or '').strip()
    phone = (payload.get('phone') or '').strip()
    email = (payload.get('email') or '').strip()
    regarding = (payload.get('regarding') or '').strip()

    if not name or not phone or not regarding:
        return jsonify({'success': False, 'message': 'Missing required lead fields.'}), 400

    created_at = datetime.utcnow().isoformat(sep=' ', timespec='seconds')
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO leads (name, phone, email, regarding, created_at) VALUES (?, ?, ?, ?, ?)',
        (name, phone, email, regarding, created_at)
    )
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': 'Lead saved'})


@app.route('/api/leads', methods=['GET'])
def list_leads():
    conn = get_db_connection()
    cursor = conn.execute('SELECT id, name, phone, email, regarding, created_at FROM leads ORDER BY created_at DESC')
    leads = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify({'success': True, 'leads': leads})


@app.route('/api/leads/<int:lead_id>', methods=['PUT'])
def update_lead(lead_id):
    payload = request.get_json(silent=True) or {}
    name = (payload.get('name') or '').strip()
    phone = (payload.get('phone') or '').strip()
    email = (payload.get('email') or '').strip()
    regarding = (payload.get('regarding') or '').strip()

    if not name or not phone or not regarding:
        return jsonify({'success': False, 'message': 'Missing required lead fields.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE leads SET name = ?, phone = ?, email = ?, regarding = ? WHERE id = ?',
        (name, phone, email, regarding, lead_id)
    )
    conn.commit()

    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'success': False, 'message': 'Lead not found.'}), 404

    conn.close()
    return jsonify({'success': True, 'message': 'Lead updated'})


@app.route('/api/leads/<int:lead_id>', methods=['DELETE'])
def delete_lead(lead_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM leads WHERE id = ?', (lead_id,))
    conn.commit()

    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'success': False, 'message': 'Lead not found.'}), 404

    conn.close()
    return jsonify({'success': True, 'message': 'Lead deleted'})


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)
