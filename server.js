const express = require('express');
const path = require('path');
const http = require('http');
const app = express();
const server = http.createServer(app);

const socket = require('./socket');
const io = socket.init(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

const votarRoutes = require('./routes/votar');
app.use('/votar', votarRoutes);


const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en http://${getLocalIP()}:${PORT}`);
});

function getLocalIP() {
  const os = require('os');
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

module.exports = { io };