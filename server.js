const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve i file statici (html, css, mp3)
app.use(express.static(__dirname)); 
// NOTA: Se hai una cartella 'public', usa: app.use(express.static(path.join(__dirname, 'public')));
// Ma dato che hai i file nella root, usa __dirname come sopra.

// --- STATO INIZIALE (FIX: Mai usare null, ma oggetti vuoti) ---
let stato = {
  1: { nome: "", scelta: null },
  2: { nome: "", scelta: null },
  3: { nome: "", scelta: null },
  4: { nome: "", scelta: null }
};

io.on('connection', (socket) => {
  console.log('Nuovo client connesso');

  // Appena uno si collega, gli mandiamo la situazione attuale
  socket.emit('aggiorna', stato);

  // --- 1. LOGIN GIUDICE (Per vedere il nome prima che voti) ---
  socket.on('login', (data) => {
    // data può essere { slot: 1, nome: "Mario" }
    const { slot, nome } = data;
    if (stato[slot]) {
      stato[slot].nome = nome;
      stato[slot].scelta = null; // Reset voto al login
      io.emit('aggiorna', stato);
      console.log(`Giudice connesso allo slot ${slot}: ${nome}`);
    }
  });

  // --- 2. VOTO (O SCELTA) ---
  // Gestiamo sia 'voto' che 'scelta' per compatibilità con vecchi codici
  socket.on('voto', (data) => handleVoto(data));
  socket.on('scelta', (data) => handleVoto(data));

  function handleVoto(data) {
    const { slot, nome, scelta } = data;
    
    if (stato[slot]) {
      // Aggiorniamo il nome se presente, altrimenti teniamo quello vecchio
      if(nome) stato[slot].nome = nome; 
      
      stato[slot].scelta = scelta;

      // Aggiorna tutti
      io.emit('aggiorna', stato);

      // Se è X o VAI, manda il suono
      if (scelta === 'X' || scelta === 'VAI') {
        io.emit('suono', scelta);
      }
    }
  }

  // --- 3. RESET SOLO VOTI (Nuovo Concorrente) ---
  socket.on('reset', () => {
    console.log("Reset Voti richiesto");
    for (let i = 1; i <= 4; i++) {
      // Manteniamo il nome, cancelliamo solo la scelta
      stato[i].scelta = null;
    }
    io.emit('aggiorna', stato);
  });

  // --- 4. RESET TOTALE (Scollega Giudici) ---
  socket.on('reset-giudici', () => {
    console.log("Reset Totale richiesto");
    for (let i = 1; i <= 4; i++) {
      // Reimposta a oggetto vuoto (NON NULL, altrimenti crasha la regia)
      stato[i] = { nome: "", scelta: null };
    }
    io.emit('aggiorna', stato);
    io.emit('logout'); // Comando per far ricaricare i telefoni dei giudici
  });

  socket.on('disconnect', () => {
    // console.log('Client disconnesso');
  });
});

server.listen(PORT, () => {
  console.log(`Server attivo su http://localhost:${PORT}`);
});
