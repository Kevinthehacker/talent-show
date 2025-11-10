const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Stato iniziale dei 4 slot
let stato = {
  1: null,
  2: null,
  3: null,
  4: null
};

// Serve i file statici
app.use(express.static(path.join(__dirname, 'public')));

// Socket
io.on('connection', (socket) => {
  console.log('Nuovo client connesso');

  // Invia stato iniziale
  socket.emit('aggiorna', stato);

  // Riceve scelta da un giudice
  socket.on('scelta', ({ slot, nome, scelta }) => {
    if (slot >= 1 && slot <= 4 && (scelta === 'X' || scelta === 'VAI')) {
      stato[slot] = { nome, scelta };

      // Invia aggiornamento a tutti i client
      io.emit('aggiorna', stato);

      // Invia suono a tutti i client (inclusa la dashboard)
      io.emit('suono', scelta);
    } else {
      socket.emit('errore', 'Scelta non valida');
    }
  });

  socket.on('reset-giudici', () => {
  for (let i = 1; i <= 4; i++) {
    giudici[i] = null;
  }
  io.emit('aggiorna', giudici); // aggiorna dashboard
  io.emit('logout'); // forza logout sui dispositivi dei giudici
});

  // Reset concorrente
  socket.on('reset', () => {
    for (let i = 1; i <= 4; i++) {
      if (stato[i]) {
        stato[i].scelta = null;
      }
    }

    io.emit('aggiorna', stato);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnesso');
  });
});

// Avvia il server
server.listen(PORT, () => {
  console.log(`Server attivo su http://localhost:${PORT}`);

});
