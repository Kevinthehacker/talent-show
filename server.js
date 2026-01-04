const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Porta per Render (o 3000 in locale)
const PORT = process.env.PORT || 3000;

// --- 1. CONFIGURAZIONE CARTELLE ---
// Il server è nella root, i file html sono in /public
const publicPath = path.join(__dirname, 'public');

// Debug per sicurezza (ti dice dove sta cercando i file)
console.log("📂 Cartella Public:", publicPath);

// Serve i file statici (HTML, CSS, MP3)
app.use(express.static(publicPath));

// --- 2. ROTTE (Per far funzionare i link su Render) ---
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/regia', (req, res) => {
    res.sendFile(path.join(publicPath, 'regia.html'));
});

// --- 3. MEMORIA DEL SERVER ---
let stato = {
  1: { nome: "", scelta: null },
  2: { nome: "", scelta: null },
  3: { nome: "", scelta: null },
  4: { nome: "", scelta: null }
};

let concorrenteAttuale = "In attesa dell'inizio...";

// --- 4. GESTIONE SOCKET (La Logica) ---
io.on('connection', (socket) => {
  // Appena qualcuno si collega, riceve lo stato e il nome del cantante
  socket.emit('aggiorna', stato);
  socket.emit('cambia-nome', concorrenteAttuale);

  // A. LOGIN GIUDICE
  socket.on('login', (data) => {
    const { slot, nome } = data;
    if (stato[slot]) {
      stato[slot].nome = nome;
      stato[slot].scelta = null; // Resetta il voto precedente se cambia nome
      io.emit('aggiorna', stato);
      console.log(`✅ Giudice connesso Slot ${slot}: ${nome}`);
    }
  });

  // B. VOTO (Solo X o VAI)
  socket.on('voto', (data) => {
    const { slot, scelta } = data;
    if (stato[slot]) {
      stato[slot].scelta = scelta;
      
      // Aggiorna tutti (Regia e altri)
      io.emit('aggiorna', stato);
      
      // Se vota, manda il suono alla regia
      if (scelta === 'X' || scelta === 'VAI') {
          io.emit('suono', scelta);
      }
    }
  });

  // C. CAMBIO NOME CONCORRENTE (Dalla Regia ai Telefoni)
  socket.on('set-concorrente', (nome) => {
      concorrenteAttuale = nome;
      io.emit('cambia-nome', concorrenteAttuale); // Aggiorna i display dei giudici
      console.log("🎤 In gara ora:", nome);
  });

  // D. RESET GARA (Nuovo Concorrente)
  socket.on('reset', () => {
    console.log("🔄 Reset Voti (Nuovo Concorrente)");
    for (let i = 1; i <= 4; i++) {
      stato[i].scelta = null; // Cancella solo i voti, tiene i nomi
    }
    io.emit('aggiorna', stato);
  });

  // E. RESET TOTALE (Nuova Giuria)
  socket.on('reset-giudici', () => {
    console.log("⚠️ Reset Totale Giudici");
    for (let i = 1; i <= 4; i++) {
      stato[i] = { nome: "", scelta: null }; // Cancella tutto
    }
    io.emit('aggiorna', stato);
    io.emit('logout'); // Forza il riavvio della pagina sui telefoni
  });
});

// Avvio Server
server.listen(PORT, () => {
  console.log(`🚀 Server attivo sulla porta ${PORT}`);
  console.log(`- Giudici: http://localhost:${PORT}/`);
  console.log(`- Regia:   http://localhost:${PORT}/regia`);
});
