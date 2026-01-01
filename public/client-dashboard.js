const socket = io();

const btnReset = document.getElementById('btnReset');
const btnResetGiudici = document.getElementById('btnResetGiudici');
// Usiamo solo audioVAI come richiesto per il suono della X
const audioVAI = document.getElementById('audioVAI');

// Riattiva animazione glow rotante
function triggerAnimazione(cerchio) {
  cerchio.classList.remove('attivo');
  void cerchio.offsetWidth; // forza reflow per riavviare animazione
  cerchio.classList.add('attivo');
}

// Aggiorna dashboard
function renderGiudici(stato) {
  for (let i = 1; i <= 4; i++) {
    const slot = stato[i];
    const nomeEl = document.querySelector(`#slot${i} .giudice-nome`);
    const cerchioX = document.getElementById(`slot${i}x`);

    if (slot) {
      nomeEl.textContent = slot.nome;

      // Se la scelta è 'X', attiviamo l'animazione se non è già attiva
      // (Oppure la riattiviamo ad ogni aggiornamento se preferisci l'effetto pulsante)
      if (slot.scelta === 'X') {
        if (!cerchioX.classList.contains('attivo')) {
             triggerAnimazione(cerchioX);
        }
      } else {
        // Se non è X (o reset), spegniamo
        cerchioX.classList.remove('attivo');
      }
    } else {
      // Slot vuoto / disconnesso
      nomeEl.textContent = `Slot ${i}`;
      cerchioX.classList.remove('attivo');
    }
  }
}

// Reset concorrente (svuota i voti attuali)
btnReset.addEventListener('click', () => {
  socket.emit('reset');
});

// Reset totale giudici (rimuove i nomi)
btnResetGiudici.addEventListener('click', () => {
    if (confirm("Sei sicuro di voler resettare tutti i giudici?")) {
        socket.emit('reset-giudici');
    }
});

// Ricezione stato completo
socket.on('aggiorna', (stato) => {
  renderGiudici(stato);
});

// Riproduzione suoni
socket.on('suono', (scelta) => {
  // Se la scelta è X, suoniamo vai.mp3
  if (scelta === 'X') {
    audioVAI.currentTime = 0;
    audioVAI.play().catch(e => console.log("Errore riproduzione audio:", e));
  }
});

// Eventuali errori
socket.on('errore', (msg) => {
  alert(msg);
});
