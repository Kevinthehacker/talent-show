const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const publicPath = path.join(__dirname, 'public');

app.use(express.static(publicPath));

app.get('/', (req, res) => res.sendFile(path.join(publicPath, 'index.html')));
app.get('/regia', (req, res) => res.sendFile(path.join(publicPath, 'regia.html')));

let stato = {
  1: { nome: "", scelta: null },
  2: { nome: "", scelta: null },
  3: { nome: "", scelta: null },
  4: { nome: "", scelta: null }
};

let concorrenteAttuale = { nome: "In attesa...", id: "" };

io.on('connection', (socket) => {
  socket.emit('aggiorna', stato);
  socket.emit('cambia-concorrente', concorrenteAttuale);

  socket.on('login', (data) => {
    const { slot, nome } = data;
    if (stato[slot]) {
      stato[slot].nome = nome;
      stato[slot].scelta = null;
      io.emit('aggiorna', stato);
      console.log(`Login Slot ${slot}: ${nome}`);
    }
  });

  socket.on('voto', (data) => {
    const { slot, scelta } = data;
    if (stato[slot]) {
      stato[slot].scelta = scelta;
      io.emit('aggiorna', stato);
      if (scelta === 'X' || scelta === 'VAI') io.emit('suono', 'X');
    }
  });

  socket.on('set-concorrente', (dati) => {
      concorrenteAttuale = dati;
      io.emit('cambia-concorrente', concorrenteAttuale); 
  });

  // --- NUOVO: SINCRONIZZAZIONE VIDEO GIUDICI ---
  socket.on('controllo-video', (azione) => {
      // azione può essere 'play', 'pause', 'stop'
      io.emit('sync-video', azione);
  });
  // ---------------------------------------------

  socket.on('reset', () => {
    for (let i = 1; i <= 4; i++) stato[i].scelta = null;
    io.emit('aggiorna', stato);
  });

  socket.on('reset-giudici', () => {
    for (let i = 1; i <= 4; i++) stato[i] = { nome: "", scelta: null };
    io.emit('aggiorna', stato);
    io.emit('logout'); 
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server attivo su porta ${PORT}`);
});
