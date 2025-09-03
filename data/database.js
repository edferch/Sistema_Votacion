const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'votaciones.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite');
  }
});

db.serialize(() => {
  // Tabla de votaciones
  db.run(`
    CREATE TABLE IF NOT EXISTS votaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      activa INTEGER DEFAULT 0
    )
  `);

  // Tabla de candidatos
  db.run(`
    CREATE TABLE IF NOT EXISTS candidatos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      votacion_id INTEGER,
      FOREIGN KEY (votacion_id) REFERENCES votaciones(id)
    )
  `);

  // Tabla de votos
  db.run(`
    CREATE TABLE IF NOT EXISTS votos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      votacion_id INTEGER,
      candidato_id INTEGER,
      fingerprint TEXT, -- usado para prevenir votos duplicados
      FOREIGN KEY (votacion_id) REFERENCES votaciones(id),
      FOREIGN KEY (candidato_id) REFERENCES candidatos(id)
    )
  `);
});

module.exports = db;