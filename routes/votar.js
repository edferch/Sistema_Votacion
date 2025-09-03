const express = require('express');
const db = require('../data/database');
const router = express.Router();
const socket = require('../socket');
const io = socket.getIO();

router.post('/', (req, res) => {
  const { votacion_id, candidato_id, fingerprint } = req.body;

  db.get(
    'SELECT * FROM votos WHERE votacion_id = ? AND fingerprint = ?',
    [votacion_id, fingerprint],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Error de base de datos' });
      if (row) {
        return res.json({ mensaje: 'Ya votaste en esta elección' });
      }

      db.run(
        'INSERT INTO votos (votacion_id, candidato_id, fingerprint) VALUES (?, ?, ?)',
        [votacion_id, candidato_id, fingerprint],
        function (err2) {
          if (err2) return res.status(500).json({ error: 'No se pudo registrar el voto' });

          db.all(
            `SELECT candidatos.nombre, COUNT(votos.id) as votos
             FROM candidatos
             LEFT JOIN votos ON candidatos.id = votos.candidato_id
             WHERE candidatos.votacion_id = ?
             GROUP BY candidatos.id`,
            [votacion_id],
            (err3, rows) => {
              if (!err3) {
                io.emit('actualizarResultados', rows);
              }
            }
          );

          res.json({ mensaje: '¡Voto registrado!' });
        }
      );
    }
  );
});

module.exports = router;