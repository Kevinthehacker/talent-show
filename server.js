const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// --- 1. CONFIGURAZIONE PERCORSI ---
// Definiamo dove si trova la cartella 'public' rispetto a server.js
const publicPath = path.join(__dirname, 'public');

console.log("📂 Cartella Root:", __dirname);
console.log("📂 Cartella Public:", publicPath);

// Controllo di sicurezza: Vediamo se i file esistono davvero lì
if (fs.existsSync(path.join(publicPath, 'index.html'))) {
    console.log("✅ index.html trovato in /public");
} else {
    console.log("❌ ERRORE: index.html NON trovato in /public. Controlla la cartella!");
}

// --- 2. SERVE I FILE STATICI ---
// Diciamo a Express: "Tutti i file (html, mp3, css) sono dentro 'public'"
app.use(express.static(publicPath));

// --- 3. ROTTE SPECIFICHE ---

// Quando vai sulla Home, invia public/index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// Quando vai su /regia, invia public/regia.html
app.get('/regia', (req, res) => {
    res.sendFile(path.join(publicPath, 'regia.html'));
});


// --- 4. LOGICA SOCKET (Invariata) ---
let stato = {
  1: { nome: "", scelta: null },
  2: { nome: "", scelta: null },
  3: { nome: "", scelta: null },
  4: { nome: "", scelta: null }
};

io.on('connection', (socket) => {
  socket.emit('aggiorna', stato);

  socket.on('login', (data) => {
    const { slot, nome } = data;
    if (stato[slot]) {
      stato[slot].nome = nome;
      stato[slot].scelta = null;
      io.emit('aggiorna', stato);
      console.log(`Login Slot ${slot}: ${nome}`);
    }
  });

  socket.on('voto', (data) => handleVoto(data));
  socket.on('scelta', (data) => handleVoto(data));

  function handleVoto(data) {
    const { slot, nome, scelta } = data;
    if (stato[slot]) {
      if(nome) stato[slot].nome = nome; 
      stato[slot].scelta = scelta;
      io.emit('aggiorna', stato);
      if (scelta === 'X' || scelta === 'VAI') io.emit('suono', 'X');
    }
  }

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
  console.log(`✅ Server attivo sulla porta ${PORT}`);
});
