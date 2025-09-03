const express = require('express');
const db = require('../data/database');
const socket = require('../socket');
const io = socket.getIO();

const router = express.Router();

router.post('/crear-votacion', (req, res) => {
  const { nombre } = req.body;
  db.run('INSERT INTO votaciones (nombre) VALUES (?)', [nombre], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al crear votación' });
    }
    res.json({ id: this.lastID });
  });
});

router.post('/agregar-candidato', (req, res) => {
  const { nombre, votacion_id } = req.body;
  db.run('INSERT INTO candidatos (nombre, votacion_id) VALUES (?, ?)', [nombre, votacion_id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al agregar candidato' });
    }
    res.json({ id: this.lastID });
  });
});

router.get('/candidatos/:votacion_id', (req, res) => {
  const id = req.params.votacion_id;
  db.all('SELECT * FROM candidatos WHERE votacion_id = ?', [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener candidatos' });
    }
    res.json(rows);
  });
});

router.get('/votacion-activa', (req, res) => {
  db.get('SELECT * FROM votaciones WHERE activa = 1', (err, votacion) => {
    if (err) return res.status(500).json({ error: 'Error al obtener votación activa' });
    if (!votacion) return res.json(null);

    db.all('SELECT * FROM candidatos WHERE votacion_id = ?', [votacion.id], (err2, candidatos) => {
      if (err2) return res.status(500).json({ error: 'Error al obtener candidatos' });

      res.json({
        votacion,
        candidatos
      });
    });
  });
});

router.post('/activar-votacion', (req, res) => {
  const { votacion_id } = req.body;

  db.run('UPDATE votaciones SET activa = 0', [], function(err1) {
    if (err1) return res.status(500).json({ error: 'Error al desactivar otras votaciones' });

    db.run('UPDATE votaciones SET activa = 1 WHERE id = ?', [votacion_id], function(err2) {
      if (err2) return res.status(500).json({ error: 'Error al activar votación' });

      io.emit('votacionCambiada');

      res.json({ mensaje: 'Votación activada correctamente' });
    });
  });
});

router.post('/finalizar-votacion', (req, res) => {
  const { votacion_id } = req.body;

  db.run('UPDATE votaciones SET activa = 0 WHERE id = ?', [votacion_id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al finalizar la votación' });
    }

    io.emit('votacionCambiada');

    res.json({ mensaje: 'Votación finalizada' });
  });
});

module.exports = router;

router.get('/resultados-actuales', (req, res) => {
  db.get('SELECT id FROM votaciones WHERE activa = 1', (err, votacion) => {
    if (err || !votacion) return res.json([]);

    db.all(
      'SELECT candidatos.nombre, COUNT(votos.id) as votos FROM candidatos LEFT JOIN votos ON candidatos.id = votos.candidato_id WHERE candidatos.votacion_id = ? GROUP BY candidatos.id',
      [votacion.id],
      (err2, rows) => {
        if (err2) return res.status(500).json({ error: 'Error al obtener resultados' });
        res.json(rows);
      }
    );
  });
});

router.post('/voto-manual', (req, res) => {
  const { candidato_id, cantidad = 1 } = req.body;

  db.get('SELECT id FROM votaciones WHERE activa = 1', (err, votacion) => {
    if (err || !votacion) {
      return res.status(500).json({ error: 'No hay votación activa' });
    }

    const stmt = db.prepare('INSERT INTO votos (votacion_id, candidato_id, fingerprint) VALUES (?, ?, NULL)');
    for (let i = 0; i < cantidad; i++) {
      stmt.run(votacion.id, candidato_id);
    }
    stmt.finalize(err => {
      if (err) {
        return res.status(500).json({ error: 'Error al registrar votos manuales' });
      }

      const io = require('../socket').getIO();
      io.emit('nuevoVoto'); 

      res.json({ mensaje: `${cantidad} voto(s) manual(es) registrado(s)` });
    });
  });
});