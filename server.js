const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// IMPORTANTE PER RENDER: Usa la porta assegnata o la 3000 se sei in locale
const PORT = process.env.PORT || 3000;

// --- DEBUG: Vediamo cosa c'è nella cartella su Render ---
console.log("📂 Cartella di lavoro:", __dirname);
const files = fs.readdirSync(__dirname);
console.log("📄 File trovati:", files.join(", "));

// SERVE I FILE STATICI
// Questo dice: "Cerca i file html/mp3 direttamente nella cartella principale"
app.use(express.static(__dirname));

// ROTTE ESPLICITE (Per sicurezza su Render)
app.get('/', (req, res) => {
    // Se index.html non esiste, evita crash e dillo
    if (fs.existsSync(path.join(__dirname, 'index.html'))) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.send("ERRORE: File index.html non trovato! Controlla il nome del file (maiuscole/minuscole).");
    }
});

app.get('/regia', (req, res) => {
    if (fs.existsSync(path.join(__dirname, 'regia.html'))) {
        res.sendFile(path.join(__dirname, 'regia.html'));
    } else {
        res.send("ERRORE: File regia.html non trovato!");
    }
});

// --- LOGICA SOCKET.IO ---
let stato = {
  1: { nome: "", scelta: null },
  2: { nome: "", scelta: null },
  3: { nome: "", scelta: null },
  4: { nome: "", scelta: null }
};

io.on('connection', (socket) => {
  // console.log('Client connesso'); // Commentato per pulizia log
  socket.emit('aggiorna', stato);

  // 1. LOGIN
  socket.on('login', (data) => {
    const { slot, nome } = data;
    if (stato[slot]) {
      stato[slot].nome = nome;
      stato[slot].scelta = null;
      io.emit('aggiorna', stato);
      console.log(`Login Slot ${slot}: ${nome}`);
    }
  });

  // 2. VOTO
  socket.on('voto', (data) => handleVoto(data));
  socket.on('scelta', (data) => handleVoto(data)); // Compatibilità

  function handleVoto(data) {
    const { slot, nome, scelta } = data;
    if (stato[slot]) {
      if(nome) stato[slot].nome = nome; 
      stato[slot].scelta = scelta;
      io.emit('aggiorna', stato);
      
      // Manda suono alla regia
      if (scelta === 'X' || scelta === 'VAI') {
        io.emit('suono', 'X');
      }
    }
  }

  // 3. RESET GARA (Solo voti)
  socket.on('reset', () => {
    console.log("Reset Voti");
    for (let i = 1; i <= 4; i++) {
      stato[i].scelta = null;
    }
    io.emit('aggiorna', stato);
  });

  // 4. RESET TOTALE (Scollega Giudici)
  socket.on('reset-giudici', () => {
    console.log("Reset Totale");
    for (let i = 1; i <= 4; i++) {
      stato[i] = { nome: "", scelta: null };
    }
    io.emit('aggiorna', stato);
    io.emit('logout'); 
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server avviato sulla porta ${PORT}`);
});
