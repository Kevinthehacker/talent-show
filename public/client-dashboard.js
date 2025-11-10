const socket = io();

const btnReset = document.getElementById('btnReset');
const audioX = document.getElementById('audioX');
const audioVAI = document.getElementById('audioVAI');

// Riattiva animazione glow rotante
function triggerAnimazione(cerchio) {
  cerchio.classList.remove('attivo');
  void cerchio.offsetWidth; // forza reflow
  cerchio.classList.add('attivo');
}

// Aggiorna dashboard
function renderGiudici(stato) {
  for (let i = 1; i <= 4; i++) {
    const slot = stato[i];
    const nomeEl = document.querySelector(`#slot${i} .giudice-nome`);
    const cerchioX = document.getElementById(`slot${i}x`);
    const cerchioVAI = document.getElementById(`slot${i}vai`);

    if (slot) {
      nomeEl.textContent = slot.nome;

      // reset animazioni
      cerchioX.classList.remove('attivo');
      cerchioVAI.classList.remove('attivo');

      if (slot.scelta === 'X') {
        triggerAnimazione(cerchioX);
      } else if (slot.scelta === 'VAI') {
        triggerAnimazione(cerchioVAI);
      }
    } else {
      nomeEl.textContent = `Slot ${i}`;
      cerchioX.classList.remove('attivo');
      cerchioVAI.classList.remove('attivo');
    }
  }
}

// Reset concorrente
btnReset.addEventListener('click', () => {
  socket.emit('reset');
});

// Ricezione aggiornamenti
socket.on('aggiorna', (stato) => {
  renderGiudici(stato);
});

const btnResetGiudici = document.getElementById('btnResetGiudici');
btnResetGiudici.addEventListener('click', () => {
    if (confirm("Sei sicuro di voler resettare tutti i giudici?")) {
        socket.emit('reset-giudici');
    }
});

// Riproduzione suoni
socket.on('suono', (scelta) => {
  if (scelta === 'X') {
    audioX.currentTime = 0;
    audioX.play();
  }
  if (scelta === 'VAI') {
    audioVAI.currentTime = 0;
    audioVAI.play();
  }
});

// Eventuali errori lato server
socket.on('errore', (msg) => {
  alert(msg);
});

